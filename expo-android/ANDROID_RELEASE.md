# Android release handoff

## Current state

The app is named **Screw Sort Master** and its Android application ID is **com.apex.screwsort** (owner-chosen before the first Play upload; never change it after that). Expo stays on SDK 57
and React Native 0.86.3. Configuration is static `app.json`; there are no
committed/generated Android or iOS projects.

**No signed APK or AAB has been generated or uploaded.** The current AdMob app
and ad-unit IDs are Google's test IDs, not monetized inventory. Native ads do
not run in Expo Go or the browser; these environments show an explicit
unavailable state and never award simulated rewards.

`eas.json` prepares:

- `preview`: internally distributed, installable Android APK. It sets
  `EXPO_PUBLIC_ADMOB_TEST_ADS=1`, so it always shows **Google test ads** even
  after real IDs are added. Install it on your own phone safely.
- `production`: store-distributed Android App Bundle (AAB), incrementing
  Android versionCode. The baseline versionCode is 1; match the existing
  Play listing's version history before the first upload.

The production post-install preflight deliberately fails while test Android
IDs or an owner-controlled Expo project link are missing. It is a configuration
guard, not proof of AdMob ownership, ad approval, valid signing, or store acceptance.

## Owner-controlled setup still required

1. Supply the **Android AdMob app ID** (`ca-app-pub-…~…`) and four Android
   **ad-unit IDs** (`ca-app-pub-…/…`): banner, interstitial, rewarded, app-open.
   (Done — the owner IDs are in place.) Update the Google Mobile Ads plugin's `androidAppId` in `app.json`, and
   assign the four Android values in `ADMOB_AD_UNIT_IDS` in `constants/ads.ts`.
   Keep `ADMOB_TEST_AD_UNIT_IDS` unchanged: development builds always use it.
   iOS IDs remain test inventory until an iOS release is separately configured.
   Changing native app IDs/config plugins requires a new native build, not
   just a JavaScript update.
2. Link the app to the user's own Expo project/account and record its genuine
   `extra.eas.projectId` in `app.json`. No ID or owner has been invented.
   Do not use a temporary `replit-private-*` preview identity as release owner.
   The account must have project/build permissions and any necessary build
   credits. No remote build has been requested.
3. Provision/retain the actual Android upload keystore through the owner's
   approved Expo credential workflow. Use the existing upload key for an
   existing Play app; enable/confirm Play App Signing. Never commit keystores,
   credential JSON, service-account files, passwords, or access tokens.
4. Configure AdMob Privacy & messaging (UMP) for relevant regions and confirm
   privacy-policy URL, audience/age treatment, consent messages, ad account
   approval, app verification/app-ads.txt as applicable, and Play's Ads/Data
   safety/content-rating declarations. The app does not guess child-directed
   treatment or under-age-of-consent flags; those require the owner's actual
   target-audience decision. Non-personalized banners still require privacy
   compliance; they are not a consent bypass.
5. Use the owner's authorized Expo Android build environment and review the
   release build, then test through Google Play internal testing before release.
   An AAB is uploaded to Play, not directly installed like an APK.
   Replit's built-in Expo Launch/Publish flow currently targets iOS App Store
   publishing, not Google Play.

## Building on expo.dev from GitHub (the owner's flow)

The GitHub repository is the whole Replit monorepo, so its root has no
`eas.json` (Expo then fails with `Failed to read "/eas.json"`). The buildable
project is the committed folder **`expo-android/`** at the repository root:

1. Regenerate it after any change, then push to GitHub from Replit's Git pane:
   `pnpm --filter @workspace/nuts-sort run export:android`
2. On expo.dev → project → GitHub settings, set **Base directory** to
   `expo-android` (it can also be set per build in the "Build from GitHub"
   dialog).
3. `slug`, `owner` and `extra.eas.projectId` must match the expo.dev project
   (`@hana125/nuts-sort`). They live in `expo-project.json` and are injected
   only into `expo-android/app.json`; the in-repo app.json stays unlinked so
   Replit's managed Expo Go preview keeps working.

`expo-android/` is outside the pnpm workspace globs, so Expo treats it as a
plain npm project (pinned versions + `package-lock.json`). Never edit it by
hand; edit `artifacts/nuts-sort` and re-export. The export also writes
`generated-artifacts/nuts-sort-android.zip` with eas.json at the top level.

eas.json details required for GitHub builds: each Android profile sets
`image: "latest"`, and `appVersionSource` is `remote` so the production
versionCode keeps increasing (a local auto-increment is never committed back
by a GitHub build, so every upload would reuse the same versionCode).

Verified on a full copy of the repository, building from `expo-android/`:
`npm ci`, TypeScript, all validators, `expo install --check`, Expo Doctor
21/21, Android Hermes export and `expo prebuild --platform android` (AdMob
app ID and `com.apex.screwsort` present in the manifest).

The `build` script in the in-repo package.json is the Replit web/Expo Go
packaging path; it does **not** produce an Android AAB.

## Ad placement behavior

- **Cold app-open:** eligible on every cold launch, including first launch
  after consent, only during a short initial loading window. There is no
  completed-round minimum, late home/gameplay surprise, or foreground-resume
  app-open request. A pending
  interstitial suppresses the cold app-open to avoid stacking passive ads.
  Slow initialization or loading skips the placement rather than showing it
  later. Skipping an unsafe/unavailable placement is intentional.
