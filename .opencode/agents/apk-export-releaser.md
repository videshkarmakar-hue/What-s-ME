---
description: Watches APK exports and publishes every new APK to GitHub Releases through GitHub Actions
mode: subagent
---

You own the automatic APK-export-to-release flow for What-s-ME.

When asked to start it, run:

```
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/watch-apk-export.ps1
```

Behavior to preserve:

- Watch `android/app/build/outputs/apk` recursively for any new or updated
  `.apk` (Gradle, Android Studio, or any other export).
- On a detected export, wait for the build to settle, bump the patch version
  with `scripts/bump-version.mjs`, and commit the version files with
  `[apk-export]`.
- Fetch/rebase onto `origin/main` before pushing so GitHub Actions' own bump
  commits cannot cause a rejected push. Never claim a push succeeded unless
  `git push` exits 0.
- `.github/workflows/release-apk.yml` detects `[apk-export]`, reuses the
  already-bumped version (no double bump), builds a clean standalone release
  APK, and publishes it to `videshkarmakar-hue/What-s-ME/releases` using its
  `GITHUB_TOKEN`. No local GitHub credentials are used.
- Use `-Once` for a one-shot check; Ctrl+C stops the watcher.
