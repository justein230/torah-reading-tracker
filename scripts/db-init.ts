import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { initDb } from '../src/db/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.TORAH_DB_PATH ?? path.join(__dirname, '../torah.db');

const rawDb = new Database(dbPath);
rawDb.pragma('journal_mode = DELETE');
rawDb.pragma('foreign_keys = OFF'); // must be off during migrations (table recreations need it)
// Also leaves PRAGMA user_version at the latest step, so @capacitor-community/sqlite's
// version-upgrade mechanism (see src/db/native.ts) doesn't try to replay already-applied
// migrations against a freshly-copied asset db on first native app launch.
// Stamped with this build's version so the native app's first pre-migration backup can name it.
const { version: appVersion } = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
initDb(rawDb, path.join(__dirname, '../drizzle'), console.log, { appVersion });
rawDb.pragma('foreign_keys = ON');
rawDb.close();
console.log(`Initialized ${dbPath}`);
