// The App Store's version for a release build, taken from package.json's version so the two never
// drift. MARKETING_VERSION is the version users see (CFBundleShortVersionString) and
// CURRENT_PROJECT_VERSION is the build number (CFBundleVersion). App Store Connect rejects an
// upload whose build number isn't higher than every earlier one for that version, so the build
// number is the shared version code (src/utils/appVersion.ts), the same as Android's versionCode: 1.2.0 → 10200.
import { appVersion } from './appVersion.js';

export interface IosVersion {
  marketingVersion: string;
  buildNumber:      string;
}

/** Throws for anything but a plain X.Y.Z release (see appVersion). */
export function iosVersion(version: string): IosVersion {
  const { name, code } = appVersion(version);
  return { marketingVersion: name, buildNumber: String(code) };
}

/** Contents of ios/App/Version.xcconfig, which the Xcode project uses for both settings. */
export function versionXcconfig(version: string): string {
  const { marketingVersion, buildNumber } = iosVersion(version);
  return [
    '// Generated from package.json by scripts/ios-version.ts (npm run ios:version); do not edit.',
    `MARKETING_VERSION = ${marketingVersion}`,
    `CURRENT_PROJECT_VERSION = ${buildNumber}`,
    '',
  ].join('\n');
}
