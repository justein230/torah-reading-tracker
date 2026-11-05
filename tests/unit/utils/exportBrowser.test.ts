// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';

const {
  isNativePlatform, fetchAliyot, fetchMeta, toBlob, writeFile, copy, getUri, share, getUrl, stat, deleteFile, mkdir,
} = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  fetchAliyot: vi.fn(),
  fetchMeta: vi.fn(),
  toBlob: vi.fn(() => Promise.resolve(new Blob(['x']))),
  writeFile: vi.fn((_opts: unknown) => Promise.resolve()),
  copy: vi.fn((_opts: unknown) => Promise.resolve({ uri: '' })),
  getUri: vi.fn((_opts: unknown) => Promise.resolve({ uri: 'file:///cache/torah-readings.xlsx' })),
  share: vi.fn((_opts: unknown) => Promise.resolve()),
  getUrl: vi.fn((_opts: unknown) => Promise.resolve({ url: 'file:///data/torah.db' })),
  stat: vi.fn((_opts: unknown): Promise<object> => Promise.reject(new Error('File does not exist'))),
  deleteFile: vi.fn((_opts: unknown) => Promise.resolve()),
  mkdir: vi.fn((_opts: unknown) => Promise.resolve()),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => isNativePlatform() } }));

vi.mock('../../../src/api.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/api.js')>('../../../src/api.js');
  return { ...actual, fetchAliyot: () => fetchAliyot(), fetchMeta: () => fetchMeta() };
});

vi.mock('write-excel-file/browser', () => ({ default: () => ({ toBlob }) }));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: (a: unknown) => writeFile(a), copy: (a: unknown) => copy(a), getUri: (a: unknown) => getUri(a),
    stat: (a: unknown) => stat(a), deleteFile: (a: unknown) => deleteFile(a), mkdir: (a: unknown) => mkdir(a),
  },
  Directory: { Cache: 'CACHE', Documents: 'DOCUMENTS' },
}));

vi.mock('@capacitor/share', () => ({ Share: { share: (a: unknown) => share(a) } }));

vi.mock('@capacitor-community/sqlite', () => ({ CapacitorSQLite: { getUrl: (a: unknown) => getUrl(a) } }));

import { exportExcel, exportDb, saveDbToDocuments } from '../../../src/utils/export.js';

function stubAnchor() {
  const click = vi.fn();
  const anchor = { href: '', download: '', click } as unknown as HTMLAnchorElement;
  // Electron's types add a createElement('webview') overload, and spyOn types the
  // mock from the last overload, so narrow it to the generic signature.
  const createElement = vi.spyOn(document, 'createElement') as unknown as MockInstance<(tag: string) => HTMLElement>;
  createElement.mockReturnValue(anchor);
  return { anchor, click };
}

beforeEach(() => {
  isNativePlatform.mockReturnValue(false);
  fetchAliyot.mockResolvedValue([
    { sefer: 'בְּרֵאשִׁית', parsha: 'Bereishit', aliyah: '1', pair_name: null, pseukim: 20, pct: 1, orig: '2024-01-01', fut: null, occasion: null },
  ]);
  fetchMeta.mockResolvedValue({ sefarim: [{ name: 'בְּרֵאשִׁית', name_en: 'Genesis' }] });
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock');
  globalThis.URL.revokeObjectURL = vi.fn();
});

afterEach(() => { vi.restoreAllMocks(); });

describe('exportExcel — browser', () => {
  it('builds a workbook and triggers a download when not on a native platform', async () => {
    const { anchor, click } = stubAnchor();
    await exportExcel();

    expect(fetchAliyot).toHaveBeenCalled();
    expect(fetchMeta).toHaveBeenCalled();
    expect(toBlob).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(anchor.download).toMatch(/^torah-readings-\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();
  });
});

describe('exportExcel — native platform', () => {
  it('writes the file and shares it via Capacitor APIs', async () => {
    isNativePlatform.mockReturnValue(true);
    await exportExcel();

    expect(writeFile).toHaveBeenCalled();
    expect(getUri).toHaveBeenCalled();
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: 'file:///cache/torah-readings.xlsx' }));
  });
});

describe('exportDb — browser', () => {
  it('fetches the DB blob and triggers a download when not on a native platform', async () => {
    const { anchor, click } = stubAnchor();
    const blob = new Blob(['db']);
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(blob) })));

    await exportDb();

    expect(click).toHaveBeenCalled();
    expect(anchor.download).toBe('torah.db');
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('downloads under the given file name', async () => {
    const { anchor } = stubAnchor();
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(new Blob(['db'])) })));

    await exportDb('readings-20261105.db');

    expect(anchor.download).toBe('readings-20261105.db');
    vi.unstubAllGlobals();
  });
});

