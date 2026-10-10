import assert from 'node:assert/strict';
import { ActivePlayClock, elapseAttempt } from '../game/timing.ts';
import { applyMove, isSolved } from '../game/engine.ts';
import { boardGeometry, transferPath } from '../components/boardGeometry.ts';

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
for (const viewport of [294, 334, 364, 404, 700]) {
  for (const capacity of [4, 5, 6]) {
   for (const columns of [3, 4, 5, 6, 7, 9, 12, 16]) {
    const g = boardGeometry(viewport, columns, capacity, 370);
    assert.equal(g.width, viewport, 'Board never extends sideways beyond its viewport');
    if (columns > 4) assert.ok(g.rows > 1, 'Additional columns are placed on rows BELOW, not off to the right');
    assert.ok(g.columnsPerRow <= 4, 'At most four bolts per row');
    assert.ok(g.height <= 370 + 0.001, 'Every row fits the available height without scrolling');
    for (let row = 1; row < capacity; row++) {
      assert.ok(g.y(row) < g.y(row - 1), 'Later array elements are visually ABOVE earlier elements');
    }
    assert.ok(g.liftY >= 0, 'Lifted nuts stay inside the visible board');
    assert.ok(g.liftY + g.nutHeight < g.tipY, 'Travel clears the top of the entire bolt');
    assert.ok(g.y(0) + g.nutHeight <= g.baseY, 'Bottom nut rests above the base');
    for (let from = 0; from < columns; from++) {
      assert.ok(g.x(from) - 15 >= -0.001 && g.x(from) + g.nutSize + 15 <= viewport + 0.001, 'Bolts AND their wider bases stay inside the frame');
      assert.ok(g.rowTop(from) + g.rowHeight <= g.height + 0.001);
      for (let to = 0; to < columns; to++) {
        if (from === to) continue;
        const path = transferPath(g, from, to, capacity - 1, true);
        assert.equal(path.at(-1).x, g.x(to));
        assert.equal(path.at(-1).y, g.y(capacity - 1, to));
        for (const point of path) {
          assert.ok(point.x >= 0 && point.x + g.nutSize <= viewport, 'Flight remains within the viewport');
          assert.ok(point.y >= 0 && point.y + g.nutHeight <= g.height);
        }
        if (g.rowOf(from) !== g.rowOf(to)) {
          const lane = path[1].x;
          assert.equal(path[2].x, lane, 'Vertical travel stays in a clear side lane');
          for (let column = 0; column < columns; column++) {
            assert.ok(lane + g.nutSize <= g.x(column) - 18 + 0.001 || lane >= g.x(column) + g.nutSize + 18 - 0.001,
              'Row-to-row travel avoids every nut and bolt base, not just the target');
          }
        }
      }
    }
   }
  }
}
// The adaptive rows and single side lane give advanced boards bigger pieces
// than the old fixed 4-per-row layout with two lanes (same viewport).
{
  const oldNut = (w, h) => Math.min((w - 28) / (4 * 1.16 + 2), h / (3 * (1.42 + 5 * 0.42)));
  const g = boardGeometry(320, 10, 5, 600);
  assert.ok(g.nutSize > oldNut(320, 600), `10-bolt board pieces grow (${g.nutSize.toFixed(1)} vs ${oldNut(320, 600).toFixed(1)})`);
}
console.log('PASS: vertical board rows, bounded flight paths, top-only moves, above-tip geometry, invalid targets, win rules, paused timing, timeout bounds.');