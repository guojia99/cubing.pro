/** 是否使用 cubing.js Twisty 展示三阶（与路由/API 中的 cube 标识一致，如 333） */
export function isTwisty333Cube(cube: string): boolean {
  const c = cube.trim().toLowerCase().replace(/\s+/g, '');
  return c === '333' || c === '3x3x3' || c === '3x3';
}
