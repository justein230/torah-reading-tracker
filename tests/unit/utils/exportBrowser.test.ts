import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  isNativePlatform, fetchAliyot, fetchMeta, toBlob, writeFile, getUri, share, getUrl,
} = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  fetchAliyot: vi.fn(),
  fetchMeta: vi.fn(),
  toBlob: vi.fn(() => Promise.resolve(new Blob(['x']))),
  writeFile: vi.fn((_opts: unknown) => Promise.resolve()),
  getUri: vi.fn((_opts: unknown) => Promise.resolve({ uri: 'file:///cache/torah-readings.xlsx' })),
  share: vi.fn((_opts: unknown) => Promise.resolve()),
  getUrl: vi.fn((_opts: unknown) => Promise.resolve({ url: 'file:///data/torah.db' })),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => isNativePlatform() } }));

vi.mock('../../../src/api.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/api.js')>('../../../src/api.js');
  return { ...actual, fetchAliyot: () => fetchAliyot(), fetchMeta: () => fetchMeta() };
});

vi.mock('write-excel-file/browser', () => ({ default: () => ({ toBlob }) }));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: (a: unknown) => writeFile(a), getUri: (a: unknown) => getUri(a) },
  Directory: { Cache: 'CACHE' },
}));

vi.mock('@capacitor/share', () => ({ Share: { share: (a: unknown) => share(a) } }));

vi.mock('@capacitor-community/sqlite', () => ({ CapacitorSQLite: { getUrl: (a: unknown) => getUrl(a) } }));

import { exportExcel, exportDb } from '../../../src/utils/export.js';

function stubAnchor() {
  const click = vi.fn();
  const anchor = { href: '', download: '', click } as unknown as HTMLAnchorElement;
  vi.spyOn(document, 'createElement').mockReturnValue(anchor);
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
});

describe('exportDb — native platform', () => {
  it('shares the native DB URL via Capacitor APIs', async () => {
    isNativePlatform.mockReturnValue(true);
    await exportDb();

    expect(getUrl).toHaveBeenCalledWith({ database: 'torah' });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: 'file:///data/torah.db' }));
  });
});
