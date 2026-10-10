import type { Board, Level, Move, NutColor, SolveResult } from './types';

/*
 * A state is keyed independently of its bolt order.  Bolts are interchangeable
 * in this game, so this removes a very large source of duplicate search states.
 * The search nodes still retain a concrete board, which lets us return normal
 * (indexed) moves to the UI.
 */
interface SearchNode {
  key: string;
  board: Board;
  depth: number;
  parent: SearchNode | null;
  /** The move from parent to this node. */
  move: Move | null;
}

interface Queue {
  items: SearchNode[];
  head: number;
}

interface LevelSpec {
  colors: number;
  nuts: number;
  capacity: number;
  columns: number;
  scramble: number;
  minOptimal: number;
  maxOptimal: number;
  difficulty: Level['difficulty'];
}

const DEFAULT_MAX_NODES = 90_000;
const DEFAULT_MAX_MS = 1_500;
const YIELD_EVERY = 192;

const cloneBoard = (board: Board): Board => board.map((column) => column.slice());

const pause = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function columnKey(column: NutColor[]): string {
  return `[${column.join(',')}]`;
}

function boardKey(board: Board): string {
  return board.map(columnKey).sort().join('|');
}

function validShape(board: Board, capacity: number): boolean {
  return Number.isInteger(capacity)
    && capacity > 0
    && board.length > 0
    && board.every((column) => Array.isArray(column)
      && column.length <= capacity
      && column.every((color) => typeof color === 'number' && Number.isFinite(color)));
}

/**
 * A board is complete if each occupied bolt has one colour and no colour
 * appears on two different bolts. Empty bolts are deliberately ignored.
 */
export function isSolved(board: Board): boolean {
  const completed = new Set<NutColor>();
  let hasNut = false;

  for (const column of board) {
    if (column.length === 0) continue;
    hasNut = true;
    const color = column[0];
    for (let index = 1; index < column.length; index += 1) {
      if (column[index] !== color) return false;
    }
    if (completed.has(color)) return false;
    completed.add(color);
  }

  return hasNut;
}

/**
 * Applies precisely one top-nut move without changing the supplied board.
 * A destination may be empty; "empty" is invalid only for a source bolt.
 */
export function applyMove(board: Board, capacity: number, move: Move): Board | null {
  if (!validShape(board, capacity)
    || !Number.isInteger(move.from)
    || !Number.isInteger(move.to)
    || move.from === move.to
    || move.from < 0
    || move.to < 0
    || move.from >= board.length
    || move.to >= board.length) {
    return null;
  }

  const source = board[move.from];
  const destination = board[move.to];
  if (source.length === 0 || destination.length >= capacity) return null;

  const next = cloneBoard(board);
  const nut = next[move.from].pop();
  // source was checked above, but keeping this guard makes this function safe
  // if it is ever changed to support sparse arrays.
  if (nut === undefined) return null;
  next[move.to].push(nut);
  return next;
}

function legalMoves(board: Board, capacity: number, avoid: Move | null = null): Move[] {
  const moves: Move[] = [];
  for (let from = 0; from < board.length; from += 1) {
    if (board[from].length === 0) continue;
    for (let to = 0; to < board.length; to += 1) {
      if (from === to || board[to].length >= capacity) continue;
      if (avoid && from === avoid.to && to === avoid.from) continue;
      moves.push({ from, to });
    }
  }
  return moves;
}

function goalBoardFor(board: Board, capacity: number): Board | null {
  const counts = new Map<NutColor, number>();
  for (const column of board) {
    for (const color of column) counts.set(color, (counts.get(color) ?? 0) + 1);
  }
  if (counts.size === 0 || counts.size > board.length) return null;

  const colors = Array.from(counts.keys()).sort((left, right) => left - right);
  const goal: Board = [];
  for (const color of colors) {
    const count = counts.get(color) ?? 0;
    if (count > capacity) return null;
    goal.push(Array.from({ length: count }, () => color));
  }
  while (goal.length < board.length) goal.push([]);
  return goal;
}

