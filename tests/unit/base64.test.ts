import { describe, it, expect } from 'vitest';
import { bytesToBase64 } from '../../src/utils/base64.js';

// Node's Buffer is the reference encoder here; the helper exists because the WebView lacks it.
const viaBuffer = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

describe('bytesToBase64', () => {
  it('encodes an empty array to an empty string', () => {
    expect(bytesToBase64(new Uint8Array())).toBe('');
  });

  it('encodes ASCII bytes', () => {
    expect(bytesToBase64(new TextEncoder().encode('SQLite format 3'))).toBe('U1FMaXRlIGZvcm1hdCAz');
  });

  it('encodes every byte value, including high bytes', () => {
    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(bytesToBase64(all)).toBe(viaBuffer(all));
  });

  it('matches Buffer on input larger than one chunk without overflowing the stack', () => {
    const big = Uint8Array.from({ length: 1_000_003 }, (_, i) => (i * 31 + 7) & 0xff);
    expect(bytesToBase64(big)).toBe(viaBuffer(big));
  });

  it('encodes only the view, not the whole underlying buffer', () => {
    const backing = Uint8Array.from([1, 2, 3, 4, 5, 6]);
    const view    = backing.subarray(2, 5);
    expect(bytesToBase64(view)).toBe(viaBuffer(Uint8Array.from([3, 4, 5])));
  });
});
