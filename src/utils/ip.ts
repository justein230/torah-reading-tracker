import type { Request } from 'express';

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, o) => (acc << 8) + Number.parseInt(o, 10), 0) >>> 0;
}

function parseCIDR(cidr: string): [number, number] {
  const [addr, bits] = cidr.split('/') as [string, string];
  const mask = bits === '32' ? 0xffffffff : (~(0xffffffff >>> Number.parseInt(bits, 10))) >>> 0;
  return [ipToInt(addr) & mask, mask];
}

export function compileCidrs(list: string[]): [number, number][] {
  return list.map(parseCIDR);
}

export function isAllowed(ip: string, compiled: [number, number][]): boolean {
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(v4)) return false;
  const n = ipToInt(v4);
  return compiled.some(([net, mask]) => (n & mask) === net);
}

export function getClientIp(req: Request): string {
  const header = req.headers['x-real-ip'];
  if (header) return (header as string).trim();
  const raw = req.socket.remoteAddress || '';
  return raw.startsWith('::ffff:') ? raw.slice(7) : raw;
}