function nextLayerSize(queue: Queue): number {
  if (queue.head >= queue.items.length) return 0;
  const depth = queue.items[queue.head].depth;
  let end = queue.head;
  while (end < queue.items.length && queue.items[end].depth === depth) end += 1;
  return end - queue.head;
}

function forwardMoves(node: SearchNode): Move[] {
  const result: Move[] = [];
  let current: SearchNode | null = node;
  while (current?.parent && current.move) {
    result.push(current.move);
    current = current.parent;
  }
  result.reverse();
  return result;
}

/**
 * Finds the column permutation which turns `backward` into `forward`.
 * They have equal canonical keys, so matching complete column contents is
 * sufficient, including duplicate empty columns.
 */
function backwardToForwardMap(backward: Board, forward: Board): number[] | null {
  const positions = new Map<string, number[]>();
  for (let index = 0; index < backward.length; index += 1) {
    const key = columnKey(backward[index]);
    const list = positions.get(key);
    if (list) list.push(index);
    else positions.set(key, [index]);
  }

  const map = Array.from({ length: backward.length }, () => -1);
  for (let forwardIndex = 0; forwardIndex < forward.length; forwardIndex += 1) {
    const list = positions.get(columnKey(forward[forwardIndex]));
    const backwardIndex = list?.pop();
    if (backwardIndex === undefined) return null;
    map[backwardIndex] = forwardIndex;
  }
  return map.every((index) => index >= 0) ? map : null;
}

function joinAtMeeting(forward: SearchNode, backward: SearchNode): Move[] | null {
  const map = backwardToForwardMap(backward.board, forward.board);
  if (!map) return null;

  const result = forwardMoves(forward);
  let current: SearchNode | null = backward;
  // Backward nodes were grown from a solved board.  Walk those edges backwards
  // and use the fixed column permutation established at the meeting point.
  while (current?.parent && current.move) {
    result.push({
      from: map[current.move.to],
      to: map[current.move.from],
    });
    current = current.parent;
  }
  return result;
}

function verifiesSolution(board: Board, capacity: number, moves: Move[]): boolean {
  let current = cloneBoard(board);
  for (const move of moves) {
    const next = applyMove(current, capacity, move);
    if (!next) return false;
    current = next;
  }
  return isSolved(current);
}

/**
 * Exact bidirectional breadth-first search.  Since a legal move is always
 * reversible, BFS from the canonical solved arrangement is valid. Search is
 * conducted in the quotient space of column permutations, while the stored
 * concrete representatives preserve a usable path.
 */
