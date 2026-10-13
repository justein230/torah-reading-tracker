# Third-party license files

The app ships three license files, linked from the "i" icon in the top bar, which opens the About modal
(`src/components/AboutModal.tsx`; add a link there if you add a file). Each opens in an in-app viewer
(`LicenseViewerModal`) rather than as a link, because navigating away from the app strands the user on iOS/Android.
`npm run build` generates two of them and assembles the third from files in `licenses/native/`.
Never edit anything in `dist/` — it is overwritten on every build.

| File served by the app | What it covers | How it is produced | Source |
|---|---|---|---|
| `LICENSE.txt` | Our own MIT license | Copied from `LICENSE` | `scripts/post-build-licenses.mjs` |
| `THIRD_PARTY_LICENSES.md` | All production npm dependencies (browser bundle and server), full license text | `license-checker-rseidelsohn` after the build | `scripts/post-build-licenses.mjs` |
| `THIRD_PARTY_LICENSES_NATIVE.md` | Native Android/iOS libraries | The three files in `licenses/native/` joined by the build | `scripts/native-licenses-bundle.mjs` |

The three files in `licenses/native/` are committed, so web, Docker and Electron builds need neither an Android SDK nor a Mac:

| File | Produced by |
|---|---|
| `android.md` | **Generated:** `npm run licenses:android` (AboutLibraries Gradle plugin) |
| `ios.md` | **Generated:** `npm run licenses:ios` (CocoaPods acknowledgements) |
| `extra.md` | **Written by hand:** what the tools cannot see (OpenSSL inside SQLCipher, the Apache Cordova NOTICE) |
| `overrides/*.txt` | **Written by hand:** license text for libraries whose build metadata has none (see `NATIVE_LICENSES.md`) |

## Regenerating (the normal case)

After adding, removing or upgrading an npm dependency, just rebuild:

```bash
npm run build
```

Every build regenerates the two generated files, including in Docker (the builder stage runs
`npm run build` with devDependencies installed), Electron and Capacitor (`cap:sync` runs the build).

The build fails if any package ends up without license text, listing the packages (see below).
Spot-check the result:

```bash
ls dist/LICENSE.txt dist/THIRD_PARTY_LICENSES*.md       # three files
grep "^## <package-name>@" dist/THIRD_PARTY_LICENSES.md  # spot-check a package
```

## The build fails with "No license text found for: ..."

Some packages declare a license in `package.json` but ship no license file. The notice requirement
(MIT, BSD, Apache) still applies, so supply the text:

1. Look in the package's README (`node_modules/<name>/README.md`). A real "License" section is picked up
   automatically, so you may not see this message at all.
2. Otherwise take the text from the package's upstream repository (its `package.json` `repository` field),
   and save it as `licenses/overrides/<name>.txt`. In scoped names replace `/` with `__`:
   `@scope/name` becomes `@scope__name.txt`.
   For platform-specific binary packages (names ending in `-<os>-<arch>...`, such as
   `@rollup/rollup-linux-x64-gnu`), drop that suffix so one file covers every build machine:
   `@rollup__rollup.txt`.
3. Rebuild.

Overrides are keyed by package name, not version. A package's own `LICENSE` file always wins over an
override, so an override is harmless once a later version starts shipping one.

## Packages with more than one license

Some packages are dual- or multi-licensed, e.g. `rc` `(BSD-2-Clause OR MIT OR Apache-2.0)` or
`pako` `(MIT AND Zlib)`. The generators (`scripts/license-expression.mjs`) include the text of **every**
declared license, so there is no need to record which one was chosen:

- **npm:** every `LICENSE*` / `COPYING*` file in the package is printed. The build fails, naming the package and
  the license, when an `AND` expression has a license without text, or an `OR` expression has none at all.
  Supply a missing text as `licenses/overrides/<name>/<SPDX id>.txt` (e.g. `licenses/overrides/pako/Zlib.txt`;
  scoped names use `__` as above).
- **Android:** all licenses AboutLibraries lists for a library are printed under a heading that joins their names
  (`Apache License 2.0 + MIT License`). Maven does not say AND or OR, so each one must have text, or the generator
  fails. Add it as `licenses/native/overrides/<license id>.txt`; a text named after the library applies only to
  single-license libraries.
