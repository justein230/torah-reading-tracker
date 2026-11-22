/** File types the "Import DB" picker offers on platforms that understand extensions. */
export const DB_FILE_ACCEPT = '.db,.sqlite,.sqlite3,application/vnd.sqlite3';

/**
 * The `accept` attribute for the DB import file input on a Capacitor platform.
 *
 * iOS's WebView maps `accept` to system file types (UTIs), and `.db` has none, so a
 * backup named `*.db` shows up greyed out in the Files picker. On iOS we offer every
 * file instead; the import itself rejects anything without the SQLite header.
 *
 * @param platform `Capacitor.getPlatform()`: 'ios', 'android' or 'web'
 */
export function dbFileAccept(platform: string): string | undefined {
  return platform === 'ios' ? undefined : DB_FILE_ACCEPT;
}
