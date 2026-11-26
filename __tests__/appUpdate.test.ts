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
    expect(isNewerVersion('1.0.3', '1.0.2')).toBe(true);
    expect(isNewerVersion('v1.0.2', '1.0.2')).toBe(false);
    expect(isNewerVersion('0.9.9', '1.0.2')).toBe(false);
  });
});

describe('GitHub release parsing', () => {
  const asset = {
    name: 'What-s-ME-v1.0.3-release.apk',
    browser_download_url: 'https://example.com/download/app.apk',
    size: 12345,
    content_type: 'application/vnd.android.package-archive',
  };

  it('extracts version, notes and APK asset', () => {
    const release = parseReleaseResponse({
      tag_name: 'v1.0.3',
      body: 'Bug fixes',
      published_at: '2026-11-26T00:00:00Z',
      assets: [asset],
    });

    expect(release?.version).toBe('1.0.3');
    expect(release?.notes).toBe('Bug fixes');
    expect(release?.apk?.name).toBe(asset.name);
    expect(release?.apk?.url).toBe(asset.browser_download_url);
  });

  it('prefers a debug APK when present', () => {
    const release = parseReleaseResponse({
      tag_name: 'v1.0.3',
      assets: [
        asset,
        { ...asset, name: 'What-s-ME-v1.0.3-debug.apk' },
      ],
    });
    expect(release?.apk?.name).toBe('What-s-ME-v1.0.3-debug.apk');
  });

  it('reports no direct APK when a release has no APK asset', () => {
    const release = parseReleaseResponse({
      tag_name: 'v1.0.4',
      body: 'Source only release',
      assets: [{ name: 'source.zip', browser_download_url: 'https://x/source.zip' }],
    });
    expect(release?.apk).toBeNull();
  });

  it('ignores malformed responses', () => {
    expect(parseReleaseResponse(null)).toBeNull();
    expect(parseReleaseResponse({})).toBeNull();
    expect(parseReleaseResponse({ tag_name: '' })).toBeNull();
  });
});
