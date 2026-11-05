// Base64-encodes raw bytes using only browser APIs. Code that runs in the Capacitor WebView must
// use this instead of Node's Buffer, which doesn't exist there (Vite doesn't polyfill it).
// Bytes are turned into a binary string in chunks: spreading a whole database file into
// String.fromCharCode at once would exceed the engine's argument limit.
const CHUNK_SIZE = 0x8000;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}
