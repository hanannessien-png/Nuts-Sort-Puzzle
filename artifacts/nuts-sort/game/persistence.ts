import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import type { GameState } from './types';

const KEY = '@nuts-sort/save-v1';
const integer = z.number().int().nonnegative();
const positive = z.number().finite().nonnegative();
const board = z.array(z.array(integer));
const move = z.object({ from: integer, to: integer });
const attempt = z.object({
  levelId: integer, board, capacity: integer, moves: integer,
  remaining: positive, elapsed: positive,
  status: z.enum(['playing', 'timeout', 'won', 'lost']),
  selected: integer.nullable(), hint: move.nullable(),
  hintPlan: z.array(move), history: z.array(move),
});
const schema = z.object({
  version: z.literal(1), coins: integer, lives: integer.max(5), unlockedLevel: integer.min(1),
  levels: z.record(z.string(), z.object({
    id: integer, board, capacity: integer.min(1), colors: integer.min(1),
    nutsPerColor: integer.min(1), timeLimit: positive, optimalMoves: integer,
    solution: z.array(move), createdAt: positive,
    difficulty: z.enum(['Easy', 'Gentle', 'Medium', 'Hard', 'Expert']),
  })),
  records: z.record(z.string(), z.object({
    stars: integer.min(1).max(5), bestMoves: integer, bestSeconds: positive,
    bestReward: integer, plays: integer,
  })),
  active: attempt.nullable(), attempts: z.record(z.string(), attempt),
  victory: z.object({
    levelId: integer, stars: integer, moves: integer, seconds: positive,
    optimalMoves: integer, reward: integer, totalReward: integer,
    previousBest: integer, doubled: z.boolean(),
  }).nullable(),
  owned: z.array(z.string()),
  equipped: z.object({ themes: z.string(), nuts: z.string(), bolts: z.string(), bases: z.string() }),
  settings: z.object({ sound: z.boolean(), haptics: z.boolean(), colorLabels: z.boolean() }),
  daily: z.object({ streak: integer, lastClaimDay: integer, lastReward: integer, totalClaimed: integer }),
  clock: z.object({ highWater: positive, lastResetDay: integer, suspicious: z.boolean() }),
  roundsPlayed: integer, interstitialDue: z.boolean(),
});

export async function readSave(): Promise<GameState | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return schema.parse(JSON.parse(raw));
  } catch {
    throw new Error('Saved progress could not be read. Your save has not been erased. Please try again.');
  }
}

let queue: Promise<void> = Promise.resolve();
/** Whole-state snapshots serialize coins, prizes, inventory and score together. */
export function writeSave(state: GameState): Promise<void> {
  const snapshot = JSON.stringify(state);
  const next = queue.catch(() => undefined).then(() => AsyncStorage.setItem(KEY, snapshot));
  queue = next;
  return next;
}