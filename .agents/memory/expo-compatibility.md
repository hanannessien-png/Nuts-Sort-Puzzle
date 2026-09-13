---
name: New Expo compatibility
description: React Native style API changes and native ad import isolation for the web preview.
---

Use `StyleSheet.absoluteFill`, not `StyleSheet.absoluteFillObject`, in this project's Expo app.

**Why:** The supplied React Native 0.86 typings no longer export `absoluteFillObject`; older otherwise-valid UI snippets failed the first typecheck because of this version difference.

**How to apply:** When adding or adapting mobile components, use the supported constant rather than adding a compatibility shim or downgrading React Native. Reassess against the installed typings after future SDK upgrades.

Separate the native ad implementation from the web module graph, not just its runtime execution.

**Why:** Metro followed a guarded lazy `require` of the mobile ads SDK while building web. It pulled in the native Fabric renderer and failed on an unrelated-looking React DevTools internal path. A runtime platform/Expo Go check alone did not protect the browser bundle.

**How to apply:** Preserve a web-specific adapter with no native SDK imports. If a future web build reports missing React Native internals, inspect the import chain for a native dependency before changing SDK versions or editing vendor files.