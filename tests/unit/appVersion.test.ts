// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { appVersion, PART_LIMIT } from '../../src/utils/appVersion';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('appVersion', () => {
  it.each([
    ['1.1.3',    10103,  '1.1.3'],
    ['0.0.1',    1,      '0.0.1'],
    ['1.10.0',   11000,  '1.10.0'],
    ['2.0.0',    20000,  '2.0.0'],
    ['12.99.99', 129999, '12.99.99'],
    [' 1.2.3 ',  10203,  '1.2.3'],
  ])('%j → code %d, name %j', (version, code, name) => {
    expect(appVersion(version)).toEqual({ code, name });
  });

  it('keeps codes increasing across patch, minor and major bumps', () => {
    const codes = ['1.1.3', '1.1.4', '1.2.0', '1.99.99', '2.0.0'].map(v => appVersion(v).code);
    expect(codes).toEqual([...codes].sort((a, b) => a - b));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it.each(['1.1.3-dev.0', '1.1.3-qa.2', '1.1', 'v1.1.3', ''])('refuses %j', version => {
    expect(() => appVersion(version)).toThrow(/plain release version/);
  });

  it.each(['1.100.0', '1.0.100'])('refuses %j, which would overflow into the next part', version => {
    expect(() => appVersion(version)).toThrow(/below 100/);
  });
});

// build.gradle packs the version itself, in Groovy. Its regex and arithmetic are also valid
// JavaScript, so pull them out and check they give the same answers as appVersion.
describe('android/app/build.gradle', () => {
  const gradle  = fs.readFileSync(path.join(root, 'android/app/build.gradle'), 'utf8');
  const pattern = /^def versionParts\s*= appVersion =~ \/(.+)\/$/m.exec(gradle)?.[1];
  const formula = /^def appVersionCode\s*= (.+)$/m.exec(gradle)?.[1];
  const limit   = /if \(minor >= (\d+) \|\| patch >= \1\)/.exec(gradle)?.[1];

  it('still has the version code lines this test reads', () => {
    expect(pattern).toBeDefined();
    expect(formula).toBeDefined();
    expect(limit).toBeDefined();
  });

  /** What Gradle sets for `version`: its versionName/versionCode, and whether release builds refuse it. */
  function gradleVersion(version: string) {
    const m = new RegExp(pattern!).exec(version);
    if (!m) return null;
    const [major, minor, patch] = m.slice(1, 4).map(Number) as [number, number, number];
    const code = new Function('major', 'minor', 'patch', `return ${formula}`)(major, minor, patch) as number;
    return { name: version, code, prerelease: m[4] !== undefined };
  }

  it.each(['0.0.1', '1.1.3', '1.2.0', '1.10.0', '12.99.99'])('gives %j the same name and code as appVersion', version => {
    const { name, code } = appVersion(version);
    expect(gradleVersion(version)).toEqual({ name, code, prerelease: false });
  });

  it.each(['1.2.1-dev.0', '1.2.1-qa.3'])('marks %j as a prerelease, with its release\'s code for debug builds', version => {
    expect(gradleVersion(version)).toEqual({ name: version, code: appVersion('1.2.1').code, prerelease: true });
  });

  it.each(['1.1', 'v1.1.3', ''])('rejects %j', version => {
    expect(gradleVersion(version)).toBeNull();
  });

  it('uses the same limit for minor and patch', () => {
    expect(Number(limit)).toBe(PART_LIMIT);
  });

  it('refuses prereleases in release builds and no longer takes the version as a -P property', () => {
    expect(gradle).toMatch(/task\.name == 'preReleaseBuild' && isPrerelease/);
    expect(gradle).not.toMatch(/findProperty\('version(Code|Name)'\)/);
  });
});
