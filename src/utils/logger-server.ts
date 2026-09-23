import fs   from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import pino from 'pino';
// Named import, not default: pino-http's default-export interop resolves differently
// under tsconfig.server.json's module/moduleResolution: NodeNext (used for the Electron
// build) than under the main tsconfig.json's bundler resolution — the named export
// avoids that mismatch entirely.
import { pinoHttp } from 'pino-http';

// Sensitive body fields that must never reach the log file, even at debug level.
const REDACT_BODY_KEYS = new Set(['password', 'currentPassword', 'newPassword', 'token']);

const MAX_BYTES    = 5 * 1024 * 1024; // rotate once the active file passes this size
const MAX_BACKUPS  = 3;               // app.log.1 .. app.log.3, oldest dropped

// Shifts app.log -> .1 -> .2 -> .3, dropping whatever was at .3. Same fixed-backup-count
// approach as MAX_BACKUPS in src/utils/import-server.ts.
function rotate(logPath: string, maxBackups: number): void {
  const oldest = `${logPath}.${maxBackups}`;
  if (fs.existsSync(oldest)) fs.rmSync(oldest);
  for (let i = maxBackups - 1; i >= 1; i--) {
    const from = `${logPath}.${i}`;
    if (fs.existsSync(from)) fs.renameSync(from, `${logPath}.${i + 1}`);
  }
  if (fs.existsSync(logPath)) fs.renameSync(logPath, `${logPath}.1`);
}

// A minimal synchronous pino destination: just an object with `.write(string)`. Deliberately
// not pino.transport()/pino-roll — those spawn a worker thread that resolves a transport
// script by file path, which is fragile once the app is packaged inside Electron's asar
// archive. Plain fs.writeSync has no such requirement and needs no extra build config.
function createRotatingDestination(logPath: string): { write(chunk: string): void } {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });

  let size = 0;
  try { size = fs.statSync(logPath).size; } catch { /* first run — no file yet */ }
  if (size >= MAX_BYTES) rotate(logPath, MAX_BACKUPS);

  let fd = fs.openSync(logPath, 'a');
  let written = 0;
  try { written = fs.fstatSync(fd).size; } catch { /* unreachable: fd was just opened */ }

  return {
    write(chunk: string): void {
      const chunkBytes = Buffer.byteLength(chunk);
      if (written + chunkBytes >= MAX_BYTES) {
        fs.closeSync(fd);
        rotate(logPath, MAX_BACKUPS);
        fd = fs.openSync(logPath, 'a');
        written = 0;
      }
      fs.writeSync(fd, chunk);
      written += chunkBytes;
    },
  };
}

/** Shallow-redacts known credential fields from a request body before it's logged. */
function redactBody(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) return body;
  const out: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const key of Object.keys(out)) {
    if (REDACT_BODY_KEYS.has(key)) out[key] = '[redacted]';
  }
  return out;
}

/**
 * Log path follows dbPath's directory and basename (not a fixed PROJECT_ROOT/app.log) —
 * the directory part so it lands in Electron's userData dir alongside torah.db rather
 * than inside the packaged app's read-only install location (see main.cjs, which sets
 * TORAH_DB_PATH to app.getPath('userData')); the basename part so that distinct DB files
 * in the same directory (as every integration test uses — one torah-<test>-<pid>.db per
 * file, all under os.tmpdir()) get distinct logs instead of colliding on one shared file.
 */
export function logFilePath(dbPath: string): string {
  const stem = path.basename(dbPath, path.extname(dbPath));
  return path.join(path.dirname(dbPath), 'logs', `${stem}.log`);
}

/**
 * All log files that currently exist for dbPath — the active file plus any rotated
 * backups (<name>.log.1 .. <name>.log.MAX_BACKUPS) — oldest first, for export/download.
 */
export function allLogFiles(dbPath: string): string[] {
  const base = logFilePath(dbPath);
  const files: string[] = [];
  for (let i = MAX_BACKUPS; i >= 1; i--) {
    const f = `${base}.${i}`;
    if (fs.existsSync(f)) files.push(f);
  }
  if (fs.existsSync(base)) files.push(base);
  return files;
}

/**
 * Creates the app's pino logger.
 *
 * Level defaults to 'info' (regular log); set TORAH_LOG_LEVEL=debug to also capture
 * request/response bodies and other verbose detail, at the cost of more disk usage.
 */
export function createLogger(dbPath: string): pino.Logger {
  const level = process.env.TORAH_LOG_LEVEL === 'debug' ? 'debug' : 'info';
  return pino(
    {
      level,
      redact: { paths: ['req.headers.cookie', 'req.headers.authorization'], remove: true },
    },
    createRotatingDestination(logFilePath(dbPath)),
  );
}

/**
 * Express middleware (pino-http) that auto-logs every non-GET /api request: method, path,
 * status, duration. GETs are skipped — they're the bulk of traffic (page load, static
 * assets, polling) and not what a "did my edit/delete go through" investigation needs.
 * Request bodies (redacted) are only attached at debug level, to keep the regular log small.
 */
export function createHttpLogger(logger: pino.Logger) {
  return pinoHttp<IncomingMessage, ServerResponse>({
    logger,
    autoLogging: { ignore: (req: IncomingMessage) => req.method === 'GET' },
    customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customProps: (req: IncomingMessage) => {
      if (!logger.isLevelEnabled('debug')) return {};
      return { body: redactBody((req as unknown as { body?: unknown }).body) };
    },
  });
}