- **Interstitial:** completion cadence is unchanged: every second completed
  round (won or explicitly abandoned timeout). A persisted due flag is
  consumed when starting the next level at a safe completed-round boundary.
  A paused/playing or unresolved timed-out attempt is never interrupted.
  Failed/no-fill requests do not create a backlog. Due consumption is saved
  before new level generation.
- **Rewarded:** voluntary only, for the existing power-ups, continuation,
  life, purchase or reward-doubling choices. Successful native `EARNED_REWARD`
  and close events are required. Early close, offline, no-fill, bridge error,
  unavailable preview or timeout grants nothing and charges nothing.
- **Banners:** existing placements only, real anchored adaptive native ads
  after consent/initialization. Unavailable footer instead of fake creative.
  No-fill retries conservatively after 60 seconds or foreground return.
- **Privacy options:** Settings exposes UMP's form when required. Changing
  choices unmounts banners and re-evaluates whether requests may be made.

SDK imports are guarded for native support. Initialization uses the installed
SDK's default export and `createForAdRequest` factories. Consent makes one
session info update and reads post-form state with `getConsentInfo`.
Initialization/network waits, ad loading and presentations have deadlines.
Loading deadlines differ from the on-screen watchdog, so a video longer than
60 seconds does not lose its reward listener. A presentation watchdog bounds
the calling operation's wait but **does not unlock gameplay or its timer**
while native fullscreen UI might still be visible. Only the native close/error
listeners remain until actual closure evidence arrives; they then clean up and
unlock. Merely backgrounding/foregrounding is not proof that an ad has closed.
A timed-out consent form similarly retains its lock until its native promise
settles. If the native bridge never reports completion, restarting the app is
the safe recovery; the app never silently resumes play underneath a known
fullscreen presentation. Further ads stay disabled after a presentation
timeout until that ad's late native close/error arrives (then they are
available again) or the app restarts. Load-timeout listeners are fully removed, and component
state subscriptions are removed on unmount.

## Native configuration and permission review

The Google Ads config plugin is enabled with real Google test application IDs,
delayed app measurement until SDK initialization, and optimized initialization/
ad loading. SDK initialization follows UMP consent rather than bypassing it.
Expo audio is playback-only with recording/background playback disabled.

Unused scaffold packages (location, image-picker, blur, web-browser, symbols,
glass-effect, keyboard-controller, react-query, workspace API client) were
removed. Android manifest merge removals explicitly block camera, microphone recording, coarse/fine/
background location, legacy storage, media-read and overlay permissions.
Internet/network access, haptics and audio-playback-related permissions remain.
Google Ads may contribute advertising-ID permissions in the final merged
release manifest; inspect that manifest and declare ad-ID usage truthfully.
The prebuild manifest is not a substitute for inspecting the final merged
Gradle release manifest.

## Checks performed and repeatable checks

From `artifacts/nuts-sort`:

```sh
CI=1 pnpm exec expo install --check
pnpm dlx expo-doctor@latest
pnpm run typecheck
pnpm run validate:ads
node scripts/validate-release.mjs
pnpm run validate:release
```

At this handoff: dependency compatibility passes; Expo Doctor passes 21/21;
TypeScript, ad adapter regression tests and test-inventory configuration
preflight pass. **Production preflight intentionally fails** on the four
test ad units, test application ID and missing owner project link.

Android native prebuild (`--platform android --no-install`) and production
Android JavaScript/Hermes export passed in a disposable `/tmp` workspace copy,
with the workspace structure preserved and installed dependencies linked.
Generated manifest checks confirmed the unchanged package configuration,
Google Ads metadata/optimization flags and permission removals. No native
directories in the actual app were created or edited.

This environment has no configured Android SDK or Java toolchain. Therefore
Gradle compilation, native linker/codegen compatibility of Expo SDK 57 /
React Native 0.86.3 / Google Mobile Ads 16.5.0, signing and final merged-release
manifest/AAB verification remain **unverified**. Expo Doctor, prebuild and JS
export cannot prove native binary compatibility.

### Required native-device test matrix

- Fresh install and returning-user cold boot; slow/offline consent and no-fill.
- UMP required/not-required regions, privacy-options reopen/revoke, app restart.
- All four test placements; long rewarded video, earn/close exactly once,
  early close, failed load, background/foreground and repeated fast taps.
- Win/loss cadence, saved queued interstitial, resumed/parked attempt and
  app-open exclusion when an interstitial is queued.
- Timer stays paused through ads/privacy forms; no ad interrupts active play.
- Native banner sizing/retry, rotation policy and different Android screen sizes.
- Signed release/Play internal-test install, cold start, audio, persistence,
  Android back handling, ad ID disclosure and final permission review.

Use Google test units/test devices for testing, never click live ads.

## References

- [Expo Android APK/AAB distinction](https://docs.expo.dev/build-reference/apk/)
- [Google app-open cold-start placement guidance](https://developers.google.com/admob/android/app-open)
- [Google Mobile Ads React Native consent](https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent)
- [Google Mobile Ads React Native API](https://docs.page/invertase/react-native-google-mobile-ads/displaying-ads)