# App Update (mandatory in-app updates)

The app checks GitHub Releases automatically and offers a **non-dismissible** update screen whenever a newer version is published.

## Flow

1. On launch and every time the app returns to the foreground, `AppUpdateGate`
   calls `GET https://api.github.com/repos/videshkarmakar-hue/What-s-ME/releases`
   and inspects the newest published (non-draft) release, including pre-releases.
2. The release tag (for example `v1.0.1`) is compared with the installed version
   from the Android `PackageManager`. Checks are throttled to once per minute
   while the app is in the foreground.
3. If the release is newer, the App Update screen appears over the whole app:
   - Back button/gesture is consumed, there is no close button and no skip option.
   - If the release has an `.apk` asset (a `debug` APK is preferred), the APK is
     downloaded into the app's private files directory and the Android package
     installer is opened through a `FileProvider` URI.
   - If the release has **no** APK asset, the screen shows an in-app message:
     "A direct download isn't available for this release." It never opens GitHub.
4. Network/API failures never block normal app usage; the check simply fails
   silently and can be retried on the next resume or with "Check again".

## Automatic release agent

`.github/workflows/release-apk.yml` is the release "agent". On every push to
`main` it:

1. Reads the newest published release tag from `videshkarmakar-hue/What-s-ME`
   and bumps the patch version (`1.0.0` → `1.0.1` → `1.0.2`, …). With no
   releases yet, it starts from `1.0.0` and publishes `v1.0.1`.
2. Runs `scripts/bump-version.mjs` to update `versionName`, `versionCode`,
   `package.json`, `package-lock.json`, all translated version labels, the
   About screen, the updater fallback and the F-Droid recipe.
3. Builds a **clean universal debug APK** with
   `./gradlew clean assembleDebug -PreleaseUniversalApk=true` (normal local
   builds are unchanged: they still produce one APK per ABI).
4. Commits the version bump with `[skip ci]` so the workflow does not loop.
5. Creates/updates the GitHub Release `vX.Y.Z` with a single `.apk` asset named
   `What-s-ME-vX.Y.Z-debug.apk`.

The in-app updater tracks those releases, so a published release is enough —
no manual GitHub visit is needed.

### Local APK export watcher

`scripts/watch-apk-export.ps1` watches `android/app/build/outputs/apk`. When any
APK is exported (Gradle, Android Studio, etc.), it bumps the patch version,
commits with `[apk-export]` and pushes to `main`. The workflow detects that
marker, reuses the already-bumped version, builds a fresh APK and publishes the
release with its own `GITHUB_TOKEN`. No GitHub credentials are needed locally.

Start it with:

```
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/watch-apk-export.ps1
```

The OpenCode agent definition is `.opencode/agents/apk-release-watcher.md`.

## Publishing an update manually

The workflow above is the normal path. To do it by hand:

1. Bump `versionName`/`versionCode` in `android/app/build.gradle`.
2. Build an APK, e.g. `cd android && ./gradlew assembleDebug`.
3. Create a GitHub release at
   https://github.com/videshkarmakar-hue/What-s-ME/releases/new
   with a tag higher than the installed version (e.g. `v1.0.1`).
4. **Attach the APK file to the release** (asset name ending in `.apk`). Without
   an APK asset the app will show the in-app "direct download unavailable"
   message instead of updating.

## Verification

- `npm test -- --runTestsByPath __tests__/appUpdate.test.ts` covers version
  comparison and the "release without APK" parsing case.
- To verify the full flow on a device/emulator: install the currently built APK,
  publish a release with a newer tag and an APK asset, then open the app. It
  should show the mandatory App Update screen, download the APK, and open the
  installer. Publishing a tag-only release (no APK asset) should show the in-app
  message instead of a browser.

## Relevant files

- `src/components/AppUpdateGate.tsx` — check lifecycle and mandatory gate
- `src/screens/AppUpdateScreen.tsx` — non-closable UI, progress, install/retry
- `src/services/appUpdate.ts` — GitHub API, APK download, install bridge
- `src/utils/appUpdate.ts` — pure release parsing and version comparison
- `.github/workflows/release-apk.yml` — automatic push-to-release build/publish
- `scripts/bump-version.mjs` — keeps every version string in sync
- `android/app/src/main/java/com/videshkarmakar/whatsapp/AppUpdateModule.java`
- `android/app/src/main/res/xml/app_update_file_paths.xml`
