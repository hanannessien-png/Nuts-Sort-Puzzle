export type NutColor = number;
/** Columns are ordered bottom to top. */
export type Board = NutColor[][];
export interface Move { from: number; to: number }
export interface Level {
  id: number;
  board: Board;
  capacity: number;
  colors: number;
  nutsPerColor: number;
  timeLimit: number;
  optimalMoves: number;
  solution: Move[];
  createdAt: number;
  difficulty: 'Easy' | 'Gentle' | 'Medium' | 'Hard' | 'Expert';
}
export interface SolveResult {
  status: 'solved' | 'unsolvable' | 'budget';
  moves: Move[];
  optimal: boolean;
  visited: number;
}
export interface LevelRecord {
  stars: number;
  bestMoves: number;
  bestSeconds: number;
  bestReward: number;
  plays: number;
}
export interface Victory {
  levelId: number;
  stars: number;
  moves: number;
  seconds: number;
  optimalMoves: number;
  reward: number;
  totalReward: number;
  previousBest: number;
  doubled: boolean;
}
export interface Attempt {
  levelId: number;
  board: Board;
  capacity: number;
  moves: number;
  remaining: number;
  elapsed: number;
  status: 'playing' | 'timeout' | 'won' | 'lost';
  selected: number | null;
  hint: Move | null;
  hintPlan: Move[];
  history: Move[];
}
export type ShopCategory = 'themes' | 'nuts' | 'bolts' | 'bases' | 'bundles';
export type Payment = 'coins' | 'ad';
/** 'stock' spends one owned power-up bought earlier in the shop. */
export type PowerPayment = Payment | 'stock';
export type PowerUp = 'hint' | 'undo' | 'extraBolt';
export interface PowerPack {
  id: string;
  kind: PowerUp;
  count: number;
  price: number;
  name: string;
  description: string;
}
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  price: number;
  rarity: 'Classic' | 'Rare' | 'Epic';
  appearance: string;
  includes?: string[];
}
export interface GameState {
  version: 1;
  coins: number;
  lives: number;
  unlockedLevel: number;
  levels: Record<string, Level>;
  records: Record<string, LevelRecord>;
  active: Attempt | null;
  attempts: Record<string, Attempt>;
  victory: Victory | null;
  owned: string[];
  equipped: { themes: string; nuts: string; bolts: string; bases: string };
  settings: { sound: boolean; haptics: boolean; colorLabels: boolean };
  daily: { streak: number; lastClaimDay: number; lastReward: number; totalClaimed: number };
  clock: { highWater: number; lastResetDay: number; suspicious: boolean };
  roundsPlayed: number;
  interstitialDue: boolean;
  /** Owned power-ups bought in the shop; consumed only when an effect applies. */
  powerups: Record<PowerUp, number>;
  /** Difficulty rules version the stored unfinished boards were generated with. */
  levelRules: number;
}
export interface ActionResult { ok: boolean; message?: string }
export interface GameContextValue {
  state: GameState;
  loaded: boolean;
  busy: boolean;
  error: string | null;
  notice: string | null;
  adBusy: boolean;
  adsAvailable: boolean;
  adStatus: string;
  catalog: ShopItem[];
  startLevel: (id: number) => Promise<ActionResult>;
  tapColumn: (index: number) => void;
  resetLevel: () => void;
  setPlaying: (playing: boolean) => void;
  abandonTimeout: () => void;
  usePowerUp: (kind: PowerUp, payment: PowerPayment) => Promise<ActionResult>;
  buyPowerPack: (id: string, payment: Payment) => Promise<ActionResult>;
  powerPacks: PowerPack[];
  continueByAd: () => Promise<ActionResult>;
  gainLifeByAd: () => Promise<ActionResult>;
  doubleReward: () => Promise<ActionResult>;
  buyItem: (id: string, payment: Payment) => Promise<ActionResult>;
  equipItem: (id: string) => void;
  updateSettings: (patch: Partial<GameState['settings']>) => void;
  clearNotice: () => void;
  retryLoad: () => void;
}