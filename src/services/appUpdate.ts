import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import {
  AppRelease,
  AppReleaseAsset,
  parseReleaseResponse,
} from '../utils/appUpdate';

const RELEASES_API =
  'https://api.github.com/repos/videshkarmakar-hue/What-s-ME/releases';
const FALLBACK_VERSION = '1.0.4';
const LAST_UPDATE_CODE_KEY = '@whatsme_last_update_code';

const native: {
  getVersionName?: () => Promise<string | null>;
  getVersionCode?: () => Promise<string | null>;
  getApkVersionName?: (path: string) => Promise<string | null>;
  getApkVersionCode?: (path: string) => Promise<string | null>;
  installApk?: (path: string) => Promise<boolean>;
} | undefined = NativeModules.AppUpdateModule;

export const APP_UPDATE_API_URL = RELEASES_API;

/** Fetches the newest published GitHub release. Never throws for a missing APK. */
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

  // The list endpoint includes pre-releases (where debug APKs are often
  // published). Drafts are skipped because their assets are not downloadable.
  const newestPublished = releases.find(item => {
    if (!item || typeof item !== 'object') return false;
    const release = item as { draft?: unknown };
    return release.draft !== true;
  });

  return parseReleaseResponse(newestPublished ?? null);
}

/** Reads the real installed version from the native package manager. */
export async function getCurrentAppVersion(): Promise<string> {
  try {
    const version = await native?.getVersionName?.();
    if (version && version.trim()) return version.trim();
  } catch {
    // Fall through to the known version below.
  }
  return FALLBACK_VERSION;
}

/** Reads the installed app's versionCode (monotonic integer). */
export async function getCurrentAppVersionCode(): Promise<number | null> {
  try {
    const value = await native?.getVersionCode?.();
    const code = Number(value);
    return Number.isFinite(code) ? code : null;
  } catch {
    return null;
  }
}

/** Reads the versionCode embedded in a downloaded APK file. */
export async function getApkVersionCode(path: string): Promise<number | null> {
  try {
    const value = await native?.getApkVersionCode?.(path);
    const code = Number(value);
    return Number.isFinite(code) ? code : null;
  } catch {
    return null;
  }
}

/** Reads the versionName embedded in a downloaded APK file. */
export async function getApkVersion(path: string): Promise<string | null> {
  try {
    const version = await native?.getApkVersionName?.(path);
    return version && version.trim() ? version.trim() : null;
  } catch {
    return null;
  }
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

  try {
    if (await RNFS.exists(targetPath)) {
      await RNFS.unlink(targetPath);
    }
  } catch {
    // Best-effort cleanup of any stale partial download.
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

  if (!(await RNFS.exists(targetPath))) {
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

/** Remembers the code of the APK we last handed to the installer. */
export async function markUpdateInstalled(code: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_UPDATE_CODE_KEY, String(code));
  } catch {
    // Marker is a safety net; failure must not break the update flow.
  }
}

export async function getLastUpdateCode(): Promise<number | null> {
  try {
    const value = await AsyncStorage.getItem(LAST_UPDATE_CODE_KEY);
    const code = Number(value);
    return Number.isFinite(code) && value !== null ? code : null;
  } catch {
    return null;
  }
}
