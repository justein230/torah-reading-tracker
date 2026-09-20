import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { createDb } from '../src/db/drizzle-server.js';
import { initDb } from '../src/db/init.js';
import { NATIVE_DB_VERSION } from '../src/db/nativeMigrations.generated.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.TORAH_DB_PATH ?? path.join(__dirname, '../torah.db');

const rawDb = new Database(dbPath);
rawDb.pragma('journal_mode = DELETE');
rawDb.pragma('foreign_keys = OFF'); // must be off during migrations (table recreations need it)
const db = createDb(rawDb);
initDb(rawDb, db, path.join(__dirname, '../drizzle'));
rawDb.pragma('foreign_keys = ON');
// Stamps the baked-in schema version so @capacitor-community/sqlite's version-upgrade
// mechanism (see src/db/native.ts) doesn't try to replay already-applied migrations
// against a freshly-copied asset db on first native app launch.
rawDb.pragma(`user_version = ${NATIVE_DB_VERSION}`);
rawDb.close();
console.log(`Initialized ${dbPath}`);
