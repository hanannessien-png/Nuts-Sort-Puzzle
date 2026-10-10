import assert from 'node:assert/strict';
import { initialState, advanceCalendar, scoreRun, localDay, applyLevelRules, LEVEL_RULES_VERSION } from '../game/economy.ts';
import { CATALOG, itemPrice, POWER_PRICES, POWER_PACKS } from '../game/catalogue.ts';

const at = day => new Date(2026, 0, day, 10).getTime();
let state = advanceCalendar(initialState(at(1)), at(1));
assert.equal(state.coins, 10);
assert.equal(state.daily.streak, 1);
assert.equal(advanceCalendar(state, at(1)).coins, 10, 'same-day launch must not pay twice');
let expected = 10;
for (let day = 2; day <= 35; day++) {
  const previous = state.coins;
  state = advanceCalendar(state, at(day));
  const amount = day % 30 === 0 ? 100 : day % 7 === 0 ? 50 : 10;
  expected += amount;
  assert.equal(state.coins - previous, amount, `daily amount on day ${day}`);
  assert.equal(state.coins, expected);
}
state = advanceCalendar(state, at(37));
assert.equal(state.daily.streak, 1, 'missed day resets both streaks');
assert.equal(state.daily.lastReward, 10);
const rollback = advanceCalendar(state, at(36));
assert.equal(rollback.coins, state.coins);
assert.equal(rollback.clock.suspicious, true);
const forwardJump = advanceCalendar(state, at(100), true);
assert.equal(forwardJump.coins, state.coins);
assert.equal(forwardJump.daily.lastClaimDay, localDay(at(37)));
const exhausted = { ...state, lives: 0 };
assert.equal(advanceCalendar(exhausted, at(38)).lives, 5);

const level = { id: 1, optimalMoves: 10 };
assert.equal(scoreRun(level, 10, 10).stars, 5);
assert.equal(scoreRun({ id: 1, optimalMoves: 2 }, 2, 90).stars, 5, 'Optimal moves earn five stars even when playing slowly');
assert.equal(scoreRun(level, 1000, 10000).stars, 1);
assert.deepEqual(scoreRun(level, 12, 20), scoreRun({ ...level, id: 1000 }, 12, 20));
assert.ok(scoreRun(level, 10, 10).reward > scoreRun(level, 10, 80).reward);
assert.ok(scoreRun(level, 10, 10).reward > scoreRun(level, 30, 10).reward);
for (let moves = 11; moves < 100; moves++) {
  assert.ok(scoreRun(level, moves, 20).reward <= scoreRun(level, moves - 1, 20).reward);
}
for (const item of CATALOG) {
  if (item.price > 0) assert.ok(item.price >= 50);
  if (item.includes) {
    const separate = item.includes.reduce((n, id) => n + CATALOG.find(i => i.id === id).price, 0);
    assert.equal(item.price, Math.round(separate * .85));
    assert.equal(itemPrice(item, item.includes), 0);
    assert.ok(itemPrice(item, [item.includes[0]]) < item.price);
  }
}
for (const price of Object.values(POWER_PRICES)) assert.ok(price >= 50);
for (const pack of POWER_PACKS) {
  assert.ok(pack.price >= 50, `${pack.id} costs at least 50`);
  assert.ok(pack.price <= POWER_PRICES[pack.kind] * pack.count, `${pack.id} never costs more than singles`);
}
{
  const fake = (id) => ({ id, board: [[0]], capacity: 1 });
  const attempt = (levelId, status = 'playing') => ({ levelId, status, board: [[0]] });
  const legacy = {
    ...initialState(at(1)), levelRules: 1, coins: 777, powerups: { hint: 2, undo: 0, extraBolt: 1 },
    levels: { 1: fake(1), 2: fake(2), 3: fake(3) },
    records: { 1: { stars: 3, bestMoves: 5, bestSeconds: 9, bestReward: 40, plays: 1 } },
    attempts: { 1: attempt(1), 2: attempt(2) }, active: attempt(3, 'timeout'),
  };
  const upgraded = applyLevelRules(legacy);
  assert.deepEqual(Object.keys(upgraded.levels), ['1'], 'only completed boards survive the difficulty upgrade');
  assert.deepEqual(Object.keys(upgraded.attempts), ['1']);
  assert.equal(upgraded.active, null, 'unfinished active attempt on a rebuilt level is dropped');
  assert.equal(upgraded.coins, 777);
  assert.deepEqual(upgraded.records, legacy.records);
  assert.deepEqual(upgraded.powerups, legacy.powerups);
  assert.equal(upgraded.levelRules, LEVEL_RULES_VERSION);
  assert.equal(applyLevelRules(upgraded), upgraded, 'upgrade runs once');
  const kept = applyLevelRules({ ...legacy, active: attempt(1) });
  assert.equal(kept.active.levelId, 1, 'replay of a completed board is kept');
}
console.log('PASS: difficulty upgrade keeps completed boards, power packs priced fairly, daily/weekly/monthly rewards, missed-day reset, midnight lives, clock guards, fixed scoring and bundle prices.');