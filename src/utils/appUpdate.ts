/**
 * Pure helpers for the in-app App Update feature.
 * No React Native imports here so these can be unit-tested in isolation.
 */

export interface AppReleaseAsset {
  name: string;
  url: string;
  size: number;
  contentType: string;
}

export interface AppRelease {
  tag: string;
  version: string;
  notes: string;
  publishedAt: string;
  apk: AppReleaseAsset | null;
}

interface GitHubAssetJson {
  name?: unknown;
  browser_download_url?: unknown;
  size?: unknown;
  content_type?: unknown;
}

interface GitHubReleaseJson {
  tag_name?: unknown;
  body?: unknown;
  published_at?: unknown;
  assets?: unknown;
}

const isString = (value: unknown): value is string => typeof value === 'string';

export function normalizeTagName(tag: string): string {
  return tag.trim().replace(/^v/i, '');
}

export function parseVersionParts(value: string): number[] {
  const matches = value.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

/** True when `remote` is a higher version than `current`. */
export function isNewerVersion(remote: string, current: string): boolean {
  const remoteParts = parseVersionParts(normalizeTagName(remote));
  const currentParts = parseVersionParts(normalizeTagName(current));
  const length = Math.max(remoteParts.length, currentParts.length);

  for (let index = 0; index < length; index++) {
    const remotePart = remoteParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;
    if (remotePart !== currentPart) {
      return remotePart > currentPart;
    }
  }
  return false;
}

/**
 * The GitHub tag can drift from the version embedded in the uploaded APK.
 * Prefer the APK's real version so the app never prompts repeatedly for an
 * update that is already installed.
 */
export function resolveUpdateVersion(
  tagVersion: string,
  apkVersion: string | null,
): string {
  if (
    apkVersion &&
    apkVersion.trim() !== '' &&
    parseVersionParts(apkVersion).length > 0
  ) {
    return normalizeTagName(apkVersion);
  }
  return normalizeTagName(tagVersion);
}

/**
 * Converts a GitHub "latest release" response into the shape used by the app.
 * Prefers a debug APK asset when one exists, otherwise uses the first APK asset.
 * Returns null when the response is not a usable release.
 */
export function parseReleaseResponse(json: unknown): AppRelease | null {
  if (!json || typeof json !== 'object') return null;

  const release = json as GitHubReleaseJson;
  if (!isString(release.tag_name) || release.tag_name.trim() === '') {
    return null;
  }

  const rawAssets = Array.isArray(release.assets) ? release.assets : [];
  const apkAssets: AppReleaseAsset[] = [];

  for (const raw of rawAssets) {
    if (!raw || typeof raw !== 'object') continue;
    const asset = raw as GitHubAssetJson;
    if (
      !isString(asset.name) ||
      !asset.name.toLowerCase().endsWith('.apk') ||
      !isString(asset.browser_download_url) ||
      asset.browser_download_url.trim() === ''
    ) {
      continue;
    }
    apkAssets.push({
      name: asset.name,
      url: asset.browser_download_url,
      size: typeof asset.size === 'number' ? asset.size : 0,
      contentType: isString(asset.content_type)
        ? asset.content_type
        : 'application/vnd.android.package-archive',
    });
  }

  const apk =
    apkAssets.find(asset => /debug/i.test(asset.name)) ?? apkAssets[0] ?? null;

  return {
    tag: release.tag_name,
    version: normalizeTagName(release.tag_name),
    notes: isString(release.body) ? release.body : '',
    publishedAt: isString(release.published_at) ? release.published_at : '',
    apk,
  };
}
