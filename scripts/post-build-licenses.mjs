// Runs after `vite build`: adds LICENSE.txt and the licenses of all production npm dependencies to dist/.
// Fails the build if any dependency is left without license text.
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';
import { nativeLicensesMarkdown } from './native-licenses-bundle.mjs';
import { checkCoverage, licenseFileHint, parseLicenseExpression } from './license-expression.mjs';

const OVERRIDES_DIR = 'licenses/overrides';

// Platform-specific binary packages (e.g. @rollup/rollup-linux-x64-gnu) end in "-<os>-<arch>..."; which
// one gets installed depends on the build machine, so their overrides are keyed by the name without it.
const PLATFORM_SUFFIX = /-(?:aix|android|darwin|freebsd|linux|netbsd|openbsd|openharmony|sunos|win32)-.+$/;

// Packages that ship no license text of their own get it from licenses/overrides/<name>.txt
// (copied from the upstream repo; "/" in scoped names becomes "__").
function overrideText(name) {
  for (const candidate of [name, name.replace(PLATFORM_SUFFIX, '')]) {
    const file = `${OVERRIDES_DIR}/${candidate.replace('/', '__')}.txt`;
    if (existsSync(file)) return readFileSync(file, 'utf-8').trim();
  }
  return null;
}

// Text of the "License" section of a README, if it has more than a bare license name.
function readmeLicenseSection(readme) {
  const match = /^#+ *licen[sc]e\b.*\n([\s\S]*?)(?=^#+ |(?![\s\S]))/im.exec(readme);
  const body = match?.[1].trim();
  // READMEs are markdown/HTML, so e-mail brackets in the copyright line are often entity-escaped.
  const unescaped = body?.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
  return unescaped && unescaped.length > 100 ? unescaped : null;
}

// Apache-2.0 section 4(d): the contents of a package's NOTICE file must be passed on too.
function noticeText(info) {
  return info.noticeFile ? readFileSync(info.noticeFile, 'utf-8').trim() : null;
}

// Full license text for a package, or null if neither it nor an override provides any.
function licenseText(nameAtVersion, info) {
  const file = info.licenseFile;
  if (file && /^(licen[sc]e|copying)/i.test(basename(file))) return readFileSync(file, 'utf-8').trim();
  const override = overrideText(nameAtVersion.slice(0, nameAtVersion.lastIndexOf('@')));
  if (override) return override;
  // The checker falls back to a README when a package ships no license file.
  return file ? readmeLicenseSection(readFileSync(file, 'utf-8')) : null;
}

// Every license text of a package declared under several licenses (e.g. "(MIT AND Zlib)"): all its license files,
// plus licenses/overrides/<name>/<SPDX id>.txt for any declared license the package does not ship.
// Returns null for single-license packages, which keep using licenseText.
function multiLicenseTexts(nameAtVersion, info) {
  const parsed = parseLicenseExpression(info.licenses);
  if (parsed.ids.length < 2 || !info.path) return null;
  const name = nameAtVersion.slice(0, nameAtVersion.lastIndexOf('@'));
  const texts = readdirSync(info.path)
    .filter(file => /^(licen[sc]e|copying)/i.test(file) && statSync(`${info.path}/${file}`).isFile())
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map(file => ({ id: licenseFileHint(file), label: file, text: readFileSync(`${info.path}/${file}`, 'utf-8').trim() }));
  for (const id of checkCoverage(parsed, texts).missing) {
    const file = `${OVERRIDES_DIR}/${name.replace('/', '__')}/${id}.txt`;
    if (existsSync(file)) texts.push({ id, label: id, text: readFileSync(file, 'utf-8').trim() });
  }
  const { missing, ok } = checkCoverage(parsed, texts);
  return { texts, missing, ok };
}

copyFileSync('LICENSE', 'dist/LICENSE.txt');
// tests/unit/nativeDependencies.test.ts checks it covers every native dependency.
writeFileSync('dist/THIRD_PARTY_LICENSES_NATIVE.md', nativeLicensesMarkdown());

// Run the installed checker with the current Node binary rather than looking up `npx` on PATH.
const json = execFileSync(process.execPath, [
  'node_modules/license-checker-rseidelsohn/bin/license-checker-rseidelsohn.js',
  '--production', '--excludePrivatePackages', '--json',
], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });

const missing = [];
const sections = Object.entries(JSON.parse(json)).map(([nameAtVersion, info]) => {
  const notice = noticeText(info);
  const noticeSection = notice ? '\n\nNOTICE:\n\n```text\n' + notice + '\n```' : '';
  const multi = multiLicenseTexts(nameAtVersion, info);
  if (multi?.texts.length) {
    if (!multi.ok) missing.push(`${nameAtVersion} (${multi.missing.join(', ')})`);
    return `## ${nameAtVersion}\n\nLicense: ${info.licenses} (all license texts included)\n\n` +
      multi.texts.map(({ label, text }) => `${label}:\n\n` + '```text\n' + text + '\n```').join('\n\n') + noticeSection;
  }
  const text = licenseText(nameAtVersion, info);
  if (!text) missing.push(nameAtVersion);
  return `## ${nameAtVersion}\n\nLicense: ${info.licenses}\n\n` +
    (text ? '```text\n' + text + '\n```' : '_No license file shipped with this package._') + noticeSection;
});

writeFileSync('dist/THIRD_PARTY_LICENSES.md',
  '# Third-party licenses (npm packages)\n\n' + sections.join('\n\n') + '\n');

if (missing.length > 0) {
  console.error(`No license text found for: ${missing.join(', ')}\n` +
    'Add licenses/overrides/<name>.txt for each, or licenses/overrides/<name>/<license id>.txt for a missing license ' +
    'of a multi-licensed package (see docs/LICENSES.md).');
  process.exit(1);
}