- **iOS:** the acknowledgements carry no license ids, so a pod whose text contains several licenses is recognised
  by its wording and the heading names them all. Nothing can be checked here.

## The native-libraries test fails

`tests/unit/nativeDependencies.test.ts` fails with `covers <dependency>` when a native dependency declared by a
Capacitor plugin (`@capacitor/*`, `@capacitor-community/*`), by Capacitor core, or by `android/app/build.gradle`
is not listed in `licenses/native/`. This happens after upgrading or adding a Capacitor plugin, and until the
first generation of `android.md` / `ios.md`. The version is ignored: only `group:artifact` (or the pod name) must be listed.

Regenerate the lists (full walkthrough, troubleshooting and the reasoning behind the setup: `NATIVE_LICENSES.md`):

- **Android:** `npm run licenses:android`. Needs JDK 17+ and the Android SDK (`sdk.dir` in `android/local.properties`, or `ANDROID_HOME`).
- **iOS:** `npm run licenses:ios`. Needs macOS with CocoaPods, because `cap sync ios` runs `pod install`.
- **Without either:** run the `native-licenses` workflow (`.github/workflows/native-licenses.yml`) with
  "Run workflow". It builds nothing and uploads nothing. It regenerates the files, and if they differ from
  the committed ones it fails and prints the new content in the log, to copy into `licenses/native/`. It also
  runs on pushes that change `package-lock.json`, `android/` or `ios/`.

Commit the result. Then check `licenses/native/extra.md` still holds: a library that statically links
another one (as SQLCipher does with OpenSSL) or ships a NOTICE file is invisible to the tools and has to
be added there by hand.

What the test cannot see: license changes that come without a version change, and anything the tools do not list.

## The native projects (`android/`, `ios/`)

They are committed as source only (about 1.4 MB): Capacitor's own `.gitignore` files in each folder exclude
build output, `Pods/`, the copied web assets and the seed database. Check `git status` after a build and never
add `build/`, `Pods/`, `public/` or any `*.db`. `android/.gitignore` also excludes `*.jks` and `*.keystore`.

`android/app/build.gradle` applies the AboutLibraries plugin only to export the dependency list; it adds
nothing to the app. `npx cap sync` does not overwrite that file.

## Previewing in development

`npm run concurrent` serves the three files at `/LICENSE.txt` and `/THIRD_PARTY_LICENSES*.md`:
`LICENSE.txt` and the native file come straight from the repo; `THIRD_PARTY_LICENSES.md` comes from `dist/`, so it
shows "not generated yet" until you have run `npm run build` once, and is only as fresh as that last build.
A missing file in `licenses/native/` is skipped with a warning in the build output.

## Releasing

A fix only reaches users in a new build:

- **Docker:** rebuild and push the image. The files are inside `dist/`, which the Dockerfile already copies.
- **Electron/Capacitor:** build as usual; `dist/**` is packaged into both.
- Old releases cannot be patched. Ship a new release and make it the one people get.

## Tooling notes

- `license-checker-rseidelsohn` uses 5.x (exact version in the lockfile). If an update changes its JSON output
  so license texts go missing, the build fails rather than shipping gaps. Its README says development is moving to
  `@lizenz/checker`, but only 0.0.x versions of that exist (checked October 2026). When `@lizenz/checker`
  reaches 1.0, the swap should be the package name in `package.json` and the `npx` call in
  `scripts/post-build-licenses.mjs`. Check that its JSON output still has a `licenseFile` field per package.
- The list covers production dependencies only (`--production`). If frontend code ever imports a package
  from `devDependencies`, it ends up in the bundle without being listed: move it to `dependencies`.
- Fonts (Inter, Noto Sans Hebrew) are loaded from Google Fonts at runtime and are not redistributed, so
  they are not listed. If they are ever self-hosted, their SIL OFL text must be added.
- Apache-2.0 packages that ship a `NOTICE` file get its text appended to their entry in
  `THIRD_PARTY_LICENSES.md` (`noticeText` in `scripts/post-build-licenses.mjs`), as Apache-2.0 §4(d) requires.
  None of the current production dependencies has one.
- Electron's own and Chromium's notices (`LICENSE.electron.txt`, `LICENSES.chromium.html`) are added to the
  desktop packages by electron-builder; nothing here produces them.