async function solveBidirectional(
  board: Board,
  capacity: number,
  options: { maxNodes?: number; maxMs?: number } = {},
): Promise<SolveResult> {
  if (!validShape(board, capacity)) {
    return { status: 'unsolvable', moves: [], optimal: false, visited: 0 };
  }
  const startBoard = cloneBoard(board);
  if (isSolved(startBoard)) {
    return { status: 'solved', moves: [], optimal: true, visited: 0 };
  }
  const goal = goalBoardFor(startBoard, capacity);
  if (!goal) return { status: 'unsolvable', moves: [], optimal: false, visited: 0 };

  const maxNodes = Math.max(0, Math.floor(options.maxNodes ?? DEFAULT_MAX_NODES));
  const maxMs = Math.max(0, Math.floor(options.maxMs ?? DEFAULT_MAX_MS));
  const startedAt = Date.now();
  const start: SearchNode = {
    key: boardKey(startBoard), board: startBoard, depth: 0, parent: null, move: null,
  };
  const target: SearchNode = {
    key: boardKey(goal), board: goal, depth: 0, parent: null, move: null,
  };
  const forwardSeen = new Map<string, SearchNode>([[start.key, start]]);
  const backwardSeen = new Map<string, SearchNode>([[target.key, target]]);
  const forwardQueue: Queue = { items: [start], head: 0 };
  const backwardQueue: Queue = { items: [target], head: 0 };
  let forwardRadius = 0;
  let backwardRadius = 0;
  let visited = 0;
  // A mutable holder is used rather than a captured `let`, so TypeScript does
  // not incorrectly narrow it to null outside the `consider` callback.
  const best: { value: { moves: Move[]; length: number } | null } = { value: null };

  const budgetResult = (): SolveResult => ({
    status: 'budget',
    moves: best.value?.moves ?? [],
    optimal: false,
    visited,
  });

  const consider = (forwardNode: SearchNode, backwardNode: SearchNode): void => {
    const moves = joinAtMeeting(forwardNode, backwardNode);
    if (!moves || !verifiesSolution(startBoard, capacity, moves)) return;
    if (!best.value || moves.length < best.value.length) {
      best.value = { moves, length: moves.length };
    }
  };

  while (forwardQueue.head < forwardQueue.items.length
    && backwardQueue.head < backwardQueue.items.length) {
    if (Date.now() - startedAt >= maxMs) return budgetResult();

    // Keeping the radii balanced gives bidirectional BFS its practical speed,
    // while still expanding complete layers (needed for its optimality proof).
    const expandForward = forwardRadius <= backwardRadius;
    const ownQueue = expandForward ? forwardQueue : backwardQueue;
    const ownSeen = expandForward ? forwardSeen : backwardSeen;
    const otherSeen = expandForward ? backwardSeen : forwardSeen;
    const layerDepth = ownQueue.items[ownQueue.head].depth;

    while (ownQueue.head < ownQueue.items.length
      && ownQueue.items[ownQueue.head].depth === layerDepth) {
      if (visited >= maxNodes || Date.now() - startedAt >= maxMs) return budgetResult();
      const current = ownQueue.items[ownQueue.head];
      ownQueue.head += 1;
      visited += 1;

      for (const move of legalMoves(current.board, capacity)) {
        const nextBoard = applyMove(current.board, capacity, move);
        if (!nextBoard) continue;
        const key = boardKey(nextBoard);
        if (ownSeen.has(key)) continue;
        const next: SearchNode = {
          key,
          board: nextBoard,
          depth: current.depth + 1,
          parent: current,
          move,
        };
        ownSeen.set(key, next);
        ownQueue.items.push(next);
        const opposite = otherSeen.get(key);
        if (opposite) {
          if (expandForward) consider(next, opposite);
          else consider(opposite, next);
        }
      }

      if (visited % YIELD_EVERY === 0) {
        await pause();
        if (Date.now() - startedAt >= maxMs) return budgetResult();
      }
    }

    if (expandForward) forwardRadius = layerDepth + 1;
    else backwardRadius = layerDepth + 1;

    // All states through each radius have now been discovered. Any shorter
    // route would have an intersection in those two balls, so this answer is
    // proven shortest rather than merely a convenient witness.
    if (best.value && forwardRadius + backwardRadius >= best.value.length) {
      return { status: 'solved', moves: best.value.moves, optimal: true, visited };
    }
  }

  if (best.value) {
    // This is chiefly defensive (the radius test above normally returns first).
    return { status: 'solved', moves: best.value.moves, optimal: true, visited };
  }
  return { status: 'unsolvable', moves: [], optimal: false, visited };
}

interface HeapEntry {
  node: SearchNode;
  estimate: number;
  remaining: number;
}

class MinHeap {
  private readonly values: HeapEntry[] = [];

  get length(): number {
    return this.values.length;
  }

