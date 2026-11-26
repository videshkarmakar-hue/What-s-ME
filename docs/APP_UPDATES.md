# App Update

The app checks GitHub Releases on launch and on foreground resume. When a newer
release is published, a mandatory App Update screen blocks the app until the
new version is installed.

## In-app behavior

1. `GET https://api.github.com/repos/videshkarmakar-hue/What-s-ME/releases`.
2. Compare the newest published tag with the installed version from Android's
   `PackageManager`.
3. If newer, download the APK asset into app-private storage with progress,
   then open the Android installer through a `FileProvider` URI.
4. If the release has no `.apk` asset, the screen shows an in-app message:
   "A direct download isn't available for this release." It never opens GitHub.
5. Back button is consumed; there is no close or skip control.

## Automatic publishing

`.github/workflows/release-apk.yml` runs on every push to `main`:

- bumps the patch version (`1.0.2` → `1.0.3` → …),
- updates all version strings via `scripts/bump-version.mjs`,
- builds a clean standalone release APK (`assembleRelease -PreleaseUniversalApk=true`),
- commits the bump with `[skip ci]` to avoid a loop,
- publishes the APK asset to the GitHub Release.

## Files

- `src/components/AppUpdateGate.tsx` — lifecycle and mandatory gate
- `src/screens/AppUpdateScreen.tsx` — non-closable UI
- `src/services/appUpdate.ts` — GitHub API, download, install
- `src/utils/appUpdate.ts` — pure parsing/version helpers
- `android/.../AppUpdateModule.java` — native version/install bridge
- `.github/workflows/release-apk.yml` — release automation
