import { Cubes, CubesAttributes, CubesAttributesMap } from './cube_map';

export const CubesCn = (c: Cubes | string) => {
  const att = CubesAttributesMap.get(c) as CubesAttributes;
  if (att === undefined || att === null) {
    return c + '';
  }
  return att.Cn;
};
