# Regenerating the native (Android / iOS) license files

Step-by-step. For the big picture (which files the app serves and how the npm side works) see `LICENSES.md`.

## What this produces

| File | Source of truth | You |
|---|---|---|
| `licenses/native/android.md` | Gradle: every library the Android app resolves, via the AboutLibraries plugin | regenerate with `npm run licenses:android` |
| `licenses/native/ios.md` | CocoaPods: the `Pods-App-acknowledgements.markdown` that `pod install` writes | regenerate with `npm run licenses:ios` (Mac) or CI |
| `licenses/native/extra.md` | Nothing: code the tools cannot see (OpenSSL inside SQLCipher, the Cordova NOTICE) | edit by hand |
| `licenses/native/overrides/*.txt` | Nothing: license text for libraries whose build metadata carries none | add by hand when the generator asks |

All of them are committed. The build joins them into `dist/THIRD_PARTY_LICENSES_NATIVE.md`, which the About modal shows.

## When to regenerate

- After adding, removing or upgrading a Capacitor plugin (`@capacitor/*`, `@capacitor-community/*`) or Capacitor itself.
- When `tests/unit/nativeDependencies.test.ts` fails with `covers <library>`: a library it expects is not in `licenses/native/`.
- When the `native-licenses` CI workflow fails (it regenerates the files and fails on any difference).

## Android, step by step

You need JDK 17 or newer (21 is what CI uses) and an Android SDK with platform 36 and its licenses accepted.
On this machine the SDK is at `~/android-sdk`, and `android/local.properties` (gitignored) points Gradle at it:

```properties
sdk.dir=/home/justein/android-sdk
```

If that file is missing, create it, or export `ANDROID_HOME`. Then, from the repo root:

```bash
npm install                  # if dependencies changed
npm run build                # cap sync copies dist/ into the Android project, so it must exist
npm run licenses:android
```

`licenses:android` does three things in order: `npx cap sync android` (also generates the Cordova plugin module that Gradle
needs), `./gradlew :app:exportLibraryDefinitions` (writes `android/app/build/aboutlibraries.json`, gitignored), and
`scripts/native-licenses.ts android …`, which turns that JSON into `licenses/native/android.md`.
It takes about 15 seconds once Gradle's caches are warm; the first run downloads dependencies.

Then:

```bash
git diff licenses/native/android.md   # a version bump should show up as a changed version, nothing else
npm test                              # nativeDependencies.test.ts must pass for Android
```

Commit `android.md`. Running it twice must give an identical file; if it does not, something is non-deterministic (investigate before committing).

### "No license text for: <library>"

The generator refuses to write a file with a gap. Some libraries (SQLCipher, the Ionic filesystem library) declare only
a URL, not the license text, and the plugin runs offline so it cannot fetch it. Supply the text:

1. Get the license text from the library's repository (or the URL in the error / in the exported JSON).
2. Save it as `licenses/native/overrides/<name>.txt`, where `<name>` is either
   - the library id with `:` written as `__`: `net.zetetic:sqlcipher-android` becomes `net.zetetic__sqlcipher-android.txt`, or
   - a license id when many libraries share one text: `Apache-2.0.txt` (this is how the 61 Apache libraries are covered).
3. Re-run `npm run licenses:android`. A library's own exported text always wins over an override.

Overrides are keyed by name, not version: when you bump such a library, check whether its license text or copyright year changed.

## iOS, step by step

This needs macOS with CocoaPods, because `cap sync ios` runs `pod install`, which writes the acknowledgements file.

One-time setup on the Mac: Xcode with its command-line tools (`xcode-select --install`), Node LTS, and CocoaPods
(`brew install cocoapods`). You do not need to open Xcode, build, or have a simulator.

```bash
git fetch && git checkout licenses     # the branch must be pushed first
npm ci --ignore-scripts                # same as CI; the native modules are not needed
npm run build                          # cap sync copies dist/ into the iOS project
npm run licenses:ios                   # cap sync ios (runs pod install), then writes licenses/native/ios.md
git status --short                     # expect licenses/native/ios.md, and maybe ios/App/Podfile.lock
```

The first `pod install` downloads the CocoaPods spec index and can take several minutes. Copy `licenses/native/ios.md` back to the
repo (or commit it from the Mac) and run `npm test`: the `covers SQLCipher / ZIPFoundation / IONFilesystemLib` tests should now pass.
If `ios/App/Podfile.lock` changed, look at the diff before committing it: it records which pod versions the plugins resolved to, so a change
means the plugins moved since the lock was written. That is normal after upgrading a Capacitor plugin; commit the updated lock with the new `ios.md`.

If it fails:

