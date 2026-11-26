import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AppUpdateScreen, { AppUpdatePhase } from '../screens/AppUpdateScreen';
import {
  deleteDownloadedApk,
  downloadReleaseApk,
  fetchLatestRelease,
  getCurrentAppVersion,
  getCurrentAppVersionCode,
  getApkVersion,
  getApkVersionCode,
  getLastUpdateCode,
  installApk,
  markUpdateInstalled,
} from '../services/appUpdate';
import {
  AppRelease,
  isNewerVersion,
  resolveUpdateVersion,
} from '../utils/appUpdate';

const RECHECK_THROTTLE_MS = 60_000;

function describeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong while downloading the update.';
}

/**
 * Checks GitHub Releases on launch and foreground resume. The update decision
 * uses the version embedded in the APK file, not just the release tag, so a
 * mismatched tag cannot cause an endless update prompt after installing.
 */
const AppUpdateGate: React.FC<PropsWithChildren> = ({ children }) => {
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [phase, setPhase] = useState<AppUpdatePhase>('downloading');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const lastCheckRef = useRef(0);
  const downloadedPathRef = useRef<string | null>(null);
  const activeReleaseRef = useRef<AppRelease | null>(null);
  const apkCodeRef = useRef<number | null>(null);

  /** Downloads the APK, verifies its real version, and only then shows the gate. */
  const prepareUpdate = useCallback(
    async (target: AppRelease, installedVersion: string) => {
      activeReleaseRef.current = target;

      if (!target.apk) {
        setError(null);
        setPhase('no-apk');
        setRelease(target);
        return;
      }

      setError(null);
      setProgress(0);
      setPhase('downloading');

      try {
        const path = await downloadReleaseApk(target.apk, setProgress);
        const [apkVersion, apkCode, installedCode, lastCode] = await Promise.all([
          getApkVersion(path),
          getApkVersionCode(path),
          getCurrentAppVersionCode(),
          getLastUpdateCode(),
        ]);
        const effectiveVersion = resolveUpdateVersion(
          target.version,
          apkVersion,
        );

        // versionCode is the authoritative comparison. The stored marker
        // covers the case where Android reports a stale version after install.
        const baselineCode = Math.max(installedCode ?? 0, lastCode ?? 0);
        const alreadyInstalled =
          apkCode !== null
            ? apkCode <= baselineCode
            : !isNewerVersion(effectiveVersion, installedVersion);

        if (alreadyInstalled) {
          await deleteDownloadedApk(path);
          return;
        }

        apkCodeRef.current = apkCode;
        downloadedPathRef.current = path;
        setRelease({ ...target, version: effectiveVersion });
        setProgress(100);
        setPhase('ready');
      } catch (downloadError) {
        setError(describeError(downloadError));
        setPhase('error');
        setRelease(target);
      }
    },
    [],
  );

  const checkForUpdate = useCallback(
    async (force: boolean = false) => {
      // Never interrupt an install or a download that is already in progress.
      if (release && !force && phase !== 'error' && phase !== 'no-apk') {
        return;
      }

      const now = Date.now();
      if (!force && now - lastCheckRef.current < RECHECK_THROTTLE_MS) {
        return;
      }
      lastCheckRef.current = now;

      try {
        const installedVersion = await getCurrentAppVersion();
        const latest = await fetchLatestRelease();
        if (!latest) return;

        // A release without an APK cannot be installed, but still needs a
        // decision based on its tag.
        if (!latest.apk && !isNewerVersion(latest.version, installedVersion)) {
          return;
        }

        await prepareUpdate(latest, installedVersion);
      } catch {
        // A failed check must never break or block the app.
      }
    },
    [phase, release, prepareUpdate],
  );

  const checkRef = useRef(checkForUpdate);
  useEffect(() => {
    checkRef.current = checkForUpdate;
  }, [checkForUpdate]);

  useEffect(() => {
    void checkRef.current(true);

    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          void checkRef.current(false);
        }
      },
    );

    return () => subscription.remove();
  }, []);

  const handleInstall = useCallback(async () => {
    const target = activeReleaseRef.current ?? release;
    if (!target) return;

    if (!downloadedPathRef.current) {
      const installedVersion = await getCurrentAppVersion();
      await prepareUpdate(target, installedVersion);
      return;
    }

    setPhase('installing');
    setError(null);

    try {
      await installApk(downloadedPathRef.current);
      if (apkCodeRef.current !== null) {
        await markUpdateInstalled(apkCodeRef.current);
      }
      // The system installer takes over; if the user backs out, allow retrying.
      setTimeout(() => {
        setPhase(current => (current === 'installing' ? 'ready' : current));
      }, 5000);
    } catch (installError) {
      setError(describeError(installError));
      setPhase('error');
    }
  }, [release, prepareUpdate]);

  const handleRetry = useCallback(() => {
    const target = activeReleaseRef.current ?? release;
    if (!target) return;
    void getCurrentAppVersion().then(installedVersion =>
      prepareUpdate(target, installedVersion),
    );
  }, [release, prepareUpdate]);

  const handleRecheck = useCallback(() => {
    void checkRef.current(true);
  }, []);

  useEffect(() => {
    return () => {
      void deleteDownloadedApk(downloadedPathRef.current);
    };
  }, []);

  return (
    <>
      {children}
      {release && (
        <AppUpdateScreen
          release={release}
          phase={phase}
          progress={progress}
          error={error}
          onInstall={handleInstall}
          onRetry={handleRetry}
          onRecheck={handleRecheck}
        />
      )}
    </>
  );
};

export default AppUpdateGate;