  push(value: HeapEntry): void {
    this.values.push(value);
    let index = this.values.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.before(this.values[parent], value)) break;
      this.values[index] = this.values[parent];
      index = parent;
    }
    this.values[index] = value;
  }

  pop(): HeapEntry | undefined {
    const first = this.values[0];
    const last = this.values.pop();
    if (!first || !last || this.values.length === 0) return first;

    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.values.length) break;
      const child = right < this.values.length && this.before(this.values[right], this.values[left])
        ? right
        : left;
      if (this.before(last, this.values[child])) break;
      this.values[index] = this.values[child];
      index = child;
    }
    this.values[index] = last;
    return first;
  }

  private before(left: HeapEntry, right: HeapEntry): boolean {
    return left.estimate < right.estimate
      || (left.estimate === right.estimate && left.remaining <= right.remaining);
  }
}

/**
 * Every split colour needs at least one move for every extra column it
 * occupies. One move can eliminate the colour from at most one column, so this
 * is an admissible (and consistent) lower bound for A*.
 */
function splitColorLowerBound(board: Board): number {
  const locations = new Map<NutColor, Set<number>>();
  for (let columnIndex = 0; columnIndex < board.length; columnIndex += 1) {
    for (const color of board[columnIndex]) {
      let set = locations.get(color);
      if (!set) {
        set = new Set<number>();
        locations.set(color, set);
      }
      set.add(columnIndex);
    }
  }
  let lowerBound = 0;
  for (const set of locations.values()) lowerBound += Math.max(0, set.size - 1);
  return lowerBound;
}

/**
 * A* is preferable once there are enough nuts that the broad BFS frontiers
 * become expensive. It uses the split-colour lower bound above and reopens a
 * state when a shorter path is found, retaining the usual optimality proof.
 */
async function solveAStar(
  board: Board,
  capacity: number,
  options: { maxNodes?: number; maxMs?: number },
): Promise<SolveResult> {
  if (!validShape(board, capacity)) {
    return { status: 'unsolvable', moves: [], optimal: false, visited: 0 };
  }
  const startBoard = cloneBoard(board);
  if (isSolved(startBoard)) {
    return { status: 'solved', moves: [], optimal: true, visited: 0 };
  }
  if (!goalBoardFor(startBoard, capacity)) {
    return { status: 'unsolvable', moves: [], optimal: false, visited: 0 };
  }

  const maxNodes = Math.max(0, Math.floor(options.maxNodes ?? DEFAULT_MAX_NODES));
  const maxMs = Math.max(0, Math.floor(options.maxMs ?? DEFAULT_MAX_MS));
  const startedAt = Date.now();
  const start: SearchNode = {
    key: boardKey(startBoard), board: startBoard, depth: 0, parent: null, move: null,
  };
  const known = new Map<string, SearchNode>([[start.key, start]]);
  const open = new MinHeap();
  const initialRemaining = splitColorLowerBound(startBoard);
  open.push({ node: start, estimate: initialRemaining, remaining: initialRemaining });
  let visited = 0;

  while (open.length > 0) {
    if (visited >= maxNodes || Date.now() - startedAt >= maxMs) {
      return { status: 'budget', moves: [], optimal: false, visited };
    }
    const entry = open.pop();
    if (!entry || known.get(entry.node.key) !== entry.node) continue;
    const current = entry.node;
    visited += 1;

    if (isSolved(current.board)) {
      const moves = forwardMoves(current);
      // This guard protects callers even if future changes alter the state
      // canonicalisation or parent storage.
      if (!verifiesSolution(startBoard, capacity, moves)) {
        return { status: 'unsolvable', moves: [], optimal: false, visited };
      }
      return { status: 'solved', moves, optimal: true, visited };
    }

    for (const move of legalMoves(current.board, capacity)) {
      const nextBoard = applyMove(current.board, capacity, move);
      if (!nextBoard) continue;
      const key = boardKey(nextBoard);
      const nextDepth = current.depth + 1;
      const previous = known.get(key);
      if (previous && previous.depth <= nextDepth) continue;

      const next: SearchNode = {
        key,
        board: nextBoard,
        depth: nextDepth,
        parent: current,
        move,
      };
      known.set(key, next);
      const remaining = splitColorLowerBound(nextBoard);
      open.push({ node: next, estimate: nextDepth + remaining, remaining });
    }

    if (visited % YIELD_EVERY === 0) {
      await pause();
      if (Date.now() - startedAt >= maxMs) {
        return { status: 'budget', moves: [], optimal: false, visited };
      }
    }
  }

  return { status: 'unsolvable', moves: [], optimal: false, visited };
}

