---
name: Standalone Expo export
description: Why the app is handed to Expo as a generated npm project and what keeps that export buildable.
---

The owner takes the app to Expo by themselves, so the deliverable is the generated standalone npm project, not the monorepo.

**Why:** Monorepo uploads need workspace files, catalog refs and pnpm; the owner wanted "the file to take to Expo". Exporting with exact installed versions + package-lock made `npm ci`, expo-doctor 21/21, `expo install --check` and Android prebuild pass in a clean folder.

**How to apply:** Re-run the export after every change and re-verify in /tmp. If `expo install --check` flags patch drift in the export, bump those packages in the monorepo (not in the export) and re-export. Keep the app free of `workspace:*`/catalog deps and of scaffold providers that pull monorepo packages.
