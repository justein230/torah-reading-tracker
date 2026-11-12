// Builds the filename for an export from the name the user typed in the export dialog.

export interface ExportFormat {
  readonly defaultBase: string; // used when the typed name is empty
  readonly ext:         string; // our extension, with the dot
  readonly typedExt:    RegExp; // an extension the user might type themselves; we add our own
}

export const DB_EXPORT_FORMAT: ExportFormat = {
  defaultBase: 'torah',
  ext:         '.db',
  typedExt:    /\.(db|sqlite3?)$/i,
};

export const EXCEL_EXPORT_FORMAT: ExportFormat = {
  defaultBase: 'torah-readings',
  ext:         '.xlsx',
  typedExt:    /\.xlsx?$/i,
};

// Characters Android, Windows and macOS filesystems reject (or that would make a path), plus
// control characters.
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS = /[/\\:*?"<>|\x00-\x1f]/g;

// Local yyyymmdd, so the stamp matches the user's calendar day, not UTC's.
export function dateStamp(date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const dd   = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

// The typed name made safe to use as a filename: unsafe characters become '-', a typed extension
// of the format's kind (e.g. .db/.sqlite) is dropped, leading dots are removed (no hidden files),
// and an empty result falls back to the format's default.
export function sanitizeBaseName(name: string, format: ExportFormat): string {
  const cleaned = name
    .replace(UNSAFE_CHARS, '-')
    .trim()
    .replace(format.typedExt, '')
    .replace(/^\.+/, '')
    .trim();
  return cleaned || format.defaultBase;
}

export function exportFileName(
  name: string, format: ExportFormat, withDateSuffix: boolean, now: Date = new Date(),
): string {
  const base = sanitizeBaseName(name, format);
  return `${withDateSuffix ? `${base}-${dateStamp(now)}` : base}${format.ext}`;
}
