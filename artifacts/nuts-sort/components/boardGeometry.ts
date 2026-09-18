export function boardGeometry(viewportWidth: number, columns: number, capacity: number, availableHeight = Infinity) {
  const width = Math.max(240, viewportWidth);
  const maxColumns = columns <= 4 ? Math.min(columns, width < 300 ? 3 : 4) : columns <= 6 ? 3 : 4;
  const rows = Math.ceil(columns / maxColumns);
  const columnsPerRow = Math.ceil(columns / rows);
  // Every measurement scales with the pieces. This guarantees all rows fit in
  // the fixed play viewport instead of relying on horizontal or vertical swipe.
  // Multi-row boards reserve a full piece-width lane plus clearance on both
  // sides so cross-row animations never pass through another stack.
  const widthLimit = rows > 1
    ? (width - 28) / (columnsPerRow * 1.16 + 2)
    : width / (columnsPerRow * 1.16);
  const heightLimit = availableHeight / (rows * (1.42 + capacity * 0.42));
  const nutSize = Math.max(1, Math.min(80, widthLimit, heightLimit));
  const cell = nutSize * 1.16;
  const nutHeight = nutSize * 0.55;
  const pitch = nutSize * 0.42;
  const tipY = nutHeight + nutSize * 0.22;
  const rodHeight = capacity * pitch + nutSize * 0.25;
  const baseY = tipY + rodHeight;
  const rowHeight = baseY + nutSize * 0.4;
  const rowOf = (column: number) => Math.floor(column / columnsPerRow);
  const rowTop = (column: number) => rowOf(column) * rowHeight;
  const x = (column: number) => {
    const rowCount = Math.min(columnsPerRow, columns - rowOf(column) * columnsPerRow);
    return (width - rowCount * cell) / 2 + (column % columnsPerRow) * cell + nutSize * 0.08;
  };
  const liftY = tipY - nutHeight - nutSize * 0.15;
  return {
    nutSize, nutHeight, pitch, cell, tipY, rodHeight, baseY, rowHeight, columnsPerRow, rows,
    width, height: rows * rowHeight, liftY, rowOf, rowTop, x,
    liftAt: (column: number) => rowTop(column) + liftY,
    y: (stackRow: number, column = 0) => rowTop(column) + baseY - nutHeight - stackRow * pitch - nutSize * 0.04,
  };
}

export type BoardGeometry = ReturnType<typeof boardGeometry>;

/** Axis-aligned waypoints: lift, clear the row, use a side lane, then land. */
export function transferPath(g: BoardGeometry, from: number, to: number, toRow: number, alreadyLifted: boolean) {
  const points = [{ x: g.x(from), y: g.liftAt(from), duration: alreadyLifted ? 70 : 180 }];
  if (g.rowOf(from) !== g.rowOf(to)) {
    const lane = (g.x(from) + g.x(to) + g.nutSize) / 2 < g.width / 2 ? 0 : g.width - g.nutSize;
    points.push(
      { x: lane, y: g.liftAt(from), duration: 150 },
      { x: lane, y: g.liftAt(to), duration: Math.min(350, 160 + Math.abs(g.rowOf(from) - g.rowOf(to)) * 70) },
    );
  }
  points.push(
    { x: g.x(to), y: g.liftAt(to), duration: 220 },
    { x: g.x(to), y: g.y(toRow, to), duration: 180 },
  );
  return points;
}