/**
 * Finds a shortest verified solution without mutating the supplied board.
 * Small positions use bidirectional BFS; larger positions use admissible A*
 * to avoid materialising very wide middle layers.
 */
export async function solveBoard(
  board: Board,
  capacity: number,
  options: { maxNodes?: number; maxMs?: number } = {},
): Promise<SolveResult> {
  const nuts = board.reduce((total, column) => total + (Array.isArray(column) ? column.length : 0), 0);
  return nuts <= 16
    ? solveBidirectional(board, capacity, options)
    : solveAStar(board, capacity, options);
}

/**
 * Difficulty rules v2 (LEVEL_RULES_VERSION in economy.ts): the owner asked for
 * a medium step up. Level 1 keeps its agreed 3-color layout; later levels need
 * longer certified solutions and reach large boards sooner, while every board
 * is still solver-verified before play.
 */

function earlySpec(id: number): LevelSpec | null {
  const specs: LevelSpec[] = [
    { colors: 3, nuts: 3, capacity: 4, columns: 3, scramble: 2, minOptimal: 2, maxOptimal: 4, difficulty: 'Easy' },
    { colors: 3, nuts: 3, capacity: 4, columns: 3, scramble: 6, minOptimal: 3, maxOptimal: 6, difficulty: 'Easy' },
    { colors: 3, nuts: 4, capacity: 4, columns: 4, scramble: 8, minOptimal: 4, maxOptimal: 8, difficulty: 'Gentle' },
    { colors: 3, nuts: 4, capacity: 5, columns: 4, scramble: 10, minOptimal: 5, maxOptimal: 9, difficulty: 'Gentle' },
    { colors: 4, nuts: 3, capacity: 4, columns: 5, scramble: 11, minOptimal: 5, maxOptimal: 10, difficulty: 'Medium' },
    { colors: 4, nuts: 4, capacity: 5, columns: 5, scramble: 13, minOptimal: 6, maxOptimal: 12, difficulty: 'Medium' },
    { colors: 4, nuts: 4, capacity: 4, columns: 5, scramble: 14, minOptimal: 7, maxOptimal: 13, difficulty: 'Medium' },
    { colors: 4, nuts: 4, capacity: 4, columns: 5, scramble: 16, minOptimal: 8, maxOptimal: 14, difficulty: 'Medium' },
    { colors: 4, nuts: 4, capacity: 4, columns: 5, scramble: 18, minOptimal: 9, maxOptimal: 15, difficulty: 'Hard' },
    { colors: 4, nuts: 4, capacity: 4, columns: 5, scramble: 20, minOptimal: 10, maxOptimal: 16, difficulty: 'Hard' },
  ];
  return specs[id - 1] ?? null;
}

function levelSpec(id: number): LevelSpec {
  const early = earlySpec(id);
  if (early) return early;

  const colors = Math.min(6, 4 + Math.floor((id - 11) / 4));
  const nuts = Math.min(5, 4 + Math.floor((id - 11) / 8));
  const difficulty: Level['difficulty'] = id < 14 ? 'Medium' : id < 26 ? 'Hard' : 'Expert';
  return {
    colors,
    nuts,
    capacity: nuts,
    columns: colors + (colors < 5 ? 1 : 3),
    scramble: Math.min(32, 16 + Math.floor(id * 0.65)),
    minOptimal: Math.min(11, 7 + Math.floor((id - 10) / 5)),
    maxOptimal: Math.min(30, 16 + Math.floor(id * 0.6)),
    difficulty,
  };
}

