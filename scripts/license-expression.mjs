// Pure helpers for libraries that are licensed under more than one license, shared by the npm build
// (scripts/post-build-licenses.mjs) and the native generator (scripts/native-licenses.ts). See docs/LICENSES.md.

/**
 * @typedef {{ ids: string[], requiresAll: boolean }} ParsedLicense
 * `requiresAll` is true when the library must be shipped under every license in `ids` (the expression has an AND);
 * otherwise any one of them is enough (OR).
 * @typedef {{ id?: string, label?: string, text: string }} LicenseText
 */

const unique = (/** @type {string[]} */ values) => [...new Set(values)];

/**
 * Splits an SPDX expression ("(MIT OR Apache-2.0)"), a legacy array of ids, or license-checker's guessed "MIT*"
 * into license ids. `X WITH exception` stays one id.
 * @param {string | string[]} expression
 * @returns {ParsedLicense}
 */
export function parseLicenseExpression(expression) {
  if (Array.isArray(expression)) {
    return { ids: unique(expression.flatMap(entry => parseLicenseExpression(entry).ids)), requiresAll: false };
  }
  const flat = expression.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  const ids = flat.split(/ (?:AND|OR) /).map(id => id.trim().replace(/\*$/, '')).filter(Boolean);
  return { ids: unique(ids), requiresAll: / AND /.test(flat) };
}

// Standard wording of the common licenses. MIT/Apache/BSD are matched on the raw text, exactly as the native
// generator always did, so its committed headings stay the same.
/** @type {[string, (text: string) => boolean][]} */
const DETECTORS = [
  ['Apache-2.0', text => /Apache License\s+Version 2\.0/i.test(text)],
  ['MIT',        text => text.includes('Permission is hereby granted, free of charge')],
  ['BSD',        text => text.includes('Redistribution and use in source and binary forms')],
  ['ISC',        text => /Permission\s+to\s+use,\s+copy,\s+modify,\s+and\/or\s+distribute\s+this\s+software/i.test(text)],
  ['Zlib',       text => /altered\s+source\s+versions\s+must\s+be\s+plainly\s+marked/i.test(text)],
  ['CC0-1.0',    text => /CC0\s+1\.0\s+Universal/i.test(text)],
  ['WTFPL',      text => /DO\s+WHAT\s+THE\s+FUCK\s+YOU\s+WANT\s+TO/i.test(text)],
  ['GPL',        text => /GNU\s+GENERAL\s+PUBLIC\s+LICENSE/.test(text)],
];

/**
 * Every license whose standard wording appears in the text. BSD-2/3-Clause are both reported as "BSD".
 * @param {string} text
 * @returns {string[]}
 */
export function detectLicenseIds(text) {
  return DETECTORS.filter(([, matches]) => matches(text)).map(([id]) => id);
}

/**
 * The license a file name points to (LICENSE.MIT, license-cc0, LICENSE.APACHE2), for files whose text is not recognised.
 * @param {string} fileName
 * @returns {string | undefined}
 */
export function licenseFileHint(fileName) {
  const suffix = fileName.replace(/^(licen[sc]e|copying)/i, '').toLowerCase();
  const byKeyword = { apache: 'Apache-2.0', cc0: 'CC0-1.0', mit: 'MIT', bsd: 'BSD', isc: 'ISC', zlib: 'Zlib', wtfpl: 'WTFPL', gpl: 'GPL' };
  const keyword = Object.keys(byKeyword).find(word => suffix.includes(word));
  return keyword ? byKeyword[/** @type {keyof typeof byKeyword} */ (keyword)] : undefined;
}

/** Whether a license found in a text (by detection or file name) satisfies a declared id. */
function satisfies(/** @type {string} */ declared, /** @type {string} */ found) {
  const base = declared.split(' WITH ')[0] ?? declared;
  if (found === 'BSD') return base.startsWith('BSD');
  if (found === 'Apache-2.0') return base.startsWith('Apache');
  if (found === 'GPL') return base.startsWith('GPL');
  return base === found;
}

/**
 * Which declared licenses the given texts cover. `ok` is the build rule: all of them for AND, at least one for OR.
 * @param {ParsedLicense} parsed
 * @param {LicenseText[]} texts
 * @returns {{ covered: string[], missing: string[], ok: boolean }}
 */
export function checkCoverage(parsed, texts) {
  const found = texts.flatMap(({ id, text }) => [...(id ? [id] : []), ...detectLicenseIds(text)]);
  const covered = parsed.ids.filter(declared => found.some(id => satisfies(declared, id)));
  const missing = parsed.ids.filter(id => !covered.includes(id));
  return { covered, missing, ok: parsed.requiresAll ? missing.length === 0 : covered.length > 0 };
}
