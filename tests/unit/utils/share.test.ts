import { describe, it, expect, vi, beforeEach } from 'vitest';

const { share } = vi.hoisted(() => ({ share: vi.fn((_opts: unknown) => Promise.resolve()) }));

vi.mock('@capacitor/share', () => ({ Share: { share: (a: unknown) => share(a) } }));

import { isShareCanceled, shareFile } from '../../../src/utils/share.js';

beforeEach(() => { share.mockReset(); });

describe('isShareCanceled', () => {
  it('matches the plugin\'s cancel rejection', () => {
    expect(isShareCanceled(new Error('Share canceled'))).toBe(true);
  });

  it('rejects other errors and non-errors', () => {
    expect(isShareCanceled(new Error('Failed to find configured root'))).toBe(false);
    expect(isShareCanceled('Share canceled')).toBe(false);
    expect(isShareCanceled(undefined)).toBe(false);
  });
});

describe('shareFile', () => {
  const opts = { url: 'file:///cache/torah.db', title: 'Torah Readings DB', dialogTitle: 'Export Torah DB' };

  it('passes the options to the share sheet', async () => {
    share.mockResolvedValue(undefined);
    await shareFile(opts);
    expect(share).toHaveBeenCalledWith(opts);
  });

  it('resolves when the user dismisses the share sheet', async () => {
    share.mockRejectedValue(new Error('Share canceled'));
    await expect(shareFile(opts)).resolves.toBeUndefined();
  });

  it('rethrows any other failure', async () => {
    const err = new Error('Failed to find configured root');
    share.mockRejectedValue(err);
    await expect(shareFile(opts)).rejects.toBe(err);
  });
});
