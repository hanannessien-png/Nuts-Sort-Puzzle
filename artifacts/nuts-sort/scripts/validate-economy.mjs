import assert from 'node:assert/strict';
import { initialState, advanceCalendar, scoreRun, localDay } from '../game/economy.ts';
import { CATALOG, itemPrice, POWER_PRICES } from '../game/catalogue.ts';

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
console.log('PASS: daily/weekly/monthly rewards, missed-day reset, midnight lives, clock guards, fixed scoring and bundle prices.');