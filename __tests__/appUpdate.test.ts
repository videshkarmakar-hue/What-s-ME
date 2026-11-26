import {
  isNewerVersion,
  normalizeTagName,
  parseReleaseResponse,
  parseVersionParts,
} from '../src/utils/appUpdate';

describe('App Update version helpers', () => {
  it('normalizes v-prefixed tags', () => {
    expect(normalizeTagName('v1.2.3')).toBe('1.2.3');
    expect(normalizeTagName('  V2.0  ')).toBe('2.0');
  });

  it('parses numeric version parts', () => {
    expect(parseVersionParts('1.0.0.0')).toEqual([1, 0, 0, 0]);
    expect(parseVersionParts('v2.4.1')).toEqual([2, 4, 1]);
    expect(parseVersionParts('release')).toEqual([]);
  });

  it('detects newer releases', () => {
    expect(isNewerVersion('v1.0.1', '1.0.0.0')).toBe(true);
    expect(isNewerVersion('1.0.2.0', '1.0.0.0')).toBe(true);
    expect(isNewerVersion('2.0.0', '1.0.0.0')).toBe(true);
    expect(isNewerVersion('v1.0.0', '1.0.0.0')).toBe(false);
    expect(isNewerVersion('0.9.9', '1.0.0.0')).toBe(false);
  });
});

describe('GitHub release parsing', () => {
  const asset = {
    name: 'app-debug.apk',
    browser_download_url: 'https://github.com/example/release/download/app-debug.apk',
    size: 12345,
    content_type: 'application/vnd.android.package-archive',
  };

  it('extracts an APK asset and release notes', () => {
    const release = parseReleaseResponse({
      tag_name: 'v1.0.1',
      body: 'Bug fixes',
      published_at: '2026-11-26T00:00:00Z',
      assets: [asset],
    });

    expect(release).not.toBeNull();
    expect(release?.version).toBe('1.0.1');
    expect(release?.notes).toBe('Bug fixes');
    expect(release?.apk?.name).toBe('app-debug.apk');
    expect(release?.apk?.url).toBe(asset.browser_download_url);
  });

  it('prefers a debug APK over other APK assets', () => {
    const release = parseReleaseResponse({
      tag_name: 'v1.0.2',
      assets: [
        { ...asset, name: 'app-release.apk' },
        { ...asset, name: 'app-debug.apk' },
      ],
    });
    expect(release?.apk?.name).toBe('app-debug.apk');
  });

  it('reports no direct APK when a release has no APK asset', () => {
    const release = parseReleaseResponse({
      tag_name: 'v1.0.3',
      body: 'Source only release',
      assets: [{ name: 'source.zip', browser_download_url: 'https://example.com/source.zip' }],
    });
    expect(release?.apk).toBeNull();
  });

  it('ignores malformed responses', () => {
    expect(parseReleaseResponse(null)).toBeNull();
    expect(parseReleaseResponse({})).toBeNull();
    expect(parseReleaseResponse({ tag_name: '' })).toBeNull();
  });
});
