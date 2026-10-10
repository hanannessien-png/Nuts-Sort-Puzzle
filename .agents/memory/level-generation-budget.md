---
name: Level generation budget
description: Limits on raising puzzle difficulty given the on-device solver certification budget.
---

The level generator's limit is the solver time budget, not the board size. On 6-color x 5-nut boards, certified optimal solutions sit around 11-14 moves. Requiring a minimum above about 12, or scrambling much more than about 32 random moves, makes many solves hit the budget, and generation fails roughly a third of the time, even in Node. Phones are slower still.

**Why:** A first difficulty-v2 attempt (min optimum up to 16, scramble up to 40) failed most generations at level 35 and above. Lowering the scramble back toward 32 and capping the minimum at 11 brought success back to 100%. A fallback that keeps the best near-target certified board covers the rest.

**How to apply:** Make levels harder through color/nut growth and shorter time before raising min optimum or scramble. After any spec change, measure generation success for ids 1-100 in Node before shipping.
