// Writes ios/App/Version.xcconfig from package.json's version (src/utils/iosVersion.ts), so the
// iOS app's version and build number follow the package version. Runs from the `version` npm
// lifecycle hook, so `npm version` / `npm run release:*` commit the updated file with the bump,
// and from `npm run cap:ios`. Prerelease versions (release:dev / release:qa) can't be an App
// Store build number, so they leave the file alone.
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { versionXcconfig } from '../src/utils/iosVersion.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const target = path.join(root, 'ios/App/Version.xcconfig');

let contents: string;
try {
  contents = versionXcconfig(version);
} catch {
  console.log(`ios/App/Version.xcconfig left unchanged: ${version} is a prerelease version`);
  process.exit(0);
}
fs.writeFileSync(target, contents);
console.log(`ios/App/Version.xcconfig → ${version}`);
