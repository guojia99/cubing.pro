#!/usr/bin/env python3
"""
解析 HowToCook dishes 目录下的菜谱，生成结构化 JSON 数据。
"""
import json
import re
from pathlib import Path
from typing import List, Optional

# 菜谱根目录
DISHES_ROOT = Path(__file__).resolve().parent.parent / "public" / "HowToCook" / "dishes"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "public" / "recipes.json"

# 分类映射（英文 -> 中文）
CATEGORY_NAMES = {
    "aquatic": "水产",
    "breakfast": "早餐",
    "condiment": "调味料",
    "dessert": "甜品",
    "drink": "饮料",
    "meat_dish": "荤菜",
    "semi-finished": "半成品",
    "soup": "汤",
    "staple": "主食",
    "template": "模板",
    "vegetable_dish": "素菜",
}


def remove_image_refs(text: str) -> str:
    """移除 markdown 中的图片引用，如 ![xxx](path)"""
    return re.sub(r"!\[[^\]]*\]\([^)]+\)", "", text)


def extract_description(content: str) -> str:
    """
    提取菜谱说明：第一个 # 标题下的内容，到第二个 ## 或 预估烹饪难度 为止。
    去除图片引用，保留前 150 字。
    """
    lines = content.split("\n")
    in_desc = False
    desc_parts = []

    for line in lines:
        stripped = line.strip()
        # 遇到第一个 # 标题，开始收集
        if stripped.startswith("# ") and not in_desc:
            in_desc = True
            continue
        # 遇到 ## 或 预估烹饪难度，结束
        if in_desc and (stripped.startswith("## ") or "预估烹饪难度" in stripped):
            break
        if in_desc and stripped:
            desc_parts.append(stripped)

    desc = " ".join(desc_parts)
    desc = remove_image_refs(desc)
    # 去除多余空白
    desc = re.sub(r"\s+", " ", desc).strip()
    return desc[:150] if len(desc) > 150 else desc


def extract_difficulty(content: str) -> int:
    """解析预估烹饪难度，返回星级数量 1-5"""
    match = re.search(r"预估烹饪难度[：:]\s*[★☆]+", content)
    if not match:
        return 0
    stars = len(re.findall(r"[★☆]", match.group()))
    return min(5, max(0, stars))


def extract_title(content: str) -> str:
    """提取第一个 # 标题作为菜名"""
    match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return ""


def extract_first_image(content: str, md_path: Path) -> Optional[str]:
    """
    提取 md 中第一张图片的路径，解析为相对于 HowToCook 的路径。
    返回如 dishes/aquatic/清蒸鲈鱼/清蒸鲈鱼.jpg
    """
    match = re.search(r"!\[[^\]]*\]\(([^)]+)\)", content)
    if not match:
        return None
    img_path = match.group(1).strip()
    if not img_path or img_path.startswith("http"):
        return None
    md_dir = md_path.parent
    if img_path.startswith("./"):
        img_path = img_path[2:]
    resolved = (md_dir / img_path).resolve()
    try:
        rel = resolved.relative_to(DISHES_ROOT.parent)
        return str(rel).replace("\\", "/")
    except ValueError:
        return None


def parse_recipe(md_path: Path, category: str, recipe_id: str, is_dir_recipe: bool = False) -> Optional[dict]:
    """解析单个菜谱 md 文件"""
    try:
        content = md_path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"  [WARN] 无法读取 {md_path}: {e}")
        return None

    title = extract_title(content)
    if not title:
        print(f"  [WARN] 未找到标题: {md_path}")
        return None

    description = extract_description(content)
    difficulty = extract_difficulty(content)
    first_image = extract_first_image(content, md_path)

    # 构建 md 的访问路径（相对于 /HowToCook/，即 public/HowToCook/）
    try:
        md_rel = md_path.relative_to(DISHES_ROOT.parent)
        md_rel_path = str(md_rel).replace("\\", "/")
    except ValueError:
        md_rel_path = f"dishes/{category}/{recipe_id}.md"

    has_image = bool(first_image)

    return {
        "id": recipe_id,
        "title": title,
        "description": description,
        "difficulty": difficulty,
        "category": category,
        "categoryName": CATEGORY_NAMES.get(category, category),
        "mdPath": md_rel_path,
        "hasImage": has_image,
        "coverImage": first_image if has_image else None,
    }


def collect_recipes() -> List[dict]:
    """
    遍历 dishes 目录，收集所有菜谱。
    当同一分类下存在同名菜谱（如 陈皮排骨汤.md 与 陈皮排骨汤/陈皮排骨汤.md）时，
    以有目录的那道菜为准，即优先保留目录形式的菜谱。
    """
    recipes_by_key: dict[tuple[str, str], dict] = {}  # (category, recipe_id) -> recipe
    categories = [d for d in DISHES_ROOT.iterdir() if d.is_dir()]

    for cat_path in sorted(categories):
        category = cat_path.name
        if category not in CATEGORY_NAMES:
            continue

        items = sorted(cat_path.iterdir())
        # 先处理目录菜谱（以有目录的为准），再处理单文件
        dirs = [x for x in items if x.is_dir()]
        files = [x for x in items if x.is_file() and x.suffix.lower() == ".md"]
        for item in dirs:
            md_file = item / f"{item.name}.md"
            if md_file.exists():
                recipe = parse_recipe(md_file, category, item.name, is_dir_recipe=True)
                if recipe:
                    recipes_by_key[(category, item.name)] = recipe
            else:
                md_files = list(item.glob("*.md"))
                if md_files:
                    recipe = parse_recipe(md_files[0], category, item.name, is_dir_recipe=True)
                    if recipe:
                        recipes_by_key[(category, item.name)] = recipe
        for item in files:
            recipe_id = item.stem
            key = (category, recipe_id)
            if key in recipes_by_key:
                continue  # 已有目录版本，跳过
            recipe = parse_recipe(item, category, recipe_id, is_dir_recipe=False)
            if recipe:
                recipes_by_key[key] = recipe

    return list(recipes_by_key.values())


def main():
    print(f"菜谱根目录: {DISHES_ROOT}")
    recipes = collect_recipes()
    print(f"共解析 {len(recipes)} 道菜谱")

    data = {"recipes": recipes, "categories": list(CATEGORY_NAMES.keys())}
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"已写入: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
