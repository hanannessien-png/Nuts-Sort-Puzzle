# Nuts Sort Puzzle

Offline-first mobile color-sorting game with single-nut moves, solver-verified levels, local progress, cosmetic collections and optional rewarded advertising.

## Run & Operate

- Managed mobile workflow: `artifacts/nuts-sort: expo`.
- `pnpm --filter @workspace/nuts-sort run typecheck`.
- No game backend, database, account or secret is required. The scaffold API is unused.
- The native ads adapter deliberately uses Google test IDs. Real monetization requires the owner's production IDs and a native build; Expo Go/web must report ads unavailable, never simulate rewards.

## Stack

Expo + React Native + TypeScript, Expo Router, React context, AsyncStorage, Zod, SVG game rendering, Expo Audio/Haptics, guarded Google Mobile Ads SDK.

## Where things live

- `artifacts/nuts-sort/game/` — rules, shortest-path solver, generator, economy, catalogue, persisted state and UI contract.
- `artifacts/nuts-sort/app/` and `components/` — screens and interactive board.
- `artifacts/nuts-sort/services/ads.ts` and `constants/ads.ts` — native ad lifecycle and test configuration.
- `artifacts/nuts-sort/scripts/make-sounds.py` — original bundled offline sound effects.

## Architecture decisions

- Store actual generated boards and their solver certificates, not seeds. Never regenerate an old board. Why: the user explicitly rejected fixed per-level seeds and requires exact replay.
- Persist currency, prizes, records and cosmetics in one serialized save. A corrupt or failed save is surfaced, not silently reset. Why: preserving earned coins matters more than hiding a storage failure.
- Park unfinished attempts when switching levels; preserve remaining time on reset/background/relaunch. Why: navigation must not become a free alternative to rewarded time extensions.
- Offline clock protection is best-effort: persist a wall-clock high-water mark and detect in-session jumps against a monotonic clock. Absolute protection against time changes across app restarts, save editing or reinstall is impossible without trusted external time/server state; don't claim otherwise.
- Native rewarded completion is the only path to ad benefits. The web/Expo Go unavailable branch must never grant coins, time, lives or inventory.

## Agreed rules — later clarifications override the initial message

- Level 1: 3 colors, 3 nuts per color (9 total), 3 columns. Capacity 4 leaves legal maneuvering room. Easy initial arrangement.
- Move exactly one TOP nut per move. Any target color is legal; reject only invalid/empty source, same column or full target. Each color must finish together in a unique pure column; added empty columns do not prevent winning.
- Free reset resets nuts and move count, NOT remaining/elapsed time. No coins, ad or life required.
- Five lives; lose exactly one only when time runs out and the player declines ad continuation. Winning/resetting are free. At local midnight restore to five. Rewarded ads add a life or 60 seconds; repeatable, without daily cap.
- First ten levels are guaranteed and verified. Later levels are generated randomly and verified before play, with practical device bounds and increasing challenge. Never serve a board that the solver has not solved.
- Five stars means at/very close to certified optimal move count. Every win earns at least one star. Coins depend on stars, move efficiency and speed, not level number or difficulty; same schedule for Level 1 and Level 1000.
- Replay any unlocked old level. Pay its reward the first time; later pay only a positive improvement over the saved best reward, never the full reward repeatedly.
- Daily entry rewards: 10 normally, 50 every seventh consecutive day, 100 every thirtieth. Special amounts replace that day's 10; monthly takes precedence on overlap. Missing a day resets both streaks. Coins already earned stay saved.
- Light theme is default and free; dark/other themes cost coins. Shop sections: themes, nuts, bolts, bases, bundles. All cosmetic only. Bundles 15% cheaper; exclude owned components from price.
- Paid items/powers cost at least 50 coins, fixed prices. Hint shows one verified next move. Offer spending coins OR voluntarily watching an ad even with sufficient coins. Charge only when applying a valid effect.
- Optional post-win reward ad doubles only the new award of that run, once, after completion. No reward for incomplete/failed/no-fill ads.
- Interstitial after every two finished rounds only at a safe between-level boundary; app-open ad at cold opening; banners on all screens. Never pop an automatic full-screen ad during gameplay/moves.
- Offline gameplay and saving work normally. Ad-dependent actions are unavailable without a functioning ad connection. No real-money IAP, notifications or accounts.
- The phrase about a “first rewarded ad for the user” was a typing error and has NO product meaning.

## Communication

Questions to this user about this game must be in Arabic. Do not re-ask settled requirements. Routine unspecified details should be decided naturally.

## Gotchas

- Keep Expo's static `app.json` and font/splash gating.
- AdMob requires a native development/release build; a web screenshot cannot validate native ad delivery or consent.
- Audio is playback-only; microphone, background playback and recording permissions are disabled.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
