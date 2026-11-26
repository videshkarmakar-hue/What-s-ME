#!/usr/bin/env node
/**
 * Updates every version-bearing file to a new 3-part version.
 * Used by .github/workflows/release-apk.yml before the clean debug build.
 *
 * Usage: node scripts/bump-version.mjs 1.0.1
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  console.error('Usage: node scripts/bump-version.mjs <major.minor.patch>');
  process.exit(1);
}

const [major, minor, patch] = version.split('.').map(Number);
const versionCode = major * 10000 + minor * 100 + patch;

const read = file => readFileSync(resolve(file), 'utf8');
const write = (file, text) => writeFileSync(resolve(file), text, 'utf8');
const replace = (file, pattern, value) => {
  const before = read(file);
  const after = before.replace(pattern, value);
  if (before === after) {
    console.warn(`  ! no match in ${file} for ${pattern}`);
  }
  write(file, after);
};

console.log(`Bumping version to ${version} (versionCode ${versionCode})`);

// Android app version.
replace(
  'android/app/build.gradle',
  /versionCode\s+\d+/,
  `versionCode ${versionCode}`,
);
replace(
  'android/app/build.gradle',
  /versionName\s+"[^"]+"/,
  `versionName "${version}"`,
);

// npm package version.
const pkg = JSON.parse(read('package.json'));
pkg.version = version;
write('package.json', `${JSON.stringify(pkg, null, 2)}\n`);

const lock = JSON.parse(read('package-lock.json'));
lock.version = version;
if (lock.packages?.['']) lock.packages[''].version = version;
write('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);

// In-app version labels (all supported languages).
replace(
  'src/context/LanguageContext.tsx',
  /('settings\.versionLabel':\s*')([^']+)(')/g,
  (_match, prefix, value, suffix) => {
    const label = value.trim().split(/\s+/)[0] || 'Version';
    return `${prefix}${label} ${version}${suffix}`;
  },
);

// About screen hero version.
replace(
  'src/screens/AboutScreen.tsx',
  /Version\s+\d+\.\d+\.\d+(?:\.\d+)?/g,
  `Version ${version}`,
);

// In-app updater fallback version (native package manager is the primary source).
replace(
  'src/services/appUpdate.ts',
  /const FALLBACK_VERSION = '[^']+';/,
  `const FALLBACK_VERSION = '${version}';`,
);

// F-Droid recipe version fields.
const fdroid = 'fdroid/com.videshkarmakar.whatsapp.yml';
replace(fdroid, /versionName:\s+\S+/, `versionName: ${version}`);
replace(fdroid, /versionCode:\s+\d+/, `versionCode: ${versionCode}`);
replace(fdroid, /CurrentVersion:\s+\S+/, `CurrentVersion: ${version}`);
replace(fdroid, /CurrentVersionCode:\s+\d+/, `CurrentVersionCode: ${versionCode}`);

console.log('Version files updated.');
