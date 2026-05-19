import { CubesAttributesMap } from './cube_map';
export const CubesCn = (c) => {
    const att = CubesAttributesMap.get(c);
    if (att === undefined || att === null) {
        return c + '';
    }
    return att.Cn;
};
//# sourceMappingURL=cube.js.map