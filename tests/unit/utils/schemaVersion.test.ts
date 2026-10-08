import { describe, it, expect } from 'vitest';
import { switchOverVersion, splitStatements } from '../../../src/utils/schemaVersion';

describe('switchOverVersion', () => {
  it('raises a stale server user_version to the Drizzle row count', () => {
    expect(switchOverVersion(0, 7)).toBe(7);
  });

  it('leaves a native file alone when user_version is ahead of its stale Drizzle table', () => {
    expect(switchOverVersion(7, 2)).toBe(7);
  });

  it('leaves user_version alone when there is no Drizzle table', () => {
    expect(switchOverVersion(5, 0)).toBe(5);
  });
});

describe('splitStatements', () => {
  it('splits on drizzle-kit breakpoints and drops empty chunks', () => {
    const sql = 'CREATE TABLE a (x);\n--> statement-breakpoint\nCREATE TABLE b (y);\n--> statement-breakpoint\n  \n';
    expect(splitStatements(sql)).toEqual(['CREATE TABLE a (x);', 'CREATE TABLE b (y);']);
  });
});
