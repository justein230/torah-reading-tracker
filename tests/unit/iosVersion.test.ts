// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { iosVersion, versionXcconfig } from '../../src/utils/iosVersion';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('iosVersion', () => {
  it.each([
    ['1.2.0',  '1.2.0',  '10200'],
    ['1.1.9',  '1.1.9',  '10109'],
    ['2.0.0',  '2.0.0',  '20000'],
    [' 1.2.0 ', '1.2.0', '10200'],
  ])('%j → marketing %j, build %s', (version, marketingVersion, buildNumber) => {
    expect(iosVersion(version)).toEqual({ marketingVersion, buildNumber });
  });

  it('keeps build numbers increasing across patch, minor and major bumps', () => {
    const builds = ['1.1.9', '1.2.0', '1.2.1', '2.0.0'].map(v => Number(iosVersion(v).buildNumber));
    expect(builds).toEqual([...builds].sort((a, b) => a - b));
    expect(new Set(builds).size).toBe(builds.length);
  });

  it.each(['1.2.0-dev.0', '1.2.0-qa.1', '1.2', ''])('refuses %j', version => {
    expect(() => iosVersion(version)).toThrow(/plain release version/);
  });
});

describe('versionXcconfig', () => {
  it('sets both Xcode settings', () => {
    const lines = versionXcconfig('1.2.0').split('\n');
    expect(lines).toContain('MARKETING_VERSION = 1.2.0');
    expect(lines).toContain('CURRENT_PROJECT_VERSION = 10200');
  });

  it('matches the committed ios/App/Version.xcconfig (run npm run ios:version if this fails)', () => {
    const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    if (/-/.test(version)) return; // prereleases leave the file at the last release
    expect(fs.readFileSync(path.join(root, 'ios/App/Version.xcconfig'), 'utf8')).toBe(versionXcconfig(version));
  });

  it('is what the Xcode project reads: no hardcoded version left in project.pbxproj', () => {
    const pbx = fs.readFileSync(path.join(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
    expect(pbx).not.toMatch(/^\s*(MARKETING_VERSION|CURRENT_PROJECT_VERSION) =/m);
    expect(pbx).toContain('Version.xcconfig');
  });
});
