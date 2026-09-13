import type { GameState, Level } from './types';

export const localDay = (time: number) => {
  const date = new Date(time);
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
};
export const loginReward = (streak: number) =>
  streak > 0 && streak % 30 === 0 ? 100 : streak > 0 && streak % 7 === 0 ? 50 : 10;

/** Identical schedule for every level, independent of level number or difficulty. */
export function scoreRun(level: Level, moves: number, seconds: number) {
  const optimum = Math.max(1, level.optimalMoves);
  const extra = Math.max(0, moves - optimum);
  const stars = extra <= Math.floor(optimum * 0.05) ? 5
    : extra <= Math.ceil(optimum * 0.25) ? 4
    : extra <= Math.ceil(optimum * 0.6) ? 3
    : extra <= optimum ? 2 : 1;
  const base = [0, 10, 20, 35, 50, 70][stars]!;
  const efficiency = Math.floor(10 * Math.min(1, optimum / Math.max(1, moves)));
  const speed = Math.floor(20 * Math.max(0, 1 - seconds / (optimum * 10)));
  return { stars, reward: base + efficiency + speed };
}

export function initialState(now: number): GameState {
  return {
    version: 1, coins: 0, lives: 5, unlockedLevel: 1,
    levels: {}, records: {}, active: null, attempts: {}, victory: null,
    owned: ['theme-light', 'nuts-classic', 'bolts-classic', 'bases-classic'],
    equipped: { themes: 'theme-light', nuts: 'nuts-classic', bolts: 'bolts-classic', bases: 'bases-classic' },
    settings: { sound: true, haptics: true, colorLabels: false },
    daily: { streak: 0, lastClaimDay: 0, lastReward: 0, totalClaimed: 0 },
    clock: { highWater: now, lastResetDay: localDay(now), suspicious: false },
    roundsPlayed: 0, interstitialDue: false,
  };
}

/**
 * Offline resistance, not a trusted-time authority. A stored high-water mark
 * prevents rollback/repeated-date claims. Runtime monotonic drift detection
 * prevents jumping forward while the process is running.
 */
export function advanceCalendar(state: GameState, now: number, runtimeDrift = false): GameState {
  const day = localDay(now);
  const suspicious = runtimeDrift || now < state.clock.highWater - 120_000
    || day < state.daily.lastClaimDay || day < state.clock.lastResetDay;
  if (suspicious) {
    return state.clock.suspicious ? state : { ...state, clock: { ...state.clock, suspicious: true } };
  }
  let next = state;
  const highWater = Math.max(state.clock.highWater, now);
  if (day > state.clock.lastResetDay) {
    next = { ...next, lives: 5, clock: { ...next.clock, lastResetDay: day } };
  }
  if (day > state.daily.lastClaimDay) {
    const streak = day === state.daily.lastClaimDay + 1 ? state.daily.streak + 1 : 1;
    const reward = loginReward(streak);
    next = {
      ...next, coins: next.coins + reward,
      daily: { streak, lastClaimDay: day, lastReward: reward, totalClaimed: next.daily.totalClaimed + reward },
    };
  }
  if (next !== state || state.clock.suspicious || highWater - state.clock.highWater > 30_000) {
    next = { ...next, clock: { ...next.clock, highWater, suspicious: false } };
  }
  return next;
}