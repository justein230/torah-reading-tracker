// Native (Android/iOS) dependencies that Capacitor plugins declare, so a test can check that each one is
// covered by licenses/native.md. The Capacitor core itself is MIT and listed with the JS packages.

// annotationProcessor is left out: it runs at build time and is not packaged into the app.
const GRADLE_DEPENDENCY = /^[ \t]*(?:implementation|api)[ \t]*\(?[ \t]*["']([^"']+)["']/gm;
const PODSPEC_DEPENDENCY = /s\.dependency\s+'([^']+)'/g;

/**
 * "group:artifact:version" for fixed versions, "group:artifact" when the version is a gradle variable
 * (e.g. `$androidxAppCompatVersion`) or absent. Skips file/project dependencies and Capacitor core.
 */
export function parseGradleDependencies(gradle: string): string[] {
  return [...gradle.matchAll(GRADLE_DEPENDENCY)]
    .map(([, spec = '']) => spec.split('@')[0]!.split(':'))
    .filter(([group]) => group !== 'com.capacitorjs')
    .map(([group, artifact, version]) =>
      version && !version.startsWith('$') ? `${group}:${artifact}:${version}` : `${group}:${artifact}`);
}

/** Pod names a podspec depends on, excluding the Capacitor pods. */
export function parsePodspecDependencies(podspec: string): string[] {
  return [...podspec.matchAll(PODSPEC_DEPENDENCY)]
    .map(([, name = '']) => name)
    .filter(name => name && !name.startsWith('Capacitor'));
}