describe('exportDb — native platform', () => {
  // Android's share sheet can't read the app's databases/ folder, so the live file must be
  // copied into the cache dir and the copy shared.
  it('copies the native DB into the cache dir and shares the copy', async () => {
    isNativePlatform.mockReturnValue(true);
    getUri.mockResolvedValueOnce({ uri: 'file:///cache/torah.db' });
    await exportDb();

    expect(getUrl).toHaveBeenCalledWith({ database: 'torah' });
    expect(copy).toHaveBeenCalledWith({ from: 'file:///data/torah.db', to: 'torah.db', toDirectory: 'CACHE' });
    expect(getUri).toHaveBeenCalledWith({ path: 'torah.db', directory: 'CACHE' });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: 'file:///cache/torah.db' }));
  });

  it('throws without sharing when the DB location is unknown', async () => {
    isNativePlatform.mockReturnValue(true);
    getUrl.mockResolvedValueOnce({ url: '' });
    await expect(exportDb()).rejects.toThrow('Could not locate the database');
    expect(share).not.toHaveBeenCalled();
  });
});

describe('exportDb — native platform, custom name', () => {
  it('shares the cache copy under the given file name', async () => {
    isNativePlatform.mockReturnValue(true);
    await exportDb('readings-20261105.db');

    expect(copy).toHaveBeenCalledWith({ from: 'file:///data/torah.db', to: 'readings-20261105.db', toDirectory: 'CACHE' });
    expect(getUri).toHaveBeenCalledWith({ path: 'readings-20261105.db', directory: 'CACHE' });
  });
});

describe('saveDbToDocuments', () => {
  beforeEach(() => {
    copy.mockClear();
    deleteFile.mockClear();
    mkdir.mockReset();
    mkdir.mockResolvedValue(undefined);
    stat.mockReset();
    stat.mockRejectedValue(new Error('File does not exist'));
  });

  it('creates the Torah Tracker folder and copies the live DB into it when no file of that name exists', async () => {
    await expect(saveDbToDocuments('torah-20261105.db')).resolves.toBe('saved');

    expect(mkdir).toHaveBeenCalledWith({ path: 'Torah Tracker', directory: 'DOCUMENTS', recursive: true });
    expect(stat).toHaveBeenCalledWith({ path: 'Torah Tracker/torah-20261105.db', directory: 'DOCUMENTS' });
    expect(copy).toHaveBeenCalledWith({ from: 'file:///data/torah.db', to: 'Torah Tracker/torah-20261105.db', toDirectory: 'DOCUMENTS' });
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it('leaves an existing file alone and reports it, unless told to overwrite', async () => {
    stat.mockResolvedValue({});
    await expect(saveDbToDocuments('torah.db')).resolves.toBe('exists');

    expect(copy).not.toHaveBeenCalled();
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it('replaces an existing file when overwrite is set', async () => {
    stat.mockResolvedValue({});
    await expect(saveDbToDocuments('torah.db', true)).resolves.toBe('saved');

    expect(deleteFile).toHaveBeenCalledWith({ path: 'Torah Tracker/torah.db', directory: 'DOCUMENTS' });
    expect(copy).toHaveBeenCalledWith({ from: 'file:///data/torah.db', to: 'Torah Tracker/torah.db', toDirectory: 'DOCUMENTS' });
  });

  it('propagates a failed delete (Android 11+ file owned by a previous install) without copying', async () => {
    stat.mockResolvedValue({});
    deleteFile.mockRejectedValueOnce(new Error('Permission denied'));
    await expect(saveDbToDocuments('torah.db', true)).rejects.toThrow('Permission denied');
    expect(copy).not.toHaveBeenCalled();
  });

  it('still copies when the folder already exists (mkdir rejects)', async () => {
    mkdir.mockRejectedValueOnce(new Error('Directory exists'));
    await expect(saveDbToDocuments('torah.db')).resolves.toBe('saved');
    expect(copy).toHaveBeenCalledWith({ from: 'file:///data/torah.db', to: 'Torah Tracker/torah.db', toDirectory: 'DOCUMENTS' });
  });

  it('throws when the DB location is unknown', async () => {
    getUrl.mockResolvedValueOnce({ url: '' });
    await expect(saveDbToDocuments('torah.db')).rejects.toThrow('Could not locate the database');
    expect(copy).not.toHaveBeenCalled();
  });
});