function solvedBoard(spec: LevelSpec): Board {
  const board: Board = Array.from(
    { length: spec.colors },
    (_, color) => Array.from({ length: spec.nuts }, () => color),
  );
  while (board.length < spec.columns) board.push([]);
  return board;
}

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

function scrambleFromSolved(spec: LevelSpec, levelId: number): Board {
  let board = solvedBoard(spec);
  let previous: Move | null = null;

  // Level one intentionally has no spare bolt. This two-move reversible
  // scramble has a lower bound of two split colours, so its certified optimum
  // is exactly two while retaining the requested 3 × cap-4 layout.
  if (levelId === 1) {
    const order = [0, 1, 2].sort(() => Math.random() - 0.5);
    const first = { from: order[0], to: order[1] };
    const second = { from: order[2], to: order[0] };
    return applyMove(applyMove(board, spec.capacity, first) as Board, spec.capacity, second) as Board;
  }

  for (let step = 0; step < spec.scramble; step += 1) {
    let choices = legalMoves(board, spec.capacity, previous);
    if (choices.length === 0) choices = legalMoves(board, spec.capacity);
    const move = choices[randomIndex(choices.length)];
    const next = applyMove(board, spec.capacity, move);
    if (!next) throw new Error('Internal scramble produced an invalid move.');
    board = next;
    previous = move;
  }
  return board;
}

function timeLimitFor(spec: LevelSpec): number {
  // Difficulty rules v2: 15% less time than the original formula.
  return Math.round(Math.min(210, 55 + spec.colors * 12 + spec.nuts * 8) * 0.85);
}

/**
 * Produces a fresh, unseeded board and accepts it only after exact solver
 * certification. Callers persist this result, so a stored level is never
 * regenerated or changed by later app launches.
 */
export async function generateLevel(id: number): Promise<Level> {
  if (!Number.isInteger(id) || id < 1) throw new Error('Level id must be a positive integer.');
  const spec = levelSpec(id);
  const attempts = id <= 10 ? 28 : 14;
  const generationStarted = Date.now();
  const generationBudget = id <= 10 ? 4_000 : 8_000;

  const toLevel = (board: Board, moves: Move[]): Level => ({
    id,
    board: cloneBoard(board),
    capacity: spec.capacity,
    colors: spec.colors,
    nutsPerColor: spec.nuts,
    timeLimit: timeLimitFor(spec),
    optimalMoves: moves.length,
    solution: moves.map((move) => ({ ...move })),
    createdAt: Date.now(),
    difficulty: spec.difficulty,
  });
  // A fully certified board slightly below the target length is kept as a
  // fallback so slow devices still get a verified, near-target puzzle.
  const fallbackFloor = Math.max(2, Math.ceil(spec.minOptimal * 0.75));
  let fallback: { board: Board; moves: Move[] } | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (Date.now() - generationStarted >= generationBudget) break;
    const board = scrambleFromSolved(spec, id);
    if (isSolved(board)) continue;

    const result = await solveBoard(board, spec.capacity, {
      maxNodes: id <= 10 ? 55_000 : 150_000,
      maxMs: id <= 10 ? 900 : 1_700,
    });
    if (result.status !== 'solved' || !result.optimal || !verifiesSolution(board, spec.capacity, result.moves)) {
      await pause();
      continue;
    }
    if (result.moves.length < spec.minOptimal || result.moves.length > spec.maxOptimal) {
      if (result.moves.length >= fallbackFloor && result.moves.length <= spec.maxOptimal
        && (!fallback || result.moves.length > fallback.moves.length)) {
        fallback = { board, moves: result.moves };
      }
      await pause();
      continue;
    }

    return toLevel(board, result.moves);
  }

  if (fallback) return toLevel(fallback.board, fallback.moves);
  throw new Error(`Could not certify a playable level ${id} within the generation budget. Please try again.`);
}