/** Clearance between the side travel lane and the nearest nut (clears the wider base too). */
export const LANE_GAP = 18;
/** Each bolt base is 30px wider than its nut (15px per side); keep it inside the frame. */
export const BASE_OVERHANG = 15;
/** Additional columns always go onto rows below, never off to the right. */
const MAX_PER_ROW = 4;

function rowLayout(width: number, columns: number, capacity: number, availableHeight: number, perRow: number) {
  const rows = Math.ceil(columns / perRow);
  const columnsPerRow = Math.ceil(columns / rows);
  // Every measurement scales with the pieces, so all rows fit the fixed play
  // viewport without swiping. Multi-row boards reserve ONE side lane (a piece
  // width plus clearance) so cross-row flights never pass through a stack.
  const inner = width - 2 * BASE_OVERHANG;
  const widthLimit = rows > 1
    ? (inner - LANE_GAP) / (columnsPerRow * 1.16 + 1)
    : inner / (columnsPerRow * 1.16);
  const heightLimit = availableHeight / (rows * (1.42 + capacity * 0.42));
  return { rows, columnsPerRow, nutSize: Math.max(1, Math.min(80, widthLimit, heightLimit)) };
}

export function boardGeometry(viewportWidth: number, columns: number, capacity: number, availableHeight = Infinity) {
  const width = Math.max(200, viewportWidth);
  // Pick the row arrangement that gives the largest pieces for this exact
  // viewport: wide boards on tall screens prefer more rows, short screens
  // prefer fuller rows. Ties keep fewer rows.
  let best = rowLayout(width, columns, capacity, availableHeight, Math.min(columns, MAX_PER_ROW));
  for (let perRow = Math.min(columns, MAX_PER_ROW) - 1; perRow >= 2; perRow--) {
    const candidate = rowLayout(width, columns, capacity, availableHeight, perRow);
    if (candidate.nutSize > best.nutSize + 0.5) best = candidate;
  }
  const { rows, columnsPerRow, nutSize } = best;
  const cell = nutSize * 1.16;
  const nutHeight = nutSize * 0.55;
  const pitch = nutSize * 0.42;
  const tipY = nutHeight + nutSize * 0.22;
  const rodHeight = capacity * pitch + nutSize * 0.25;
  const baseY = tipY + rodHeight;
  const rowHeight = baseY + nutSize * 0.4;
  const gridWidth = columnsPerRow * cell;
  // The grid plus (for multi-row boards) the right-hand lane is centred as one block.
  const blockWidth = rows > 1 ? gridWidth + LANE_GAP + nutSize : gridWidth;
  const gridLeft = BASE_OVERHANG + (width - 2 * BASE_OVERHANG - blockWidth) / 2;
  const lane = rows > 1 ? gridLeft + gridWidth + LANE_GAP : width - BASE_OVERHANG - nutSize;
  const rowOf = (column: number) => Math.floor(column / columnsPerRow);
  const rowTop = (column: number) => rowOf(column) * rowHeight;
  const x = (column: number) => {
    const rowCount = Math.min(columnsPerRow, columns - rowOf(column) * columnsPerRow);
    return gridLeft + ((columnsPerRow - rowCount) * cell) / 2 + (column % columnsPerRow) * cell + nutSize * 0.08;
  };
  const liftY = tipY - nutHeight - nutSize * 0.15;
  return {
    nutSize, nutHeight, pitch, cell, tipY, rodHeight, baseY, rowHeight, columnsPerRow, rows,
    width, height: rows * rowHeight, liftY, lane, rowOf, rowTop, x,
    liftAt: (column: number) => rowTop(column) + liftY,
    y: (stackRow: number, column = 0) => rowTop(column) + baseY - nutHeight - stackRow * pitch - nutSize * 0.04,
  };
}

export type BoardGeometry = ReturnType<typeof boardGeometry>;

/** Axis-aligned waypoints: lift, clear the row, use the side lane, then land. */
export function transferPath(g: BoardGeometry, from: number, to: number, toRow: number, alreadyLifted: boolean) {
  const points = [{ x: g.x(from), y: g.liftAt(from), duration: alreadyLifted ? 40 : 100 }];
  if (g.rowOf(from) !== g.rowOf(to)) {
    points.push(
      { x: g.lane, y: g.liftAt(from), duration: 90 },
      { x: g.lane, y: g.liftAt(to), duration: Math.min(240, 110 + Math.abs(g.rowOf(from) - g.rowOf(to)) * 45) },
    );
  }
  points.push(
    { x: g.x(to), y: g.liftAt(to), duration: 130 },
    { x: g.x(to), y: g.y(toRow, to), duration: 100 },
  );
  return points;
}
