import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const production = process.argv.includes('--production') || process.env.EAS_BUILD_PROFILE === 'production';
if (process.argv.includes('--if-production') && !production) process.exit(0);
const app = JSON.parse(readFileSync(resolve(root, 'app.json'), 'utf8')).expo;
const eas = JSON.parse(readFileSync(resolve(root, 'eas.json'), 'utf8'));
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(resolve(root, 'constants/ads.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports, __DEV__: false });
const plugin = app.plugins.find(p => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads')?.[1];
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const validId = (id, delimiter) => new RegExp(`^ca-app-pub-\\d{16}${delimiter}\\d{10}$`).test(id ?? '');
check(app.android.package === 'com.nutssort.puzzle', 'Keep the existing Android application ID com.nutssort.puzzle.');
check(Number.isSafeInteger(app.android.versionCode) && app.android.versionCode > 0, 'Android versionCode must be a positive integer.');
check(eas.cli?.appVersionSource === 'remote', 'eas.json must use appVersionSource "remote" so GitHub builds keep increasing versionCode.');
for (const name of ['preview', 'production']) check(Boolean(eas.build[name]?.android?.image), `eas.json ${name} profile needs android.image (required for Expo's "Build from GitHub").`);
check(eas.build.production.android.buildType === 'app-bundle', 'Production must generate an Android App Bundle.');
check(eas.build.production.env?.EXPO_PUBLIC_ADMOB_TEST_ADS === undefined, 'The production profile must not force Google test ads.');
check(eas.build.preview?.env?.EXPO_PUBLIC_ADMOB_TEST_ADS === '1', 'The preview APK must force Google test ads so the owner never clicks live ads.');
check(validId(plugin?.androidAppId, '~'), 'A valid Android AdMob app ID (~ delimiter) is required in app.json.');
for (const format of ['banner', 'interstitial', 'rewarded', 'appOpen']) {
  const id = exports.getAdUnitId(format, 'android');
  check(validId(id, '/'), `Android ${format} ad unit ID has an invalid format.`);
  if (production) check(!id.startsWith('ca-app-pub-3940256099942544/'), `Android ${format} still uses a Google test unit. Wait for the owner-supplied production ID.`);
}
if (production) {
  check(!plugin?.androidAppId?.startsWith('ca-app-pub-3940256099942544~'), 'Android AdMob app ID is still Google test inventory.');
  check(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(app.extra?.eas?.projectId ?? ''), 'Link to the owner-controlled Expo project before a release build; extra.eas.projectId is missing.');
  check(!String(app.owner ?? '').startsWith('replit-private-'), 'Do not assign release ownership to a temporary Replit preview identity.');
}
if (errors.length) {
  console.error(`Android ${production ? 'production' : 'configuration'} preflight blocked:\n${errors.map(e => `- ${e}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Android ${production ? 'production' : 'test-inventory configuration'} preflight passed. Native signed-build/device verification is still required.`);
}