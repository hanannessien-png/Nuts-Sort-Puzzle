---
name: Stack orientation checks
description: A recurring mismatch between bottom-to-top game arrays and top-to-bottom visual layout.
---

Verify top-of-stack behavior using screen geometry, not only the engine's array operations or container alignment.

**Why:** The engine correctly removed the final array element, but the original renderer displayed that element at the bottom. Two inspections mistook a bottom-aligned container for reversed child order. Bottom alignment positions the group; it does not reverse the children.

**How to apply:** When changing board rendering or animation, check that each successive stack row has a smaller screen Y coordinate, and that a selected nut's entire bounding box clears the rod tip. Keep the movement and renderer on the same geometry calculations; an engine-only test will miss this class of bug.

For transfers between vertically arranged rows, check the whole path, not just the lift and landing endpoints. A direct vertical or diagonal path can cross intervening stacks even when both endpoints are above their respective rod tips.