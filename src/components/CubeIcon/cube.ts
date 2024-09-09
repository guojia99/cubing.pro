import {Cubes, CubesAttributes, CubesAttributesList, CubesAttributesMap, CubesRouteTypeNumber} from "./cube_map";

export function CubeRouteNumber(cube: Cubes) :number{
    if (cube === undefined){
        return 0
    }
    const att = CubesAttributesMap.get(cube) as CubesAttributes
    if (att === undefined){
        return 0
    }
    return CubesRouteTypeNumber(att.RouteType)
}

export const CubesCn = (c: Cubes | string) => {
    const att = CubesAttributesMap.get(c) as CubesAttributes
    if (att === undefined || att === null){
        return c + ""
    }
    return att.Cn
}

export const AllProjectList = (): Cubes[] => {
    const out :Cubes[] = []
    CubesAttributesList.forEach((k)=>{
        out.push(k.Cubes)
    })
    return out
}

export const WCAProjectList = (): Cubes[] => {
    const out :Cubes[] = []
    CubesAttributesList.forEach((k)=>{
        if (k.IsWCA){
            out.push(k.Cubes)
        }
    })
    return out
}
