import assert from 'node:assert/strict';
import { ActivePlayClock, elapseAttempt } from '../game/timing.ts';
import { applyMove, isSolved } from '../game/engine.ts';
import { boardGeometry } from '../components/boardGeometry.ts';

const board = [[0, 1, 2], [1], [2, 0]];
const moved = applyMove(board, 4, { from: 0, to: 1 });
assert.deepEqual(moved, [[0, 1], [1, 2], [2, 0]], 'Only the final/top nut may move, regardless of target color');
assert.deepEqual(board, [[0, 1, 2], [1], [2, 0]], 'Moves must not mutate the original board');
assert.equal(applyMove(board, 3, { from: 1, to: 0 }), null, 'Full targets reject moves');
assert.equal(applyMove([[], [0]], 4, { from: 0, to: 1 }), null);
assert.equal(applyMove(board, 4, { from: 0, to: 0 }), null);
assert.equal(isSolved([[0, 0], [1, 1], []]), true);
assert.equal(isSolved([[0], [0], [1]]), false, 'A color split over columns is not solved');

const clock = new ActivePlayClock(0);
assert.equal(clock.sample(5000, true), 0, 'Opening the board must not charge time spent in menus');
assert.equal(clock.sample(5250, true), .25);
assert.equal(clock.sample(5400, false), .15, 'Pausing charges the final partial playing interval');
assert.equal(clock.sample(65_400, true), 0, 'Suspended JS timers must not deduct background time on resume');
assert.equal(clock.sample(65_500, false), .1);
assert.equal(clock.sample(95_500, true), 0, 'Ad and power-up pauses never consume play time');
assert.equal(clock.sample(95_600, true), .1);

const attempt = {
  levelId: 1, board, capacity: 4, moves: 0, remaining: .2, elapsed: 10,
  status: 'playing', selected: null, hint: null, hintPlan: [], history: [],
};
const timedOut = elapseAttempt(attempt, 1);
assert.equal(timedOut.remaining, 0);
assert.equal(timedOut.elapsed, 10.2, 'Do not score extra time beyond the actual timeout');
assert.equal(timedOut.status, 'timeout');
assert.equal(elapseAttempt(timedOut, 30), timedOut);
assert.equal(elapseAttempt(attempt, -1), attempt);
assert.equal(elapseAttempt(null, 1), null);
for (const viewport of [360, 390, 430]) {
  for (const capacity of [4, 5, 6]) {
    const g = boardGeometry(viewport, 6, capacity);
    for (let row = 1; row < capacity; row++) {
      assert.ok(g.y(row) < g.y(row - 1), 'Later array elements are visually ABOVE earlier elements');
    }
    assert.ok(g.liftY >= 0, 'Lifted nuts stay inside the visible board');
    assert.ok(g.liftY + g.nutHeight < g.tipY, 'Travel clears the top of the entire bolt');
    assert.ok(g.y(0) + g.nutHeight <= g.baseY, 'Bottom nut rests above the base');
  }
}
console.log('PASS: top-only moves and visual order, above-tip travel geometry, invalid targets, win rules, paused timing, timeout bounds.');