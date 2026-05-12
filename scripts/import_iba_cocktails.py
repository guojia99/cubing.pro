#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从调酒单导出的 base.html 解析 IBA 鸡尾酒条目，生成 JSON，并从官网抓取主图。

依赖: pip install beautifulsoup4

示例:
  python3 scripts/import_iba_cocktails.py \\
    --base public/iba/base.html \\
    --out-json public/iba/cocktails.json \\
    --images-dir public/iba/images
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup, Tag

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def http_get(url: str, timeout: float = 60) -> bytes:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _slug_from_source_url(url: str) -> str:
    path = urlparse(url).path.strip("/").split("/")
    if path and path[-1]:
        return path[-1]
    return "unknown"


def _list_items_after_h3(card: Tag, title: str) -> list[str]:
    for h3 in card.find_all("h3"):
        if h3.get_text(strip=True) != title:
            continue
        nxt = h3.find_next_sibling()
        if nxt and nxt.name in ("ul", "ol"):
            return [li.get_text(" ", strip=True) for li in nxt.find_all("li", recursive=False)]
        # 容错：h3 与 ul 之间若有空白节点
        for sib in h3.next_siblings:
            if getattr(sib, "name", None) in ("ul", "ol"):
                return [li.get_text(" ", strip=True) for li in sib.find_all("li", recursive=False)]
    return []


def _parse_category_text(p_tag: Tag | None) -> str:
    if not p_tag:
        return ""
    text = p_tag.get_text(" ", strip=True)
    for prefix in ("分類：", "分类：", "分類:", "分类:"):
        if text.startswith(prefix):
            return text[len(prefix) :].strip()
    return text


def parse_base_html(html_path: Path) -> list[dict[str, Any]]:
    raw = html_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(raw, "html.parser")

    # 使用 CSS 选择器：新版 BS4 的 class_=callable 会对「每个 class 词」分别回调，不宜用来匹配多 class
    grid = soup.select_one("div.grid.gap-8")
    if not grid:
        raise SystemExit("未找到鸡尾酒列表容器（div.grid.gap-8）")

    cocktails: list[dict[str, Any]] = []
    for card in grid.find_all("div", recursive=False):
        if not card.get("class"):
            continue
        cl = card["class"]
        if not isinstance(cl, list) or "rounded-lg" not in cl:
            continue

        h2 = card.find("h2")
        name = h2.get_text(strip=True) if h2 else ""

        cat_p = None
        for p in card.find_all("p"):
            t = p.get_text(" ", strip=True)
            if "分類" in t or "分类" in t:
                cat_p = p
                break

        link = card.select_one('a[href*="iba-world.com/iba-cocktail/"]')
        source_url = (link.get("href") or "").strip() if link else ""

        cocktails.append(
            {
                "name": name,
                "category": _parse_category_text(cat_p),
                "ingredients": _list_items_after_h3(card, "材料"),
                "method": _list_items_after_h3(card, "調製方法"),
                "garnish": _list_items_after_h3(card, "裝飾"),
                "source_url": source_url,
                "slug": _slug_from_source_url(source_url) if source_url else "",
            }
        )

    return cocktails


def extract_hero_image_url(page_html: str) -> str | None:
    """
    与 public/iba/image.html 一致：官网主图为带 attachment-medium_large 的 img。
    """
    soup = BeautifulSoup(page_html, "html.parser")
    for img in soup.find_all("img"):
        classes = img.get("class") or []
        if not isinstance(classes, list):
            classes = [classes]
        if "attachment-medium_large" not in classes:
            continue
        src = (img.get("src") or "").strip()
        if src.startswith("http"):
            return src.split("?")[0]
    return None


def extension_from_url(url: str) -> str:
    path = urlparse(url).path
    if "." in path:
        return path.rsplit(".", 1)[-1].lower()[:8] or "img"
    return "img"


def download_image(image_url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(http_get(image_url))


def sync_image_path_and_name(rows: list[dict[str, Any]], images_dir: Path) -> None:
    """
    写入 image_name（仅文件名，如 alexander.webp）。
    若尚无 image_path 但本地已有对应图片，则补全 image_path（便于 --skip-images 仍能带上文件名）。
    """
    images_dir = images_dir.resolve()
    root = images_dir.parent
    for row in rows:
        path_val = row.get("image_path")
        if path_val:
            row["image_name"] = Path(path_val).name
            continue
        slug = (row.get("slug") or "").strip()
        if not slug:
            row["image_name"] = None
            continue
        for ext in ("webp", "jpg", "jpeg", "png", "gif"):
            p = images_dir / f"{slug}.{ext}"
            if p.is_file():
                row["image_path"] = str(p.relative_to(root))
                row["image_name"] = p.name
                break
        else:
            row["image_name"] = None


def enrich_with_images(
    rows: list[dict[str, Any]],
    images_dir: Path,
    delay_sec: float,
) -> None:
    images_dir = images_dir.resolve()

    for row in rows:
        url = row.get("source_url") or ""
        slug = row.get("slug") or ""
        row["image_url"] = None
        row["image_path"] = None

        if not url or not slug:
            continue

        ext = None
        dest = None
        for candidate_ext in ("webp", "jpg", "jpeg", "png", "gif"):
            p = images_dir / f"{slug}.{candidate_ext}"
            if p.is_file():
                ext = candidate_ext
                dest = p
                break

        if dest is not None:
            row["image_path"] = str(dest.relative_to(images_dir.parent))
            continue

        try:
            page_bytes = http_get(url)
            page_html = page_bytes.decode("utf-8", errors="replace")
            img_url = extract_hero_image_url(page_html)
            row["image_url"] = img_url
            if not img_url:
                row["image_error"] = "页面中未找到主图（attachment-medium_large）"
                time.sleep(delay_sec)
                continue

            ext = extension_from_url(img_url)
            dest = images_dir / f"{slug}.{ext}"
            download_image(img_url, dest)
            row["image_path"] = str(dest.relative_to(images_dir.parent))
        except (HTTPError, URLError, OSError, ValueError) as e:
            row["image_error"] = str(e)

        time.sleep(delay_sec)


def main() -> None:
    ap = argparse.ArgumentParser(description="解析 base.html 为 JSON 并下载 IBA 官网主图")
    ap.add_argument(
        "--base",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "public" / "iba" / "base.html",
        help="base.html 路径",
    )
    ap.add_argument(
        "--out-json",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "public" / "iba" / "cocktails.json",
        help="输出 JSON 路径",
    )
    ap.add_argument(
        "--images-dir",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "public" / "iba" / "images",
        help="图片保存目录（文件名为 {slug}.扩展名）",
    )
    ap.add_argument(
        "--skip-images",
        action="store_true",
        help="仅解析 JSON，不请求官网、不下载图片",
    )
    ap.add_argument(
        "--delay",
        type=float,
        default=0.6,
        help="两次官网请求之间的间隔（秒），避免过快",
    )
    args = ap.parse_args()

    rows = parse_base_html(args.base.resolve())
    if not args.skip_images:
        enrich_with_images(rows, args.images_dir, args.delay)
    sync_image_path_and_name(rows, args.images_dir)

    args.out_json.parent.mkdir(parents=True, exist_ok=True)
    args.out_json.write_text(
        json.dumps(rows, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"已写入 {len(rows)} 条 -> {args.out_json}")


if __name__ == "__main__":
    main()
