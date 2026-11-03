// Builds the signed Android release: an .aab to upload to Google Play and an .apk to sideload.
// Runs the same web/db pipeline as `npm run cap:android`, then Gradle with the versionCode and
// versionName derived from package.json. Signing uses android/keystore.properties (docs/ANDROID_RELEASE.md);
// without it this stops before building anything.
import fs   from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { androidVersion } from '../src/utils/androidVersion.js';

const root       = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');
const outputs    = path.join(androidDir, 'app/build/outputs');

if (!fs.existsSync(path.join(androidDir, 'keystore.properties'))) {
  console.error('android/keystore.properties is missing, so the release would be unsigned. See docs/ANDROID_RELEASE.md.');
  process.exit(1);
}

const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const { versionCode, versionName } = androidVersion(version);

// Gradle 8.14 can't run on Java 25 ("Unsupported class file major version 69"), which is both
// Fedora's default java and Android Studio's bundled JBR. mise.toml pins JDK 21; a shell with
// mise activated already sets JAVA_HOME to it, otherwise ask mise where it is.
const env = { ...process.env };
env.JAVA_HOME ??= miseJavaHome();

function miseJavaHome(): string | undefined {
  try {
    return execSync('mise where java', { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return undefined; // no mise: Gradle falls back to whatever java is on PATH
  }
}

const run = (cmd: string, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit', env });

run('npm run cap:db');
run('npm run build');
run('rm -rf public/assets');
run('npx cap sync android');
run(`./gradlew bundleRelease assembleRelease -PversionCode=${versionCode} -PversionName=${versionName}`, androidDir);

console.log(`\nBuilt ${versionName} (versionCode ${versionCode}):`);
console.log(`  Upload to Play: ${path.join(outputs, 'bundle/release/app-release.aab')}`);
console.log(`  Sideload:       ${path.join(outputs, 'apk/release/app-release.apk')}`);
