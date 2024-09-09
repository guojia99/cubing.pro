cubes = {}
cubesMap = {}

with open("../cube/cube_map.ts", "r") as f:
    data = f.read().split("\n")

    # 解析Cubes
    isCubes = False
    for i in data:
        if "Cubes Map Start" in i:
            isCubes = True
        if "Cubes Map End" in i:
            isCubes = False
        if isCubes and "=" in i and "," in i:
            # JuBaoHaoHao = "jhh",
            i = i.replace(" ", "").replace(",", "").replace("\"", "")
            kv, _, _ = i.partition("/")

            key = kv.split("=")[0]
            val = kv.split("=")[1]
            cubes[key] = val

    # 解析映射表
    dictTable = ""
    isCubes = False
    for i in data:
        if "Start CubesAttributesList" in i:
            isCubes = True
        if "End CubesAttributesList" in i:
            isCubes = False

        if isCubes and "[" not in i and "]" not in i:
            h, _, _ = i.partition("/")
            dictTable += h

    dictTable = dictTable.replace(" ", "")

    for i in dictTable.split("},"):
        cube = ""
        icon = ""
        for c in i.split(","):
            if "Cubes:Cubes." in c:
                _, _, cube = c.partition(".")
            if "Icon:" in c:
                _, _, icon = c.replace("\"", "").partition(":")
            cubesMap[cube] = icon

print(cubes)
print(cubesMap)

with open("./cube_icon_map.css", "w") as f:
    # .cubing-icon.cubing-icon-555:before {
    #     content: "\ea13" !important;
    # }
    for i in cubesMap:

        if cubes.get(i) is None:
            continue
        icon = cubesMap[i] if cubesMap[i] != "" else "ea4e"
        f.write(f".cubing-icon.cubing-icon-{cubes[i]}:before {'{'}\n")
        f.write(f"    content: \"\\{icon}\" !important;\n")
        f.write(f"{'}'}\n\n")

