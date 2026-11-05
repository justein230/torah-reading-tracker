// Builds the filename for a DB export from the name the user typed in the export dialog.

export const DEFAULT_DB_EXPORT_BASE = 'torah';
export const DB_EXPORT_EXT          = '.db';

// Characters Android, Windows and macOS filesystems reject (or that would make a path), plus
// control characters.
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS   = /[/\\:*?"<>|\x00-\x1f]/g;
// An extension the user typed themselves; we add our own.
const SQLITE_EXT     = /\.(db|sqlite3?)$/i;

// Local yyyymmdd, so the stamp matches the user's calendar day, not UTC's.
export function dateStamp(date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const dd   = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

// The typed name made safe to use as a filename: unsafe characters become '-', any .db/.sqlite
// extension is dropped, leading dots are removed (no hidden files), and an empty result falls
// back to the default.
export function sanitizeBaseName(name: string): string {
  const cleaned = name
    .replace(UNSAFE_CHARS, '-')
    .trim()
    .replace(SQLITE_EXT, '')
    .replace(/^\.+/, '')
    .trim();
  return cleaned || DEFAULT_DB_EXPORT_BASE;
}

export function dbExportFileName(name: string, withDateSuffix: boolean, now: Date = new Date()): string {
  const base = sanitizeBaseName(name);
  return `${withDateSuffix ? `${base}-${dateStamp(now)}` : base}${DB_EXPORT_EXT}`;
}