- `CocoaPods could not find compatible versions for pod "<X>"` (e.g. `IONFilesystemLib (= 1.1.4, ~> 1.1.1)` in the snapshot but a plugin now needs `~> 2.0.0`):
  `Podfile.lock` is older than the installed plugins (`package.json` uses `^` ranges, so `npm ci` can pull newer plugins than the lock was written for).
  Run `cd ios/App && pod update <X> --repo-update`, then re-run `npm run licenses:ios` and commit the updated `Podfile.lock`.
  After a plugin upgrade, do this proactively.

- `ENOENT … Pods-App-acknowledgements.markdown`: `pod install` did not run or failed. Run `cd ios/App && pod install` and read its error. If the file is
  elsewhere, find it with `find ios -name '*acknowledgements.markdown'` and fix the path in the `licenses:ios` script in `package.json`.
- `No license text for: <pod>`: that pod ships no license text. Find it in the pod's repository; the iOS generator has no overrides yet, so this needs a small
  change to `scripts/native-licenses.ts` (apply `readOverrides()` in `formatIosAcknowledgements` as `formatAndroidLicenses` does).

No Mac: use CI (below). Same rule as Android: a pod with no license text makes the generator fail rather than write a gap.

## Without an Android SDK or a Mac: CI

`.github/workflows/native-licenses.yml` has an `android` job (ubuntu) and an `ios` job (macOS). It builds and uploads nothing: it
regenerates the file, and if it differs from the committed one it fails and prints the new content in the log.

1. Push the branch, then Actions → `native-licenses` → "Run workflow" (it also runs on pushes that touch `package-lock.json`, `android/`, `ios/`).
2. Open the failed job's log, copy the printed file content into `licenses/native/android.md` / `ios.md`, commit.
3. Re-run the workflow; it should pass.

## Staying in line with Capacitor

The Android project is Capacitor's: do not change its Android Gradle Plugin (`com.android.tools.build:gradle`), the Gradle wrapper,
`compileSdk`/`minSdk`/`targetSdk`, or the AndroidX versions in `android/variables.gradle`. `npx cap migrate` / a Capacitor major upgrade
owns those. Our additions are small and only for licensing:

- `android/build.gradle`: the AboutLibraries plugin on the `buildscript` classpath, and `gradlePluginPortal()` in the buildscript repositories (the plugin is published only there, not on Google or Maven Central).
- `android/app/build.gradle`: `apply plugin: 'com.mikepenz.aboutlibraries.plugin'` and the `aboutLibraries { … }` block. Nothing here ends up in the APK.

`cap sync` does not overwrite either file, but a Capacitor upgrade (`cap migrate`) may rewrite them: after one, check that these lines survived.
Upgrading the plugin itself means changing the version in `android/build.gradle`.

## Things that went wrong the first time (and why)

| Symptom | Cause | Fix (already applied) |
|---|---|---|
| `Could not find com.mikepenz.aboutlibraries.plugin:aboutlibraries-plugin:15.2.0` | Plugin lives only on the Gradle Plugin Portal | `gradlePluginPortal()` in the buildscript repositories |
| `Could not set unknown property 'fetchRemoteLicense' for extension 'aboutLibraries'` | In Groovy, `collect { … }` calls Groovy's built-in `Object.collect`, not the plugin's block (the docs show Kotlin DSL) | `collect.fetchRemoteLicense = false` |
| Follow-up error `project ':app' does not specify compileSdk` | Not a real problem: Gradle stopped evaluating `app/build.gradle` at the error above, before reaching `android { }` | goes away with the fix above |
| Every library listed under one license with no text | Offline mode cannot fetch texts, and an empty text looked like one license | overrides (above) and the generator now fails on a missing text |
| `covers androidx.room:room-compiler` failing | An `annotationProcessor` runs at build time and is not packaged into the app, so the tool correctly omits it | the test's parser ignores `annotationProcessor` |

These Gradle messages are harmless: `Using flatDir should be avoided`, `Configuration '…ClasspathX' was resolved during configuration time`
(Capacitor's own modules), and `… does not contain the license text and configuration is in OFFLINE MODE` (that is what the overrides are for).

## Which tool does what (for debugging)

- `android/app/build.gradle`: the `aboutLibraries { offlineMode = true; collect.fetchRemoteLicense = false; export { outputFile = … } }` block configures the export.
- `scripts/native-licenses.ts`: pure functions `formatAndroidLicenses` / `formatIosAcknowledgements` plus a small CLI. Groups libraries by license text so Apache-2.0 appears once, sorts for stable diffs, and fails when a text is missing. Tests: `tests/unit/nativeLicenses.test.ts`.
- `scripts/native-licenses-bundle.mjs`: joins `extra.md`, `android.md` and `ios.md` for the build and the dev server.
- `scripts/native-dependencies.ts` and `tests/unit/nativeDependencies.test.ts`: read the `build.gradle` / `.podspec` files of the Capacitor plugins, Capacitor core and `android/app`, and check each shipped dependency is named in `licenses/native/` (version ignored).
