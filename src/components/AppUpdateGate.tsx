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
  downloadReleaseApk,
  fetchLatestRelease,
  getCurrentAppVersion,
  installApk,
} from '../services/appUpdate';
import { AppRelease, isNewerVersion } from '../utils/appUpdate';

const RECHECK_THROTTLE_MS = 60_000;

function describeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong while downloading the update.';
}

/**
 * Checks GitHub Releases on launch and whenever the app returns to the
 * foreground. When a newer release exists it renders a mandatory App Update
 * screen that cannot be dismissed or skipped.
 */
const AppUpdateGate: React.FC<PropsWithChildren> = ({ children }) => {
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [phase, setPhase] = useState<AppUpdatePhase>('downloading');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const lastCheckRef = useRef(0);
  const downloadedPathRef = useRef<string | null>(null);
  const activeReleaseRef = useRef<AppRelease | null>(null);

  const startDownload = useCallback(async (target: AppRelease) => {
    activeReleaseRef.current = target;

    if (!target.apk) {
      setError(null);
      setPhase('no-apk');
      return;
    }

    setError(null);
    setProgress(0);
    setPhase('downloading');

    try {
      const path = await downloadReleaseApk(target.apk, setProgress);
      downloadedPathRef.current = path;
      setProgress(100);
      setPhase('ready');
    } catch (downloadError) {
      setError(describeError(downloadError));
      setPhase('error');
    }
  }, []);

  const checkForUpdate = useCallback(
    async (force: boolean = false) => {
      // Never interrupt an active install or a completed/pending download.
      if (release && !force && phase !== 'error' && phase !== 'no-apk') {
        return;
      }

      const now = Date.now();
      if (!force && now - lastCheckRef.current < RECHECK_THROTTLE_MS) {
        return;
      }
      lastCheckRef.current = now;

      try {
        const [currentVersion, latest] = await Promise.all([
          getCurrentAppVersion(),
          fetchLatestRelease(),
        ]);

        if (!latest) return;
        if (!isNewerVersion(latest.version, currentVersion)) return;

        setRelease(latest);
        await startDownload(latest);
      } catch {
        // A failed check must never break or block the app.
      }
    },
    [phase, release, startDownload],
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
      await startDownload(target);
      return;
    }

    setPhase('installing');
    setError(null);

    try {
      await installApk(downloadedPathRef.current);
      // The system installer takes over; if the user backs out, allow retrying.
      setTimeout(() => {
        setPhase(current => (current === 'installing' ? 'ready' : current));
      }, 5000);
    } catch (installError) {
      setError(describeError(installError));
      setPhase('error');
    }
  }, [release, startDownload]);

  const handleRetry = useCallback(() => {
    const target = activeReleaseRef.current ?? release;
    if (target) void startDownload(target);
  }, [release, startDownload]);

  const handleRecheck = useCallback(() => {
    void checkRef.current(true);
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
