import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

const SCRYPT_KEYLEN = 64;

/** Hashes a password as "salt:hash" (both hex) for storage in the admin_password table. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

/** Verifies a password against a "salt:hash" string produced by hashPassword(). */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected  = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/** Opaque session token handed to the client as a cookie value; never stored server-side. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/** One-time admin password generated at startup when none is configured, e.g. for logging. */
export function generateBootstrapPassword(): string {
  return randomBytes(18).toString('base64url');
}

/** One-way digest of a session token, stored in auth_sessions instead of the raw token. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const SESSION_COOKIE_NAME = 'torah_session';

export function parseSessionCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === SESSION_COOKIE_NAME) return part.slice(eq + 1).trim();
  }
  return null;
}

export function serializeSessionCookie(token: string, maxAgeSeconds: number, secure: boolean): string {
  const attrs = [`${SESSION_COOKIE_NAME}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAgeSeconds}`];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function clearSessionCookie(secure: boolean): string {
  const attrs = [`${SESSION_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0'];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

/**
 * header mode only trusts TORAH_AUTH_HEADER when requireProxyHeader is set — otherwise
 * a client hitting the app directly (no proxy in front, or one that doesn't strip the
 * header) could set it themselves and grant their own write access.
 */
export function isHeaderAuthenticated(headerValue: string | string[] | undefined, requireProxyHeader: boolean): boolean {
  if (!requireProxyHeader) return false;
  const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return !!value && value.trim().length > 0;
}
