// Play's versionCode/versionName for a release build, taken from package.json's version so the two
// never drift. Play rejects an upload whose versionCode isn't higher than every earlier one, so the
// code packs major.minor.patch into one increasing integer: 1.1.3 → 10103.
// Prerelease versions (1.1.3-dev.0, 1.1.3-qa.2) are refused: they would share 1.1.3's code, and
// whichever reached Play first would block the other.

export interface AndroidVersion {
  versionCode: number;
  versionName: string;
}

const RELEASE_RE = /^(\d+)\.(\d+)\.(\d+)$/;
const PART_LIMIT = 100; // minor and patch each get two decimal digits

export function androidVersion(version: string): AndroidVersion {
  const m = RELEASE_RE.exec(version.trim());
  if (!m) {
    throw new Error(`"${version}" is not a plain release version (X.Y.Z); bump package.json with npm version patch/minor/major before an Android release`);
  }
  const [major, minor, patch] = m.slice(1).map(Number) as [number, number, number];
  if (minor >= PART_LIMIT || patch >= PART_LIMIT) {
    throw new Error(`"${version}": minor and patch must each be below ${PART_LIMIT} to fit the versionCode scheme`);
  }
  return {
    versionCode: major * PART_LIMIT * PART_LIMIT + minor * PART_LIMIT + patch,
    versionName: `${major}.${minor}.${patch}`,
  };
}
