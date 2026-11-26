import { NativeModules, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import {
  AppRelease,
  AppReleaseAsset,
  parseReleaseResponse,
} from '../utils/appUpdate';

const RELEASES_API =
  'https://api.github.com/repos/videshkarmakar-hue/What-s-ME/releases';
const FALLBACK_VERSION = '1.0.1';

const native: {
  getVersionName?: () => Promise<string | null>;
  installApk?: (path: string) => Promise<boolean>;
} | undefined = NativeModules.AppUpdateModule;

export const APP_UPDATE_API_URL = RELEASES_API;

/** Fetches the latest published GitHub release. Never throws for a missing APK. */
export async function fetchLatestRelease(): Promise<AppRelease | null> {
  const response = await fetch(RELEASES_API, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'WhatsME-AppUpdate',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub release check failed (${response.status})`);
  }

  const data: unknown = await response.json();
  const releases = Array.isArray(data) ? data : [];

  // The list endpoint also includes pre-releases, which is where debug APKs
  // are commonly published. Drafts are skipped because their assets are not
  // downloadable yet.
  const newestPublished = releases.find(item => {
    if (!item || typeof item !== 'object') return false;
    const release = item as { draft?: unknown };
    return release.draft !== true;
  });

  return parseReleaseResponse(newestPublished ?? null);
}

/** Reads the app's real version from the native package manager. */
export async function getCurrentAppVersion(): Promise<string> {
  try {
    const version = await native?.getVersionName?.();
    if (version && version.trim()) return version.trim();
  } catch {
    // Fall through to the known version below.
  }
  return FALLBACK_VERSION;
}

/** Downloads the release APK into the app's private files directory. */
export async function downloadReleaseApk(
  asset: AppReleaseAsset,
  onProgress: (percent: number) => void,
): Promise<string> {
  if (Platform.OS !== 'android') {
    throw new Error('Direct APK updates are only supported on Android');
  }

  const fileName = `whatsme-update-${Date.now()}.apk`;
  const targetPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

  // Remove any stale partial download from an earlier attempt.
  try {
    if (await RNFS.exists(targetPath)) {
      await RNFS.unlink(targetPath);
    }
  } catch {
    // Ignore cleanup failures; the download will overwrite where possible.
  }

  const result = await RNFS.downloadFile({
    fromUrl: asset.url,
    toFile: targetPath,
    headers: {
      'User-Agent': 'WhatsME-AppUpdate',
      Accept: 'application/octet-stream',
    },
    progressDivider: 1,
    progress: ({ bytesWritten, contentLength }) => {
      if (contentLength > 0) {
        const percent = Math.min(
          100,
          Math.max(0, Math.round((bytesWritten / contentLength) * 100)),
        );
        onProgress(percent);
      }
    },
  }).promise;

  if (result.statusCode < 200 || result.statusCode >= 300) {
    throw new Error(`APK download failed (${result.statusCode})`);
  }

  const exists = await RNFS.exists(targetPath);
  if (!exists) {
    throw new Error('Downloaded APK could not be found');
  }

  return targetPath;
}

/** Launches the Android package installer for a downloaded APK. */
export async function installApk(path: string): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('Direct APK updates are only supported on Android');
  }
  if (!native?.installApk) {
    throw new Error('App Update installer is not available on this device');
  }
  await native.installApk(path);
}

export async function deleteDownloadedApk(path: string | null): Promise<void> {
  if (!path) return;
  try {
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
    }
  } catch {
    // Best-effort cleanup only.
  }
}
