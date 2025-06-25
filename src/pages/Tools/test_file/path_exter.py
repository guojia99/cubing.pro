import xml.etree.ElementTree as ET

def extract_paths_from_svg(svg_file):
  tree = ET.parse(svg_file)
  root = tree.getroot()

  paths = []

  # 遍历所有 path 元素
  for path in root.iter('{http://www.w3.org/2000/svg}path'):
    d = path.get('d')
    transform = path.get('transform', '')  # 如果没有 transform，默认为空字符串
    if d:
      paths.append({"d": d, "transform": transform})
    # elif d:
    #   paths.append(d)
  for polygon in root.iter('{http://www.w3.org/2000/svg}polygon'):
    point = polygon.get('points')
    if point:
      paths.append({"points": point})


  return paths

if __name__ == "__main__":
  svg_file = "金字塔-双色图.svg"  # 替换为你的 SVG 文件路径
  extracted_paths = extract_paths_from_svg(svg_file)

  # 打印输出结果
  import json
  print(json.dumps(extracted_paths, indent=2, ensure_ascii=False))
