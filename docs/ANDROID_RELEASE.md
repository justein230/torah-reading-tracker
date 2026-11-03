# Android release (Google Play)

Play takes an **Android App Bundle (`.aab`)**, not an APK. Play re-signs the bundle with its own
app-signing key (Play App Signing). The keystore below is only the *upload key*, which proves an
upload came from you.

## One-time setup

1. **Install JDK 21 with [mise](https://mise.jdx.dev).** Gradle 8.14 fails on Java 25
   ("Unsupported class file major version 69"), and Java 25 is both Fedora's default and Android
   Studio's bundled JDK. `mise.toml` pins Temurin 21 for this repo. With mise installed and
   activated in your shell, run this in the repo root:

   ```bash
   mise install
   ```

   `npm run android:release` picks it up from `JAVA_HOME`, or asks `mise where java` if that isn't
   set. For Android Studio builds, set Settings → Build Tools → Gradle → Gradle JDK to the path
   `mise where java` prints.

2. **Create the upload key** outside the repo, and back up the file and its password (a password
   manager works). If you lose it, you have to ask Google to reset the upload key.

   ```bash
   mkdir -p ~/.android-keys && keytool -genkeypair -v -keystore ~/.android-keys/torah-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **Write `android/keystore.properties`** (gitignored):

   ```properties
   storeFile=/home/<you>/.android-keys/torah-upload.jks
   storePassword=...
   keyAlias=upload
   keyPassword=...
   ```

   Without this file, release builds stay unsigned. Debug builds (`npm run cap:android`, Android
   Studio) don't need it.

## Building a release

```bash
npm run android:release
```

This runs the same db/web pipeline as `cap:android`, then `./gradlew bundleRelease assembleRelease`.
The output is:

- `android/app/build/outputs/bundle/release/app-release.aab`: upload this to Play.
- `android/app/build/outputs/apk/release/app-release.apk`: install with `adb install` to try it.

`versionName` is package.json's version and `versionCode` is packed from it: 1.1.3 → 10103
(`src/utils/androidVersion.ts`). Play rejects a versionCode it has already seen, so bump the
version (`npm version patch`/`minor`/`major`) before each upload. Prerelease versions
(`-dev.N`, `-qa.N`) are refused.

## First upload in Play Console

1. **Create app**: name, default language, app or game, free or paid, and the declarations.
2. **App content / store listing** (needed before any release is reviewed):
   - A privacy policy URL. Play requires one even though data stays on the device.
   - The Data safety form, content rating questionnaire, target audience, ads declaration and
     category.
   - Graphics: a 512×512 icon, a 1024×500 feature graphic (`scripts/feature-graphic.html`) and at
     least 2 phone screenshots (`npm run screenshots`, output in `store/screenshots/play`).
3. **Internal testing** first: create a release, accept Play App Signing, upload the `.aab`, add
   yourself as a tester, and install it from Play on your phone.
4. **Production access**: personal accounts created after November 2023 must run a closed test with
   at least 12 testers for 14 days before applying for production. The Console dashboard shows
   whether this applies to your account.

## Later releases

Bump the version, run `npm run android:release`, upload the new `.aab` to a track, add release
notes, and roll out.
