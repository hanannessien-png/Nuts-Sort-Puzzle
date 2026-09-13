export function boardGeometry(viewportWidth: number, columns: number, capacity: number) {
  const nutSize = Math.min(80, Math.max(58, (viewportWidth - 32) / Math.min(columns, 4) - 18));
  const cell = nutSize + 18;
  const nutHeight = nutSize * 0.55 + 2;
  const pitch = nutSize * 0.42;
  const tipY = 72;
  const rodHeight = capacity * pitch + 26;
  const baseY = tipY + rodHeight;
  return {
    nutSize, nutHeight, pitch, cell, tipY, rodHeight, baseY,
    width: columns * cell + 32,
    height: baseY + 46,
    liftY: tipY - nutHeight - 16,
    x: (column: number) => 16 + column * cell + 9,
    y: (row: number) => baseY - nutHeight - row * pitch - 3,
  };
}

export type BoardGeometry = ReturnType<typeof boardGeometry>;