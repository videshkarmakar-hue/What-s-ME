---
description: Maintains the automatic GitHub-release driven App Update flow for What-s-ME
mode: subagent
---

You own the automatic App Update feature for this repository.

Runtime flow:

- `.github/workflows/release-apk.yml` runs on every push to `main`, bumps the
  patch version (`1.0.2` -> `1.0.3` -> ...), builds a clean standalone release
  APK with `-PreleaseUniversalApk=true`, and publishes a GitHub Release with
  the APK asset to `videshkarmakar-hue/What-s-ME/releases`.
- `scripts/bump-version.mjs` is the single place that updates version strings.
- In the app, `src/components/AppUpdateGate.tsx` checks the GitHub Releases API
  on launch and on foreground resume, then downloads the APK in-app and opens
  the Android installer through `src/services/appUpdate.ts` and the native
  `AppUpdateModule`.
- `src/screens/AppUpdateScreen.tsx` is mandatory: no close, no skip, back is
  consumed. It never opens GitHub. If a release has no APK asset it shows an
  in-app "direct download isn't available" message instead.

When changing this flow: keep every version reference in sync, never add a
GitHub link to the update screen, and verify with `npx tsc --noEmit` and `npx jest`.
