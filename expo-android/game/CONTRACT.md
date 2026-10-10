# Nuts Sort integration contract

Main agent owns GameProvider.tsx, economy.ts, persistence.ts and catalogue.ts.
Engine worker owns engine.ts. Design worker owns app routes, components and visual tokens only.
Ads worker owns services/ads.ts(x), components/AdBanner.tsx and constants/ads.ts only.
Do not change types.ts without coordinating.

## UI
Import GameProvider and useGame from @/game/GameProvider. Interface is GameContextValue in types.ts.
Methods returning ActionResult report ok and optional message; display failures clearly and await them.
startLevel(id) loads a stored level or creates/persists a verified new one, and resumes a live attempt of the same level. After ok, navigate to /play.
setPlaying(true) only while /play is focused; false on blur/unmount. Pause/sheets may set false and resume.
tapColumn handles selecting source then transferring precisely one top nut; no color-matching restriction.
Use active.board (bottom-to-top) and active.capacity, not level.board. Use active.hint to mark source/destination.
resetLevel returns board/move count to original, preserves remaining and elapsed time. No cost.
At timeout offer continueByAd (+60 sec) or abandonTimeout (lose exactly one life).
One life is used only on confirmed timeout loss; winners and resets cost none.
usePowerUp hint costs 50, undo 50, extraBolt 100, or optional rewarded ad instead.
Power-up coin deductions occur only after a valid effect is ready; unlimited repeated uses if paid.
Victory contains stars, moves, seconds, optimalMoves, reward (=increment awarded this run), totalReward (=full best-based score), doubled.
doubleReward awards exactly the incremental reward a second time, once, only after completed rewarded ad.
Replays pay positive difference over previous best only; no improvement = 0 and no doubling.
Levels are unlocked sequentially. Previous saved boards never regenerated.
Daily coins automatically collected on first opening each device day: 10 normally, 50 each 7th consecutive day, 100 each 30th (replaces daily amount). Missed day resets both counters via streak.
Daily and lives reset clock guards can freeze automatic grants when a clock anomaly is detected; normal gameplay remains available.
Purchases: buyItem(id, coins|ad), then equipItem. Theme bundles unlock their included items, 15% off remaining items, minimum 50; do not double-charge owned items.
state.equipped IDs describe current cosmetics. Use catalogue appearance (default, midnight, ocean, blossom, candy, pearl, brass, walnut, etc.) to render; cosmetics NEVER change rules.
No real money, accounts, notifications, or server. English gameplay UI for this initial version. Use icons, not emojis.
AdBanner from @/components/AdBanner sits on all screens, outside tappable board/tab controls. It shows a clearly labeled unavailable state when native ad SDK cannot run. No fake video countdown or fake earned reward.

## Engine exports
generateLevel(id: number): Promise<Level> — unseeded randomness, exact solver verified before returning, bounded computation with event loop yields.
solveBoard(board: Board, capacity: number, options?: { maxNodes?: number; maxMs?: number }): Promise<SolveResult>
isSolved(board: Board): boolean — at least one nut, every nonempty column pure, no color split between multiple columns.
applyMove(board: Board, capacity: number, move: Move): Board | null — top-only, one nut, any target color, reject full/self/invalid/empty.

## Ad adapter exports
adAvailability(): { available: boolean; message: string }
showRewardedAd(): Promise<{ earned: boolean; message?: string }>
showInterstitialAd(): Promise<void>
showAppOpenAd(): Promise<void>
initializeAds(): Promise<void>
isAdShowing(): boolean
AdBanner component is self-contained; no GameProvider dependency.
Real native SDK completion event is mandatory for earned=true. Web/Expo Go/offline/closed early returns false. Use official Google test IDs in config; production IDs deliberately unconfigured. Native development build required; don't break Expo Go.