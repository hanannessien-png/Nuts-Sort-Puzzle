import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { CATALOG, POWER_PACKS, POWER_PRICES, equipPurchased, itemPrice } from './catalogue';
import { advanceCalendar, applyLevelRules, initialState, scoreRun } from './economy';
import { applyMove, generateLevel, isSolved, solveBoard } from './engine';
import { readSave, writeSave } from './persistence';
import { ActivePlayClock, elapseAttempt } from './timing';
import {
  adAvailability, initializeAds, isAdShowing,
  showAppOpenAd, showInterstitialAd, showRewardedAd, subscribeAdState,
} from '@/services/ads';
import type {
  ActionResult, Attempt, GameContextValue, GameState, Move, Payment, PowerPayment, PowerUp,
} from './types';

const GameContext = createContext<GameContextValue | null>(null);
const success: ActionResult = { ok: true };
const copyBoard = (board: number[][]) => board.map(column => [...column]);
const mono = () => globalThis.performance?.now() ?? Date.now();

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(() => initialState(Date.now()));
  const current = useRef(state);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);
  const [startupAdsPending, setStartupAdsPending] = useState(true);
  const startupPending = useRef(true);
  const adsStarted = useRef(false);
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const [adBusy, setAdBusy] = useState(false);
  const adLock = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const storageFault = useRef(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [ads, setAds] = useState({ available: false, message: 'Ads are loading.' });
  const visible = useRef(false);
  const foreground = useRef(AppState.currentState == null || AppState.currentState === 'active');
  const playClock = useRef(new ActivePlayClock(mono()));
  const session = useRef({ wall: Date.now(), mono: mono() });
  const generation = useRef(0);
  const lastSaved = useRef(mono());
  const moveSound = useAudioPlayer(require('../assets/audio/move.wav'));
  const winSound = useAudioPlayer(require('../assets/audio/win.wav'));
  const soundRef = useRef({ moveSound, winSound });
  soundRef.current = { moveSound, winSound };

  function fail(message: string): ActionResult {
    setNotice(message);
    return { ok: false, message };
  }

  function publish(next: GameState, persist = true): Promise<void> {
    current.current = next;
    setState(next);
    if (!persist) return Promise.resolve();
    lastSaved.current = mono();
    return writeSave(next).catch(() => {
      storageFault.current = true;
      setError('Your progress could not be saved. Free some device storage, then tap Retry. Keep the game open so your progress can be saved.');
      throw new Error('Could not save progress');
    });
  }

  function store(next: GameState, persist = true) {
    void publish(next, persist).catch(() => undefined);
  }

  function advancePlayClock() {
    const now = mono();
    const s = current.current;
    const running = loadedRef.current && !storageFault.current && visible.current
      && foreground.current && !startupPending.current && !operation.current && !adLock.current
      && !isAdShowing() && s.active?.status === 'playing';
    const delta = playClock.current.sample(now, running);
    if (!loadedRef.current || storageFault.current) return;
    const active = elapseAttempt(s.active, delta);
    if (active !== s.active) {
      store({ ...s, active }, active?.status !== s.active?.status || now - lastSaved.current > 2000);
    }
  }

  const setPlaying = useCallback((playing: boolean) => {
    const wasPlaying = visible.current;
    visible.current = playing;
    advancePlayClock();
    if (wasPlaying && !playing && loadedRef.current && !storageFault.current) {
      // Persist the fraction of a tick spent playing before leaving the board.
      store(current.current);
    }
  }, []);

  function feedback(win = false) {
    if (current.current.settings.haptics) {
      void (win
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)).catch(() => undefined);
    }
    if (current.current.settings.sound) {
      const player = win ? soundRef.current.winSound : soundRef.current.moveSound;
      try {
        void player.seekTo(0).then(() => player.play()).catch(() => undefined);
      } catch { /* Browser audio remains muted until a gesture unlocks playback. */ }
    }
  }

  async function hydrate() {
    const token = ++generation.current;
    setError(null);
    try {
      if (storageFault.current && loadedRef.current) {
        await writeSave(current.current);
        storageFault.current = false;
        advancePlayClock();
        return;
      }
      const saved = await readSave();
      if (token !== generation.current) return;
      const next = advanceCalendar(applyLevelRules(saved ?? initialState(Date.now())), Date.now());
      await writeSave(next);
      if (token !== generation.current) return;
      current.current = next;
      setState(next);
      loadedRef.current = true;
      setLoaded(true);
      storageFault.current = false;
      session.current = { wall: Date.now(), mono: mono() };
      advancePlayClock();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your progress. Please try again.');
    }
  }

  useEffect(() => {
    void hydrate();
    return () => { generation.current++; };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAdState(() => {
      setAds(adAvailability());
      advancePlayClock();
    });
    setAds(adAvailability());
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!loaded || adsStarted.current) return;
    adsStarted.current = true;
    let cancelled = false;
    // App-open is a cold loading-screen placement, never a late surprise on
    // Home/Settings or a foreground-resume ad. First launch is eligible after
    // consent; skip persisted interstitial boundaries to avoid stacking ads.
    const deadline = mono() + 4_000;
    const endStartup = () => {
      startupPending.current = false;
      if (!cancelled) setStartupAdsPending(false);
    };
    const startupTimer = setTimeout(endStartup, 4_000);
    const canShowColdOpen = () => !cancelled && startupPending.current && mono() < deadline
      && !visible.current && foreground.current && !operation.current
      && !current.current.interstitialDue
      && !storageFault.current;
    void initializeAds().then(async () => {
      if (canShowColdOpen()) {
        adLock.current = true;
        advancePlayClock();
        setAdBusy(true);
        try { await showAppOpenAd(canShowColdOpen); } finally {
          adLock.current = false;
          advancePlayClock();
          if (!cancelled) setAdBusy(false);
        }
      }
    }).catch(() => { if (!cancelled) setAds(adAvailability()); })
      .finally(() => { clearTimeout(startupTimer); endStartup(); });
    return () => { cancelled = true; clearTimeout(startupTimer); startupPending.current = false; };
  }, [loaded]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      foreground.current = next === 'active';
      advancePlayClock();
      if (loadedRef.current) {
        // A backgrounded attempt resumes with the SAME remaining time, never a fresh timer.
        void writeSave(current.current).catch(() => {
          storageFault.current = true;
          setError('Progress could not be saved. Please keep the game open and tap Retry.');
        });
      }
    });
    let calendarChecked = mono();
    const timer = setInterval(() => {
      const nowMono = mono();
      advancePlayClock();
      if (!loadedRef.current || storageFault.current) return;
      let next = current.current;
      if (foreground.current && nowMono - calendarChecked > 1000) {
        calendarChecked = nowMono;
        const expected = session.current.wall + nowMono - session.current.mono;
        next = advanceCalendar(next, Date.now(), Math.abs(Date.now() - expected) > 120_000);
      }
      if (next !== current.current) {
        const important = next.active?.status !== current.current.active?.status
          || next.daily !== current.current.daily || next.lives !== current.current.lives;
        store(next, important || nowMono - lastSaved.current > 2000);
      }
    }, 250);
    return () => { clearInterval(timer); sub.remove(); };
  }, []);

  async function exclusive(work: () => Promise<ActionResult>): Promise<ActionResult> {
    if (!loadedRef.current || storageFault.current) return fail('Progress is not ready. Please use Retry first.');
    if (startupPending.current || operation.current || adLock.current || isAdShowing()) return fail('Please wait for the current action to finish.');
    operation.current = true;
    advancePlayClock();
    setBusy(true);
    try { return await work(); }
    catch (e) { return fail(e instanceof Error ? e.message : 'That action could not be completed. Please try again.'); }
    finally { operation.current = false; advancePlayClock(); setBusy(false); }
  }

  async function rewarded(): Promise<boolean> {
    adLock.current = true;
    advancePlayClock();
    setAdBusy(true);
    try {
      const result = await showRewardedAd();
      setAds(adAvailability());
      if (!result.earned) setNotice(result.message ?? 'The ad was not completed. Nothing has been charged or awarded.');
      return result.earned;
    } finally { adLock.current = false; advancePlayClock(); setAdBusy(false); }
  }

  async function startLevel(id: number): Promise<ActionResult> {
    return exclusive(async () => {
      let s = current.current;
      if (!Number.isSafeInteger(id) || id < 1 || id > s.unlockedLevel) return fail('Complete the previous level to unlock this one.');
      if (s.lives < 1) return fail('No lives left. Watch an ad for one life, or return after midnight.');
      if (s.interstitialDue && s.active?.status !== 'playing' && s.active?.status !== 'timeout') {
        adLock.current = true; setAdBusy(true);
        try {
          await showInterstitialAd(() => foreground.current
            && current.current.active?.status !== 'playing'
            && current.current.active?.status !== 'timeout');
        } finally { adLock.current = false; setAdBusy(false); }
        s = { ...current.current, interstitialDue: false };
        // Consume this boundary durably even on no-fill, before generation can
        // throw; never create a backlog of ads on the next launch.
        await publish(s);
      }
      let level = s.levels[id];
      if (!level) level = await generateLevel(id);
      // Generation NEVER replaces an existing stored board, including a replay.
      s = { ...current.current, interstitialDue: s.interstitialDue, levels: { ...current.current.levels, [id]: level } };
      const parked = { ...s.attempts };
      if (s.active && (s.active.status === 'playing' || s.active.status === 'timeout')) parked[s.active.levelId] = s.active;
      const prior = parked[id];
      const active: Attempt = prior ?? {
        levelId: id, board: copyBoard(level.board), capacity: level.capacity,
        moves: 0, remaining: level.timeLimit, elapsed: 0, status: 'playing',
        selected: null, hint: null, history: [], hintPlan: [],
      };
      delete parked[id];
      await publish({ ...s, attempts: parked, active: { ...active, selected: null }, victory: null });
      setNotice(null);
      return success;
    });
  }

  function commitMove(nextBoard: number[][], move: Move) {
    const s = current.current;
    const a = s.active;
    if (!a) return;
    const hintMatches = a.hintPlan[0]?.from === move.from && a.hintPlan[0]?.to === move.to;
    const active: Attempt = {
      ...a, board: nextBoard, moves: a.moves + 1, selected: null, hint: null,
      history: [...a.history, move], hintPlan: hintMatches ? a.hintPlan.slice(1) : [],
    };
    if (!isSolved(nextBoard)) { store({ ...s, active }); feedback(); return; }
    const level = s.levels[a.levelId]!;
    const scored = scoreRun(level, active.moves, active.elapsed);
    const record = s.records[a.levelId];
    const previousBest = record?.bestReward ?? 0;
    const reward = Math.max(0, scored.reward - previousBest);
    const roundsPlayed = s.roundsPlayed + 1;
    const attempts = { ...s.attempts }; delete attempts[a.levelId];
    store({
      ...s, active: { ...active, status: 'won' }, attempts, coins: s.coins + reward,
      unlockedLevel: Math.max(s.unlockedLevel, a.levelId + 1), roundsPlayed,
      interstitialDue: s.interstitialDue || roundsPlayed % 2 === 0,
      records: {
        ...s.records,
        [a.levelId]: {
          stars: Math.max(scored.stars, record?.stars ?? 0),
          bestMoves: Math.min(active.moves, record?.bestMoves ?? Infinity),
          bestSeconds: Math.min(active.elapsed, record?.bestSeconds ?? Infinity),
          bestReward: Math.max(scored.reward, previousBest), plays: (record?.plays ?? 0) + 1,
        },
      },
      victory: {
        levelId: a.levelId, stars: scored.stars, moves: active.moves, seconds: active.elapsed,
        optimalMoves: level.optimalMoves, reward, totalReward: scored.reward, previousBest, doubled: false,
      },
    });
    feedback(true);
  }

  function tapColumn(index: number) {
    advancePlayClock();
    const s = current.current;
    const a = s.active;
    if (!loadedRef.current || storageFault.current || operation.current || adLock.current || isAdShowing() || !a || a.status !== 'playing') return;
    if (!Number.isInteger(index) || !a.board[index]) return;
    if (a.selected === index) { store({ ...s, active: { ...a, selected: null } }, false); return; }
    if (a.selected === null) {
      if (a.board[index]!.length === 0) return;
      store({ ...s, active: { ...a, selected: index } }, false);
      feedback(); return;
    }
    const move = { from: a.selected, to: index };
    const board = applyMove(a.board, a.capacity, move);
    if (!board) { setNotice('That bolt is full. Choose one with an empty space.'); return; }
    commitMove(board, move);
  }

  function resetLevel() {
    advancePlayClock();
    const s = current.current, a = s.active;
    if (storageFault.current || operation.current || adLock.current || isAdShowing() || !a || a.status !== 'playing') return;
    const initial = s.levels[a.levelId]!;
    const extras = Math.max(0, a.board.length - initial.board.length);
    store({
      ...s,
      active: {
        ...a, board: [...copyBoard(initial.board), ...Array.from({ length: extras }, () => [] as number[])],
        moves: 0, selected: null, hint: null, history: [], hintPlan: [],
      },
    });
    setNotice('Board reset for free. Your remaining time is unchanged.');
  }

  function abandonTimeout() {
    const s = current.current, a = s.active;
    if (storageFault.current || operation.current || adLock.current || isAdShowing() || !a || a.status !== 'timeout') return;
    const roundsPlayed = s.roundsPlayed + 1;
    const attempts = { ...s.attempts }; delete attempts[a.levelId];
    store({
      ...s, active: { ...a, status: 'lost' }, attempts, lives: Math.max(0, s.lives - 1),
      roundsPlayed, interstitialDue: s.interstitialDue || roundsPlayed % 2 === 0,
    });
  }

  function validWitness(a: Attempt, moves: Move[]): boolean {
    let b = copyBoard(a.board);
    for (const m of moves) {
      const moved = applyMove(b, a.capacity, m);
      if (!moved) return false;
      b = moved;
    }
    return isSolved(b);
  }

  async function usePowerUp(kind: PowerUp, payment: PowerPayment): Promise<ActionResult> {
    return exclusive(async () => {
      const a = current.current.active;
      if (!a || a.status !== 'playing') return fail('Start or resume a level first.');
      const price = POWER_PRICES[kind];
      if (!price) return fail('This power-up is not available.');
      if (payment === 'coins' && current.current.coins < price) return fail(`You need ${price} coins. You can choose a rewarded ad instead.`);
      if (payment === 'stock' && current.current.powerups[kind] <= 0) return fail('You have none left. Buy more in the shop or choose another option.');
      let plan: Move[] = [];
      if (kind === 'undo' && a.history.length === 0) return fail('Make a move first. Nothing has been charged.');
      if (kind === 'hint') {
        if (a.hintPlan.length && validWitness(a, a.hintPlan)) plan = a.hintPlan;
        else {
          const result = await solveBoard(a.board, a.capacity, { maxNodes: 35_000, maxMs: 1800 });
          if (result.status === 'solved') plan = result.moves;
          else {
            // Reversing real legal player moves back to the certified initial
            // board, then its verified solution, is itself a verified witness.
            plan = [...a.history].reverse().map(m => ({ from: m.to, to: m.from }))
              .concat(current.current.levels[a.levelId]!.solution);
          }
        }
        if (!plan.length || !validWitness(a, plan)) return fail('A verified hint could not be found. Nothing has been charged.');
      }
      if (payment === 'ad' && !await rewarded()) return { ok: false, message: 'No completed ad. No power-up was used.' };
      const s = current.current;
      const live = s.active;
      if (!live || live.levelId !== a.levelId || live.status !== 'playing') return fail('This attempt is no longer active. Nothing has been charged.');
      if (payment === 'stock' && s.powerups[kind] <= 0) return fail('You have none left. Nothing has been used.');
      const paid = {
        ...s,
        coins: s.coins - (payment === 'coins' ? price : 0),
        powerups: payment === 'stock' ? { ...s.powerups, [kind]: s.powerups[kind] - 1 } : s.powerups,
      };
      if (kind === 'hint') {
        await publish({ ...paid, active: { ...live, selected: null, hint: plan[0]!, hintPlan: plan } });
      } else if (kind === 'extraBolt') {
        await publish({ ...paid, active: { ...live, board: [...copyBoard(live.board), []], selected: null, hint: null, hintPlan: [] } });
      } else {
        const last = live.history[live.history.length - 1]!;
        const reverse = { from: last.to, to: last.from };
        const board = applyMove(live.board, live.capacity, reverse);
        if (!board) return fail('That move cannot be undone. Nothing has been charged.');
        // An undo is still one physical move for scoring. Trimming history
        // retains a valid route back to the initial board for hint recovery.
        await publish({
          ...paid,
          active: { ...live, board, moves: live.moves + 1, history: live.history.slice(0, -1), selected: null, hint: null, hintPlan: [] },
        });
      }
      feedback();
      return success;
    });
  }

  async function continueByAd(): Promise<ActionResult> {
    return exclusive(async () => {
      if (current.current.active?.status !== 'timeout') return fail('Your timer has not run out.');
      if (!await rewarded()) return { ok: false, message: 'Complete a rewarded ad to add time.' };
      const s = current.current;
      if (!s.active || s.active.status !== 'timeout') return fail('This attempt is no longer waiting for extra time.');
      await publish({ ...s, active: { ...s.active, status: 'playing', remaining: s.active.remaining + 60 } });
      return success;
    });
  }

  async function gainLifeByAd(): Promise<ActionResult> {
    return exclusive(async () => {
      if (current.current.lives >= 5) return fail('You already have all five lives.');
      if (!await rewarded()) return { ok: false, message: 'Complete a rewarded ad to receive a life.' };
      await publish({ ...current.current, lives: Math.min(5, current.current.lives + 1) });
      return success;
    });
  }

  async function doubleReward(): Promise<ActionResult> {
    return exclusive(async () => {
      const v = current.current.victory;
      if (!v || v.doubled || v.reward <= 0) return fail('There is no new reward to double.');
      if (!await rewarded()) return { ok: false, message: 'Your original reward is safe. Complete the ad to double it.' };
      const s = current.current;
      if (!s.victory || s.victory.doubled || s.victory.levelId !== v.levelId) return fail('This reward has already been handled.');
      await publish({ ...s, coins: s.coins + v.reward, victory: { ...s.victory, doubled: true } });
      return success;
    });
  }

  async function buyItem(id: string, payment: Payment): Promise<ActionResult> {
    return exclusive(async () => {
      const item = CATALOG.find(i => i.id === id);
      if (!item) return fail('This item is not in the collection.');
      const s = current.current;
      if (s.owned.includes(id)) { equipItem(id); return success; }
      const price = itemPrice(item, s.owned);
      if (payment === 'coins' && s.coins < price) return fail(`This costs ${price} coins. Save up, choose individual items, or watch an ad instead.`);
      if (price > 0 && payment === 'ad' && !await rewarded()) return { ok: false, message: 'No completed ad. No purchase was made.' };
      const fresh = current.current;
      const owned = [...new Set([...fresh.owned, item.id, ...(item.includes ?? [])])];
      await publish({
        ...fresh, coins: fresh.coins - (payment === 'coins' ? price : 0), owned,
        equipped: equipPurchased(fresh.equipped, item),
      });
      feedback();
      return success;
    });
  }

  async function buyPowerPack(id: string, payment: Payment): Promise<ActionResult> {
    return exclusive(async () => {
      const pack = POWER_PACKS.find(p => p.id === id);
      if (!pack) return fail('This pack is not available.');
      if (payment === 'ad' && pack.count !== 1) return fail('Packs are bought with coins. Single items can be earned with an ad.');
      if (payment === 'coins' && current.current.coins < pack.price) return fail(`This costs ${pack.price} coins.`);
      if (payment === 'ad' && !await rewarded()) return { ok: false, message: 'No completed ad. No purchase was made.' };
      const fresh = current.current;
      if (payment === 'coins' && fresh.coins < pack.price) return fail(`This costs ${pack.price} coins.`);
      await publish({
        ...fresh,
        coins: fresh.coins - (payment === 'coins' ? pack.price : 0),
        powerups: { ...fresh.powerups, [pack.kind]: fresh.powerups[pack.kind] + pack.count },
      });
      feedback();
      return success;
    });
  }

  function equipItem(id: string) {
    const s = current.current;
    if (storageFault.current) return;
    const item = CATALOG.find(i => i.id === id);
    if (!item || !s.owned.includes(id)) { setNotice('Unlock this item before equipping it.'); return; }
    store({ ...s, equipped: equipPurchased(s.equipped, item) });
  }

  function updateSettings(patch: Partial<GameState['settings']>) {
    if (storageFault.current) return;
    store({ ...current.current, settings: { ...current.current.settings, ...patch } });
  }

  const value: GameContextValue = {
    state, loaded: loaded && !startupAdsPending, busy, error, notice, adBusy, adsAvailable: ads.available,
    adStatus: ads.message, catalog: CATALOG,
    startLevel, tapColumn, resetLevel,
    setPlaying,
    abandonTimeout, usePowerUp, continueByAd, gainLifeByAd, doubleReward,
    buyPowerPack, powerPacks: POWER_PACKS,
    buyItem, equipItem, updateSettings, clearNotice: () => setNotice(null),
    retryLoad: () => { void hydrate(); },
  };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must be used inside GameProvider');
  return value;
}