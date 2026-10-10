---
name: Standalone Expo export
description: Why the app is handed to Expo as a generated npm project and what keeps that export buildable.
---

The owner takes the app to Expo by themselves, so the deliverable is the generated standalone npm project, not the monorepo.

**Why:** Monorepo uploads need workspace files, catalog refs and pnpm; the owner wanted "the file to take to Expo". Exporting with exact installed versions + package-lock made `npm ci`, expo-doctor 21/21, `expo install --check` and Android prebuild pass in a clean folder.

The owner uses expo.dev "Build from GitHub" on the whole monorepo repo, so the export is committed at repo-root `expo-android/` (outside pnpm workspace globs → treated as plain npm) and Expo's Base directory points there. GitHub builds also need `android.image` per profile and `appVersionSource: remote` (local autoIncrement is never committed back).

**How to apply:** Re-run the export after every change and re-verify in /tmp. If `expo install --check` flags patch drift in the export, bump those packages in the monorepo (not in the export) and re-export. Keep the app free of `workspace:*`/catalog deps and of scaffold providers that pull monorepo packages.
