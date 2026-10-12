import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseGradleDependencies, parsePodspecDependencies } from '../../scripts/native-dependencies';

describe('parseGradleDependencies', () => {
  it('keeps fixed versions and drops variable versions and @aar suffixes', () => {
    const gradle = `
      implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
      implementation 'androidx.room:room-runtime:2.6.1'
      implementation 'net.zetetic:sqlcipher-android:4.17.0@aar'
      implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:$kotlinxCoroutinesVersion")`;
    expect(parseGradleDependencies(gradle)).toEqual([
      'androidx.appcompat:appcompat',
      'androidx.room:room-runtime:2.6.1',
      'net.zetetic:sqlcipher-android:4.17.0',
      'org.jetbrains.kotlinx:kotlinx-coroutines-core',
    ]);
  });

  it('ignores annotation processors and test dependencies, which are not packaged into the app', () => {
    const gradle = `
      annotationProcessor 'androidx.room:room-compiler:2.6.1'
      testImplementation "junit:junit:$junitVersion"
      androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"`;
    expect(parseGradleDependencies(gradle)).toEqual([]);
  });

  it('ignores file, project and Capacitor core dependencies', () => {
    const gradle = `
      implementation fileTree(dir: 'libs', include: ['*.jar'])
      implementation project(':capacitor-android')
      implementation "com.capacitorjs:core:$capacitorVersion"`;
    expect(parseGradleDependencies(gradle)).toEqual([]);
  });
});

describe('parsePodspecDependencies', () => {
  it('lists non-Capacitor pods', () => {
    const podspec = `
      s.dependency 'Capacitor'
      s.dependency 'SQLCipher'
      s.dependency 'IONFilesystemLib', spec='~> 2.0.0'`;
    expect(parsePodspecDependencies(podspec)).toEqual(['SQLCipher', 'IONFilesystemLib']);
  });
});

// Every native dependency declared by the Capacitor plugins (and Capacitor core and our own app module)
// must appear in licenses/native/. Fails when a generated file is stale: run `npm run licenses:android`
// or `npm run licenses:ios` (see docs/LICENSES.md).
describe('licenses/native/', () => {
  const notices = readdirSync('licenses/native')
    .filter(file => file.endsWith('.md'))
    .map(file => readFileSync(path.join('licenses/native', file), 'utf-8'))
    .join('\n');
  const { dependencies } = JSON.parse(readFileSync('package.json', 'utf-8'));
  const packages = Object.keys(dependencies).filter(name => /^@capacitor(-community)?\//.test(name));

  const gradleFiles = [
    ...packages.flatMap(name => [
      path.join('node_modules', name, 'android', 'build.gradle'),
      path.join('node_modules', name, 'capacitor', 'build.gradle'), // Capacitor core keeps its module here
    ]),
    path.join('android', 'app', 'build.gradle'),
  ];
  const declared = [
    ...gradleFiles.filter(existsSync).flatMap(file => parseGradleDependencies(readFileSync(file, 'utf-8'))),
    ...packages.flatMap((name) => {
      const root = path.join('node_modules', name);
      const podspecs = existsSync(root) ? readdirSync(root).filter(f => f.endsWith('.podspec')) : [];
      return podspecs.flatMap(f => parsePodspecDependencies(readFileSync(path.join(root, f), 'utf-8')));
    }),
  ];

  it('finds the native dependencies of the installed Capacitor plugins', () => {
    expect(declared.length).toBeGreaterThan(0);
  });

  // The version is left out: Gradle may resolve a newer one than the plugin asks for.
  it.each([...new Set(declared.map(dependency => dependency.split(':').slice(0, 2).join(':')))])('covers %s', (dependency) => {
    const listed = new RegExp('`' + dependency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(:[^`]*)?`');
    expect(notices).toMatch(listed);
  });
});
