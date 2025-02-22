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

  return paths

if __name__ == "__main__":
  svg_file = "sk1.svg"  # 替换为你的 SVG 文件路径
  extracted_paths = extract_paths_from_svg(svg_file)

  # 打印输出结果
  import json
  print(json.dumps(extracted_paths, indent=2, ensure_ascii=False))
