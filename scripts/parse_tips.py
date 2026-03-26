#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
解析 HowToCook tips 目录下的厨房技能文档，生成 tips.json。
"""
import json
import re
from pathlib import Path
from typing import List, Optional

TIPS_ROOT = Path(__file__).resolve().parent.parent / "public" / "HowToCook" / "tips"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "public" / "tips.json"

TIPS_CATEGORY_NAMES = {
    "base": "基础",
    "learn": "学习",
    "advanced": "进阶",
}


def extract_title(content: str) -> str:
    """提取第一个 # 标题作为文档名"""
    match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return ""


def extract_description(content: str) -> str:
    """提取第一个 # 标题后的内容，到第二个 ## 或 150 字为止"""
    lines = content.split("\n")
    in_desc = False
    desc_parts = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# ") and not in_desc:
            in_desc = True
            continue
        if in_desc and stripped.startswith("## "):
            break
        if in_desc and stripped:
            desc_parts.append(stripped)

    desc = " ".join(desc_parts)
    desc = re.sub(r"\s+", " ", desc).strip()
    return desc[:150] if len(desc) > 150 else desc


def parse_tip(md_path: Path, category: str, tip_id: str) -> Optional[dict]:
    """解析单个 tips md 文件"""
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

    try:
        md_rel = md_path.relative_to(TIPS_ROOT.parent)
        md_rel_path = str(md_rel).replace("\\", "/")
    except ValueError:
        md_rel_path = f"tips/{category}/{tip_id}.md"

    return {
        "id": tip_id,
        "title": title,
        "description": description,
        "category": category,
        "categoryName": TIPS_CATEGORY_NAMES.get(category, category),
        "mdPath": md_rel_path,
    }


def collect_tips() -> List[dict]:
    """遍历 tips 目录，收集所有文档"""
    tips_list: List[dict] = []
    categories = set()

    def scan_dir(directory: Path, category: str):
        for item in sorted(directory.iterdir()):
            if item.is_dir():
                sub_cat = item.name
                categories.add(sub_cat)
                scan_dir(item, sub_cat)
            elif item.suffix.lower() == ".md":
                tip_id = item.stem
                tip = parse_tip(item, category, tip_id)
                if tip:
                    tips_list.append(tip)
                    categories.add(category)

    if TIPS_ROOT.exists():
        for item in sorted(TIPS_ROOT.iterdir()):
            if item.is_dir():
                cat = item.name
                categories.add(cat)
                scan_dir(item, cat)
            elif item.suffix.lower() == ".md":
                tip_id = item.stem
                tip = parse_tip(item, "base", tip_id)
                if tip:
                    tips_list.append(tip)
                    categories.add("base")

    return tips_list


def main():
    print(f"Tips 根目录: {TIPS_ROOT}")
    tips = collect_tips()
    print(f"共解析 {len(tips)} 篇厨房技能")

    categories = list(TIPS_CATEGORY_NAMES.keys())
    data = {"tips": tips, "categories": categories}
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"已写入: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
