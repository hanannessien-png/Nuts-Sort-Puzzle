export function boardGeometry(viewportWidth: number, columns: number, capacity: number, availableHeight = Infinity) {
  const width = Math.max(240, viewportWidth);
  const maxColumns = columns <= 4 ? Math.min(columns, width < 300 ? 3 : 4) : columns <= 6 ? 3 : 4;
  const rows = Math.ceil(columns / maxColumns);
  const columnsPerRow = Math.ceil(columns / rows);
  // Side lanes let transfers between rows avoid passing through other stacks.
  const widthLimit = (width - 24 - columnsPerRow * 14) / (columnsPerRow + (rows > 1 ? 2 : 0));
  const heightLimit = (availableHeight / rows - 72) / (0.55 + capacity * 0.42);
  const nutSize = Math.min(80, widthLimit, Math.max(42, heightLimit));
  const cell = nutSize + 14;
  const nutHeight = nutSize * 0.55 + 2;
  const pitch = nutSize * 0.42;
  const tipY = nutHeight + 18;
  const rodHeight = capacity * pitch + 20;
  const baseY = tipY + rodHeight;
  const rowHeight = baseY + 32;
  const rowOf = (column: number) => Math.floor(column / columnsPerRow);
  const rowTop = (column: number) => rowOf(column) * rowHeight;
  const x = (column: number) => {
    const rowCount = Math.min(columnsPerRow, columns - rowOf(column) * columnsPerRow);
    return (width - rowCount * cell) / 2 + (column % columnsPerRow) * cell + 7;
  };
  const liftY = tipY - nutHeight - 12;
  return {
    nutSize, nutHeight, pitch, cell, tipY, rodHeight, baseY, rowHeight, columnsPerRow, rows,
    width, height: rows * rowHeight, liftY, rowOf, rowTop, x,
    liftAt: (column: number) => rowTop(column) + liftY,
    y: (stackRow: number, column = 0) => rowTop(column) + baseY - nutHeight - stackRow * pitch - 3,
  };
}

export type BoardGeometry = ReturnType<typeof boardGeometry>;

/** Axis-aligned waypoints: lift, clear the row, use a side lane, then land. */
export function transferPath(g: BoardGeometry, from: number, to: number, toRow: number, alreadyLifted: boolean) {
  const points = [{ x: g.x(from), y: g.liftAt(from), duration: alreadyLifted ? 70 : 180 }];
  if (g.rowOf(from) !== g.rowOf(to)) {
    const lane = (g.x(from) + g.x(to) + g.nutSize) / 2 < g.width / 2 ? 4 : g.width - g.nutSize - 4;
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