#!/usr/bin/env node
/**
 * Builds a self-contained copy of this app that can be uploaded to Expo
 * (EAS Build) on its own, without the rest of the Replit monorepo.
 *
 *   node scripts/export-standalone.mjs
 *
 * Output:
 *   <repo>/expo-android/        ready-to-build project, COMMITTED to GitHub.
 *                               Expo's GitHub build must use this folder as
 *                               its "Base directory" (eas.json lives here).
 *   <repo>/generated-artifacts/nuts-sort-android.zip   same files, zipped with
 *                               eas.json at the top level (git-ignored).
 *
 * expo-android/ is outside the pnpm workspace globs, so Expo/EAS treat it as
 * a plain npm project (package-lock.json) rather than a monorepo member.
 *
 * What changes compared to the in-repo copy:
 *  - package.json: every dependency is pinned to the exact version installed
 *    here (the versions that were tested), the Replit-only dev/build/serve
 *    scripts and the Replit preview helper are removed, standard Expo scripts
 *    are added.
 *  - A package-lock.json is generated so `npm ci` reproduces the same tree.
 *  - Replit-only folders (server/, .replit-artifact/, scripts/build.js) are
 *    left out. Game code, assets, app.json and eas.json are copied unchanged.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(appDir, '../..');
const outRoot = path.join(repoRoot, 'generated-artifacts');
const outDir = path.join(repoRoot, 'expo-android');
const zipPath = path.join(outRoot, 'nuts-sort-android.zip');

const EXCLUDE = new Set([
  'node_modules', '.expo', 'dist', 'static-build', 'web-build', 'android', 'ios',
  'server', '.replit-artifact', 'expo-env.d.ts',
]);
const EXCLUDE_FILES = new Set(['expo-project.json', path.join('scripts', 'build.js'), path.join('scripts', 'export-standalone.mjs')]);
const REPLIT_ONLY_DEPS = new Set(['create-launch']);

rmSync(outDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });
mkdirSync(outDir, { recursive: true });
mkdirSync(outRoot, { recursive: true });
rmSync(path.join(outRoot, 'nuts-sort-android'), { recursive: true, force: true });

cpSync(appDir, outDir, {
  recursive: true,
  filter: (source) => {
    const rel = path.relative(appDir, source);
    if (!rel) return true;
    if (EXCLUDE_FILES.has(rel)) return false;
    return !rel.split(path.sep).some((part) => EXCLUDE.has(part));
  },
});

// Pin every dependency to the version actually installed and tested here.
const requireFromApp = createRequire(path.join(appDir, 'package.json'));
const installedVersion = (name) => {
  const candidates = [path.join(appDir, 'node_modules', name, 'package.json')];
  for (const file of candidates) {
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')).version;
  }
  return JSON.parse(readFileSync(requireFromApp.resolve(`${name}/package.json`), 'utf8')).version;
};
const source = JSON.parse(readFileSync(path.join(appDir, 'package.json'), 'utf8'));
const pin = (deps = {}) => Object.fromEntries(Object.keys(deps)
  .filter((name) => !REPLIT_ONLY_DEPS.has(name))
  .sort()
  .map((name) => [name, installedVersion(name)]));

const pkg = {
  name: 'nuts-sort',
  version: source.version === '0.0.0' ? '1.0.0' : source.version,
  private: true,
  main: source.main,
  scripts: {
    start: 'expo start',
    android: 'expo start --android',
    typecheck: source.scripts.typecheck,
    'validate:ads': source.scripts['validate:ads'],
    'validate:release': source.scripts['validate:release'],
    'eas-build-post-install': source.scripts['eas-build-post-install'],
  },
  dependencies: pin({ ...source.dependencies, ...source.devDependencies }),
};
writeFileSync(path.join(outDir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);

// Link the build copy to the owner's Expo project (kept out of the in-repo
// app.json so Replit's managed Expo Go preview keeps working).
const project = JSON.parse(readFileSync(path.join(appDir, 'expo-project.json'), 'utf8'));
const appFile = path.join(outDir, 'app.json');
const appJson = JSON.parse(readFileSync(appFile, 'utf8'));
if (appJson.expo.slug !== project.slug) throw new Error(`app.json slug "${appJson.expo.slug}" must equal the Expo project slug "${project.slug}".`);
appJson.expo.owner = project.owner;
appJson.expo.extra = { ...appJson.expo.extra, eas: { ...appJson.expo.extra?.eas, projectId: project.projectId } };
writeFileSync(appFile, `${JSON.stringify(appJson, null, 2)}\n`);

// The monorepo pins pnpm for EAS; the standalone copy uses npm + package-lock.
const easFile = path.join(outDir, 'eas.json');
const eas = JSON.parse(readFileSync(easFile, 'utf8'));
for (const profile of Object.values(eas.build ?? {})) delete profile.pnpm;
writeFileSync(easFile, `${JSON.stringify(eas, null, 2)}\n`);

// Expo SDK packages occasionally declare peer ranges npm treats as conflicts.
writeFileSync(path.join(outDir, '.npmrc'), 'legacy-peer-deps=true\n');

execFileSync('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], {
  cwd: outDir, stdio: 'inherit',
});

// Zip the folder's CONTENTS so eas.json/app.json/package.json sit at the top.
execFileSync('zip', ['-qr', zipPath, '.'], { cwd: outDir, stdio: 'inherit' });
console.log(`Standalone Android project: ${path.relative(repoRoot, outDir)}`);
console.log(`Zip: ${path.relative(repoRoot, zipPath)}`);
