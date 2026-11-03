// Turns TORAH_TRUST_PROXY into a value for Express's `trust proxy` setting, which decides
// whether req.ip (and so the rate limiters) come from X-Forwarded-For or the socket.
//  unset / "" / "false" → false (trust nothing; right when clients connect directly)
//  "2"                  → trust that many proxy hops
//  anything else        → Express's subnet list, e.g. "loopback, linklocal, uniquelocal"
// "true" is refused: it trusts any X-Forwarded-For, so a client could pick its own IP.
export function parseTrustProxy(raw: string | undefined): boolean | number | string {
  const value = raw?.trim() ?? '';
  if (value === '' || value === 'false') return false;
  if (value === 'true') throw new Error('TORAH_TRUST_PROXY=true trusts any client-sent X-Forwarded-For; use a hop count or subnet list');
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}
