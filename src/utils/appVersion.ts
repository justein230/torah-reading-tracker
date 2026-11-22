// The store version for a release build, taken from package.json's version so the two never drift.
// Play (versionCode) and App Store Connect (build number) both reject an upload whose code isn't
// higher than every earlier one, so the code packs major.minor.patch into one increasing integer:
// 1.1.3 → 10103.
// Prerelease versions (1.1.3-dev.0, 1.1.3-qa.2) are refused: they would share 1.1.3's code, and
// whichever reached the store first would block the other.
// android/app/build.gradle repeats this packing in Groovy, because Gradle reads package.json
// itself; tests/unit/appVersion.test.ts fails if the two disagree.

export interface AppVersion {
  name: string; // what users see: Android versionName, iOS MARKETING_VERSION
  code: number; // what must rise with every upload: Android versionCode, iOS CURRENT_PROJECT_VERSION
}

const RELEASE_RE = /^(\d+)\.(\d+)\.(\d+)$/;
export const PART_LIMIT = 100; // minor and patch each get two decimal digits

export function appVersion(version: string): AppVersion {
  const m = RELEASE_RE.exec(version.trim());
  if (!m) {
    throw new Error(`"${version}" is not a plain release version (X.Y.Z); bump package.json with npm version patch/minor/major before a store release`);
  }
  const [major, minor, patch] = m.slice(1).map(Number) as [number, number, number];
  if (minor >= PART_LIMIT || patch >= PART_LIMIT) {
    throw new Error(`"${version}": minor and patch must each be below ${PART_LIMIT} to fit the version code scheme`);
  }
  return {
    name: `${major}.${minor}.${patch}`,
    code: major * PART_LIMIT * PART_LIMIT + minor * PART_LIMIT + patch,
  };
}
