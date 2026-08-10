// @vitest-environment node
import { compileCidrs, isAllowed, getClientIp } from '../../src/utils/ip.ts';

const LOCALHOST = compileCidrs(['127.0.0.0/8']);
const PRIVATE   = compileCidrs(['10.0.0.0/24', '127.0.0.0/8']);

describe('isAllowed — localhost CIDR (127.0.0.0/8)', () => {
  it('allows 127.0.0.1', () => {
    expect(isAllowed('127.0.0.1', LOCALHOST)).toBe(true);
  });

  it('allows 127.255.255.255 (upper bound of /8)', () => {
    expect(isAllowed('127.255.255.255', LOCALHOST)).toBe(true);
  });

  it('blocks 10.0.0.1 (not in 127/8)', () => {
    expect(isAllowed('10.0.0.1', LOCALHOST)).toBe(false);
  });

  it('blocks 192.168.1.1', () => {
    expect(isAllowed('192.168.1.1', LOCALHOST)).toBe(false);
  });
});

describe('isAllowed — subnet boundary (10.0.0.0/24)', () => {
  it('allows 10.0.0.1', () => {
    expect(isAllowed('10.0.0.1', PRIVATE)).toBe(true);
  });

  it('allows 10.0.0.255 (upper bound of /24)', () => {
    expect(isAllowed('10.0.0.255', PRIVATE)).toBe(true);
  });

  it('blocks 10.0.1.0 (just outside /24)', () => {
    expect(isAllowed('10.0.1.0', PRIVATE)).toBe(false);
  });
});

describe('isAllowed — /32 mask (single host)', () => {
  it('allows only the exact IP', () => {
    const single = compileCidrs(['192.168.1.100/32']);
    expect(isAllowed('192.168.1.100', single)).toBe(true);
    expect(isAllowed('192.168.1.101', single)).toBe(false);
    expect(isAllowed('192.168.1.99',  single)).toBe(false);
  });
});

describe('isAllowed — IPv6-mapped IPv4', () => {
  it('strips ::ffff: prefix before checking', () => {
    expect(isAllowed('::ffff:127.0.0.1', LOCALHOST)).toBe(true);
  });

  it('blocks an IPv6-mapped non-localhost address', () => {
    expect(isAllowed('::ffff:10.0.1.0', LOCALHOST)).toBe(false);
  });
});

describe('isAllowed — non-IPv4 addresses', () => {
  it('blocks a pure IPv6 address', () => {
    expect(isAllowed('::1', LOCALHOST)).toBe(false);
  });

  it('blocks an empty string', () => {
    expect(isAllowed('', LOCALHOST)).toBe(false);
  });
});

describe('getClientIp', () => {
  it('prefers x-real-ip header over socket address', () => {
    const req = { headers: { 'x-real-ip': '10.0.0.5' }, socket: { remoteAddress: '127.0.0.1' } };
    expect(getClientIp(req)).toBe('10.0.0.5');
  });

  it('trims whitespace from x-real-ip header', () => {
    const req = { headers: { 'x-real-ip': '  10.0.0.5  ' }, socket: { remoteAddress: '127.0.0.1' } };
    expect(getClientIp(req)).toBe('10.0.0.5');
  });

  it('falls back to socket.remoteAddress when header absent', () => {
    const req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } };
    expect(getClientIp(req)).toBe('127.0.0.1');
  });

  it('strips ::ffff: prefix from socket.remoteAddress', () => {
    const req = { headers: {}, socket: { remoteAddress: '::ffff:127.0.0.1' } };
    expect(getClientIp(req)).toBe('127.0.0.1');
  });
});
