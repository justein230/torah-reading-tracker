import { describe, expect, it } from 'vitest';
import {
  detectLicenseName,
  formatAndroidLicenses,
  formatIosAcknowledgements,
  type AboutLibrariesExport,
} from '../../scripts/native-licenses';

const APACHE = 'Apache License\n   Version 2.0, January 2004\n   ...terms...';
const MIT = 'MIT License\n\nPermission is hereby granted, free of charge, to any person...';

describe('formatAndroidLicenses', () => {
  const exported: AboutLibrariesExport = {
    libraries: [
      { uniqueId: 'androidx.core:core', artifactVersion: '1.17.0', name: 'Core', licenses: ['apache'] },
      { uniqueId: 'androidx.appcompat:appcompat', artifactVersion: '1.7.1', name: 'AppCompat', licenses: ['apache'] },
      { uniqueId: 'io.ionic.libs:ionfilesystem-android', artifactVersion: '1.1.1', name: 'Ionic FS',
        organization: { name: 'Ionic' }, licenses: ['mit'] },
    ],
    licenses: {
      apache: { name: 'Apache License 2.0', content: APACHE },
      mit: { name: 'MIT License', content: MIT },
    },
  };

  it('lists libraries as group:artifact:version', () => {
    const markdown = formatAndroidLicenses(exported);
    expect(markdown).toContain('`androidx.appcompat:appcompat:1.7.1`');
    expect(markdown).toContain('`io.ionic.libs:ionfilesystem-android:1.1.1`');
  });

  it('prints each license text once, however many libraries share it', () => {
    const markdown = formatAndroidLicenses(exported);
    expect(markdown.match(/\.\.\.terms\.\.\./g)).toHaveLength(1);
    expect(markdown).toContain('Covers: `androidx.appcompat:appcompat:1.7.1`, `androidx.core:core:1.17.0`');
  });

  it('puts the license shared by the most libraries first and is stable for a given input', () => {
    const markdown = formatAndroidLicenses(exported);
    expect(markdown.indexOf('## Apache License 2.0')).toBeLessThan(markdown.indexOf('## MIT License'));
    expect(formatAndroidLicenses(exported)).toBe(markdown);
  });

  it('credits the organization, falling back to the developers', () => {
    const markdown = formatAndroidLicenses({
      libraries: [
        { uniqueId: 'a:with-org', name: 'With org', organization: { name: 'Acme' }, developers: [{ name: 'Ann' }], licenses: ['mit'] },
        { uniqueId: 'a:with-devs', name: 'With devs', developers: [{ name: 'Ann' }, { name: 'Bob' }], licenses: ['mit'] },
      ],
      licenses: { mit: { name: 'MIT License', content: MIT } },
    });
    expect(markdown).toContain('- With org: Acme');
    expect(markdown).toContain('- With devs: Ann, Bob');
  });

  it('accepts license objects inline in a library', () => {
    const markdown = formatAndroidLicenses({
      libraries: [{ uniqueId: 'a:inline', licenses: [{ name: 'MIT License', content: MIT }] }],
    });
    expect(markdown).toContain('## MIT License');
    expect(markdown).toContain('`a:inline`');
  });

  it('refuses to write a file with a library that has no license text, naming it', () => {
    expect(() => formatAndroidLicenses({
      libraries: [
        { uniqueId: 'a:fine', licenses: [{ name: 'MIT License', content: MIT }] },
        { uniqueId: 'a:unlicensed', artifactVersion: '1.0', licenses: ['no-text'] },
      ],
      licenses: { 'no-text': { name: 'License' } },
    })).toThrow(/No license text for: a:unlicensed:1\.0/);
  });

  describe('libraries with several licenses', () => {
    const dual: AboutLibrariesExport = {
      libraries: [{ uniqueId: 'a:dual', artifactVersion: '2.0', name: 'Dual', licenses: ['apache', 'mit'] }],
      licenses: {
        apache: { name: 'Apache License 2.0', content: APACHE },
        mit: { name: 'MIT License', content: MIT },
      },
    };

    it('prints every license text under a joined heading', () => {
      const markdown = formatAndroidLicenses(dual);
      expect(markdown).toContain('## Apache License 2.0 + MIT License\n\nCovers: `a:dual:2.0`');
      expect(markdown).toContain('Apache License 2.0:\n\n```text\n' + APACHE);
      expect(markdown).toContain('MIT License:\n\n```text\n' + MIT);
    });

    it('refuses a library when any one of its licenses has no text, naming both', () => {
      expect(() => formatAndroidLicenses({
        libraries: [{ uniqueId: 'a:dual', licenses: ['apache', 'no-text'] }],
        licenses: { apache: { name: 'Apache License 2.0', content: APACHE }, 'no-text': { name: 'Other License' } },
      })).toThrow(/No license text for: a:dual \(Other License\)/);
    });

    it('fills a missing text by license id, but not by library id, which could not tell the licenses apart', () => {
      const input: AboutLibrariesExport = {
        libraries: [{ uniqueId: 'a:dual', licenses: ['apache', 'MIT'] }],
        licenses: { apache: { name: 'Apache License 2.0', content: APACHE }, MIT: { name: 'MIT', spdxId: 'MIT' } },
      };
      expect(() => formatAndroidLicenses(input, { 'a:dual': MIT })).toThrow(/No license text for: a:dual \(MIT\)/);
      expect(formatAndroidLicenses(input, { MIT })).toContain('## Apache License 2.0 + MIT License');
    });
  });

  describe('text overrides', () => {
    const noText: AboutLibrariesExport = {
      libraries: [
        { uniqueId: 'net.zetetic:sqlcipher-android', artifactVersion: '4.17.0', name: 'SQLCipher', licenses: ['abc123'] },
        { uniqueId: 'androidx.core:core', artifactVersion: '1.17.0', licenses: ['Apache-2.0'] },
      ],
      licenses: {
        abc123: { name: '' },
        'Apache-2.0': { name: 'The Apache License, Version 2.0', spdxId: 'Apache-2.0' },
      },
    };

    it('fills in missing text by library id or by license id', () => {
      const markdown = formatAndroidLicenses(noText, {
        'net.zetetic:sqlcipher-android': 'Redistribution and use in source and binary forms, with or without',
        'Apache-2.0': APACHE,
      });
      expect(markdown).toContain('## BSD license\n\nCovers: `net.zetetic:sqlcipher-android:4.17.0`');
      expect(markdown).toContain('## Apache License 2.0\n\nCovers: `androidx.core:core:1.17.0`');
    });

    it('prefers the text the build tool exported over an override', () => {
      const markdown = formatAndroidLicenses(
        { libraries: [{ uniqueId: 'a:b', licenses: [{ name: 'X', content: 'exported text' }] }] },
        { 'a:b': 'override text' },
      );
      expect(markdown).toContain('exported text');
      expect(markdown).not.toContain('override text');
    });
  });

  it('uses a longer code fence when the license text contains backticks', () => {
    const markdown = formatAndroidLicenses({
      libraries: [{ uniqueId: 'a:ticks', licenses: [{ name: 'X', content: 'see ```code```' }] }],
    });
    expect(markdown).toContain('````text\nsee ```code```\n````');
  });

  it('starts with the do-not-edit header', () => {
    expect(formatAndroidLicenses(exported)).toMatch(/^# Android libraries\n\nGenerated by `npm run licenses:android`/);
  });
});

describe('formatIosAcknowledgements', () => {
  const acknowledgements = `## Acknowledgements

This application makes use of the following third party libraries:

## IONFilesystemLib

${MIT}

## ZIPFoundation

${MIT}

## SQLCipher

Copyright (c) 2025, ZETETIC LLC
Redistribution and use in source and binary forms, with or without modification, are permitted.

Generated by CocoaPods - https://cocoapods.org
`;

  it('lists each pod and drops the intro and the CocoaPods footer', () => {
    const markdown = formatIosAcknowledgements(acknowledgements);
    for (const pod of ['IONFilesystemLib', 'ZIPFoundation', 'SQLCipher']) expect(markdown).toContain(`\`${pod}\``);
    expect(markdown).not.toContain('Generated by CocoaPods');
    expect(markdown).not.toContain('third party libraries');
  });

  it('groups pods with identical license text and names the license', () => {
    const markdown = formatIosAcknowledgements(acknowledgements);
    expect(markdown).toContain('## MIT License');
    expect(markdown).toContain('Covers: `IONFilesystemLib`, `ZIPFoundation`');
    expect(markdown.match(/Permission is hereby granted/g)).toHaveLength(1);
  });

  it('refuses to write a file with a pod that has no license text', () => {
    expect(() => formatIosAcknowledgements('## Acknowledgements\n\n## Empty\n\n## Other\n\nCustom terms apply.\n'))
      .toThrow(/No license text for: Empty/);
  });

  it('names every license when a pod\'s text holds more than one', () => {
    const markdown = formatIosAcknowledgements(`## Acknowledgements\n\n## Both\n\n${MIT}\n\n${APACHE}\n`);
    expect(markdown).toContain('## Apache License 2.0 + MIT License');
  });

  it('names a group after its pod when the license is not recognised', () => {
    const markdown = formatIosAcknowledgements('## Acknowledgements\n\n## Odd\n\nCustom terms apply.\n');
    expect(markdown).toContain('## Odd');
  });
});

describe('detectLicenseName', () => {
  it.each([
    [APACHE, 'Apache License 2.0'],
    [MIT, 'MIT License'],
    ['Redistribution and use in source and binary forms, with or without', 'BSD license'],
    ['Custom terms.', undefined],
  ])('recognises %j', (text, expected) => {
    expect(detectLicenseName(text)).toBe(expected);
  });
});
