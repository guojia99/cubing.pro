export function normalizeVisualCubeId(cube: string): string {
  const c = cube.trim().toLowerCase().replace(/\s+/g, '');
  if (c === '222' || c === '2x2' || c === '2x2x2') return '222';
  if (c === '333oh' || c === '3x3x3oh' || c === '3x3oh') return '333oh';
  if (c === '333' || c === '3x3x3' || c === '3x3') return '333';
  return c;
}

export function isVisualCubeCube(cube: string): boolean {
  const id = normalizeVisualCubeId(cube);
  return id === '333' || id === '222' || id === '333oh';
}

export function visualCubeSize(cube: string): number {
  return normalizeVisualCubeId(cube) === '222' ? 2 : 3;
}
