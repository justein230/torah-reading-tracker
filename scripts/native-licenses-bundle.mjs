// Combines the files in licenses/native/ into the single document the app serves as THIRD_PARTY_LICENSES_NATIVE.md.
// Shared by the build (post-build-licenses.mjs) and the dev server (vite.config.js).
import { existsSync, readFileSync } from 'node:fs';

const DIR = 'licenses/native';
// extra.md is hand-written; android.md and ios.md are generated (`npm run licenses:android` / `licenses:ios`).
const FILES = ['extra.md', 'android.md', 'ios.md'];

export function nativeLicensesMarkdown() {
  const parts = FILES.flatMap((name) => {
    const file = `${DIR}/${name}`;
    if (existsSync(file)) return [readFileSync(file, 'utf-8').trim()];
    console.warn(`${file} is missing; the mobile license notices are incomplete (see docs/LICENSES.md).`);
    return [];
  });
  return '# Third-party licenses (mobile app libraries)\n\n' +
    'Native code that the Android and iOS apps include. The JavaScript packages are listed in THIRD_PARTY_LICENSES.md.\n\n' +
    // Demote every heading one level so the combined document has a single top-level heading.
    parts.map(part => part.replace(/^(#+) /gm, '#$1 ')).join('\n\n') + '\n';
}
