#!/usr/bin/env node
/** Keeps every version-bearing file in sync. Usage: node scripts/bump-version.mjs 1.0.3 */
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
  if (before === after) console.warn(`  ! no match in ${file}`);
  write(file, after);
};

console.log(`Bumping version to ${version} (versionCode ${versionCode})`);

replace('android/app/build.gradle', /versionCode\s+\d+/, `versionCode ${versionCode}`);
replace('android/app/build.gradle', /versionName\s+"[^"]+"/, `versionName "${version}"`);

const pkg = JSON.parse(read('package.json'));
pkg.version = version;
write('package.json', `${JSON.stringify(pkg, null, 2)}\n`);

const lock = JSON.parse(read('package-lock.json'));
lock.version = version;
if (lock.packages?.['']) lock.packages[''].version = version;
write('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);

replace(
  'src/context/LanguageContext.tsx',
  /('settings\.versionLabel':\s*')([^']+)(')/g,
  (_match, prefix, value, suffix) => {
    const label = value.trim().split(/\s+/)[0] || 'Version';
    return `${prefix}${label} ${version}${suffix}`;
  },
);

replace(
  'src/services/appUpdate.ts',
  /const FALLBACK_VERSION = '[^']+';/,
  `const FALLBACK_VERSION = '${version}';`,
);

const fdroid = 'fdroid/com.videshkarmakar.whatsapp.yml';
replace(fdroid, /versionName:\s+\S+/, `versionName: ${version}`);
replace(fdroid, /versionCode:\s+\d+/, `versionCode: ${versionCode}`);
replace(fdroid, /CurrentVersion:\s+\S+/, `CurrentVersion: ${version}`);
replace(fdroid, /CurrentVersionCode:\s+\d+/, `CurrentVersionCode: ${versionCode}`);

console.log('Version files updated.');
