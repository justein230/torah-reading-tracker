import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { createDb } from '../src/db/drizzle-server.js';
import { initDb } from '../src/db/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.TORAH_DB_PATH ?? path.join(__dirname, '../torah.db');

const rawDb = new Database(dbPath);
rawDb.pragma('journal_mode = DELETE');
rawDb.pragma('foreign_keys = OFF'); // must be off during migrations (table recreations need it)
const db = createDb(rawDb);
initDb(rawDb, db, path.join(__dirname, '../drizzle'));
rawDb.pragma('foreign_keys = ON');
rawDb.close();
console.log(`Initialized ${dbPath}`);
