import { describe, expect, it } from 'vitest';
import {
  checkCoverage,
  detectLicenseIds,
  licenseFileHint,
  parseLicenseExpression,
} from '../../scripts/license-expression.mjs';

const MIT = 'The MIT License\n\nPermission is hereby granted, free of charge, to any person...';
const APACHE = 'Apache License\n   Version 2.0, January 2004';
const BSD = 'Redistribution and use in source and binary forms, with or without modification...';
const CC0 = 'Creative Commons Legal Code\n\nCC0 1.0 Universal';
const ZLIB = "This software is provided 'as-is'...\n2. Altered source versions must be plainly marked as such";

describe('parseLicenseExpression', () => {
  it.each([
    ['MIT',                              ['MIT'],                                      false],
    ['(MIT OR WTFPL)',                   ['MIT', 'WTFPL'],                             false],
    ['(BSD-2-Clause OR MIT OR Apache-2.0)', ['BSD-2-Clause', 'MIT', 'Apache-2.0'],     false],
    ['(MIT AND Zlib)',                   ['MIT', 'Zlib'],                              true],
    ['(MIT AND Zlib) OR Apache-2.0',     ['MIT', 'Zlib', 'Apache-2.0'],                true],
    ['MIT*',                             ['MIT'],                                      false],
    ['(MIT OR GPL-2.0 WITH Classpath-exception-2.0)', ['MIT', 'GPL-2.0 WITH Classpath-exception-2.0'], false],
    ['MIT OR MIT',                       ['MIT'],                                      false],
  ])('reads %j', (expression, ids, requiresAll) => {
    expect(parseLicenseExpression(expression)).toEqual({ ids, requiresAll });
  });

  it('reads the legacy array form as alternatives', () => {
    expect(parseLicenseExpression(['MIT', 'Apache-2.0'])).toEqual({ ids: ['MIT', 'Apache-2.0'], requiresAll: false });
  });
});

describe('detectLicenseIds', () => {
  it.each([
    [MIT, ['MIT']],
    [APACHE, ['Apache-2.0']],
    [BSD, ['BSD']],
    [CC0, ['CC0-1.0']],
    [ZLIB, ['Zlib']],
    ['Custom terms.', []],
  ])('recognises %j', (text, expected) => {
    expect(detectLicenseIds(text)).toEqual(expected);
  });

  it('finds every license in a text that holds two', () => {
    expect(detectLicenseIds(`${MIT}\n\n${APACHE}`)).toEqual(['Apache-2.0', 'MIT']);
  });
});

describe('licenseFileHint', () => {
  it.each([
    ['LICENSE.MIT', 'MIT'],
    ['LICENSE.APACHE2', 'Apache-2.0'],
    ['LICENSE.BSD', 'BSD'],
    ['license-cc0', 'CC0-1.0'],
    ['LICENSE', undefined],
    ['LICENSE.md', undefined],
  ])('reads %s', (fileName, expected) => {
    expect(licenseFileHint(fileName)).toBe(expected);
  });
});

describe('checkCoverage', () => {
  it('accepts an OR expression once any one license has text (rc)', () => {
    const rc = parseLicenseExpression('(BSD-2-Clause OR MIT OR Apache-2.0)');
    const result = checkCoverage(rc, [{ text: APACHE }, { text: MIT }, { text: BSD }]);
    expect(result).toEqual({ covered: ['BSD-2-Clause', 'MIT', 'Apache-2.0'], missing: [], ok: true });
    expect(checkCoverage(rc, [{ text: MIT }]).ok).toBe(true);
  });

  it('matches BSD-2-Clause and BSD-3-Clause by the BSD wording', () => {
    expect(checkCoverage(parseLicenseExpression('BSD-3-Clause OR MIT'), [{ text: BSD }]).covered).toEqual(['BSD-3-Clause']);
  });

  it('uses the file name when the text is not recognised', () => {
    const typeFest = parseLicenseExpression('(MIT OR CC0-1.0)');
    expect(checkCoverage(typeFest, [{ id: 'CC0-1.0', text: 'unrecognised' }])).toMatchObject({ covered: ['CC0-1.0'], ok: true });
  });

  it('requires every license of an AND expression (pako)', () => {
    const pako = parseLicenseExpression('(MIT AND Zlib)');
    expect(checkCoverage(pako, [{ text: MIT }])).toEqual({ covered: ['MIT'], missing: ['Zlib'], ok: false });
    expect(checkCoverage(pako, [{ text: MIT }, { id: 'Zlib', text: ZLIB }])).toMatchObject({ missing: [], ok: true });
  });

  it('fails an OR expression when none of its licenses has text', () => {
    const result = checkCoverage(parseLicenseExpression('MIT OR Apache-2.0'), [{ text: 'Custom terms.' }]);
    expect(result).toEqual({ covered: [], missing: ['MIT', 'Apache-2.0'], ok: false });
  });
});
