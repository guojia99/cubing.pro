#!/usr/bin/env python3
# -*- coding: utf-8 -*-
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

# 常见工具词，不加入原料列表（含同义工具如 搅拌机/破壁机/榨汁机）
TOOL_WORDS = frozenset({
    "洗菜盆", "小锅", "大锅", "炒锅", "煮锅", "蒸锅", "微波炉", "烤箱", "压汁器",
    "擀面杖", "电饭煲", "电压力锅", "高压锅", "大碗", "小碗", "锅", "碗",
    "搅拌机", "破壁机", "榨汁机", "料理搅拌机", "定时器", "漏勺", "盆", "菜刀",
    "笊篱", "锅铲", "铲子", "刮刀", "搅拌盆",
    "菜刀一个", "笊篱一个", "锅铲一个", "盆两个", "额外的盆",  # 带量词的工具
    "铜锅", "砂锅", "铝锅", "铁锅",
    "空气炸锅",
    # 厨房用具（易被误解析为原料）
    "蒸笼", "砧板", "塑料盘", "塑料盆", "一次性手套", "厨房纸", "蒸鱼盘子",
    "削皮刀", "防烫盘夹", "平底煎锅", "厨房用夹", "密封袋", "量杯", "厨房秤",
    "大不锈钢碗", "刷子", "锡纸", "保鲜膜", "微波炉专用盖", "模具", "瓦罐",
    "砵", "深锅", "吸油纸", "小铁盆", "筷子", "牙签", "硅油纸",
    # 更多工具（纱布、量具、厨具等）
    "纱布", "塑料杯", "刨丝器", "厚底锅", "克称", "克数称", "厨房秤",
    "打蛋器", "裱花嘴", "裱花袋", "烤盘", "烤架", "油纸", "烘焙纸",
    "温度计", "密封玻璃", "陶瓷容器", "玻璃容器", "密封容器",
    # 锅具、厨电、器皿
    "平底锅", "宽口平底锅", "煎锅", "电锅", "电炖锅", "炖煮锅", "电饭锅", "粥锅",
    "小奶锅", "铸铁锅", "防烫手套", "吧勺", "利口酒杯", "打火机", "过滤网",
    "面包机", "轻食机", "调理机", "果汁机", "料理机", "耐热碗", "浅盘子",
    "秒表", "保温杯", "海波杯", "高球杯", "杯子", "油锅",
    "电动打蛋器", "小刀", "簸箕", "塑料簸箕",
    "水果刀", "厨刀", "面包刀", "隔热手套",
    "锡箔纸", "锡纸", "油纸", "烘焙纸", "硅油纸",  # 各种纸（锡纸已在前面）
    "汤匙", "勺子", "茶匙", "量匙", "搅拌勺",
    "陶瓷杯", "玻璃杯", "量杯", "带刻度的杯子",  # 各种杯子（杯子、量杯已在前面）
})

# 水类不能作为原材料（沸水、温水、开水等）。注意：蜂蜜水、柠檬水、糖水等带修饰的饮料原料不在此列
WATER_WORDS = frozenset({
    "水", "沸水", "温水", "开水", "清水", "常温水", "凉白开", "凉水", "热水", "冷水",
})

# 路径/分类名等不应作为原料
INVALID_INGREDIENT_PATTERNS = (
    r"^\.\.+$",           # "..", "..."
    r"\.md\)?$",          # "蔗糖糖浆.md)", "xxx.md"
    r"^……+$",             # 省略号
    r"^水\s*[：:]?\s*$",  # "水:" 等
    r"^(condiment|breakfast|dishes|staple|drink|dessert|soup|aquatic|meat_dish|vegetable_dish|semi-finished|template)$",  # 分类名
)

# 不应作为原料的模糊/容器类描述
# 纯分类标签，非原料
INVALID_INGREDIENT_STRINGS = frozenset({
    "必备", "可选",
    "装成品的容器", "其他配料", "其他绿叶", "有一定深度的碗",
    "能放进微波炉的容器", "放得下玉米的锅", "带刻度容器", "港式奶茶过滤袋",
    "其他中号不锈钢容器", "冰淇淋模具", "面包模具",
    "其他淀粉", "其余配菜", "其余配料", "配菜",  # 模糊描述词
    "可根据口味选择增加",  # 如 "可根据口味选择增加 50g 蔬菜"
    "火候过了发苦", "不够发甜",  # 烹饪提示误解析为原料
})


# 工具/道具类模式（含这些关键词的整条视为工具）
TOOL_PATTERNS = (
    r"遇水发光",           # 遇水发光冰块
    r"过滤.*纱布",         # 过滤豆浆渣的纱布
    r"一次性.*塑料杯",     # 一次性透明塑料杯
    r"放得下.*的锅",       # 放得下玉米的锅
    r"能放进微波炉的容器", # 能放进微波炉的容器
    r"可控火候微波炉",     # 分可控火候微波炉、不可控火候微波炉
    r"不可控火候微波炉",
    r"厘米以上的炒锅",    # 32 厘米以上的炒锅
    r"普通.*锅",           # 普通的炒锅、普通铝锅
    r"家庭.*碗",           # 家庭小陶瓷碗
    r"家庭.*勺",           # 家庭铁勺子
    r"中号玻璃碗",
    r"有点深度的锅",   # 一口有点深度的锅
    r"带刻度的",       # 带刻度的杯子、带刻度容器等
)

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


def replace_markdown_links(text: str) -> str:
    """将 [text](url) 替换为 text，避免解析出 [xxx](..、..、path 等错误片段"""
    return re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)


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


def _normalize_ingredient(text: str) -> str:
    """去除括号、单位等，保留纯原料名"""
    # 必备：X、可选：X -> 提取 X（空气炸锅羊排等菜谱格式）
    text = re.sub(r"^(必备|可选)[：:]\s*", "", text)
    # 如X、例如X、如X。-> 提取 X（可根据口味选择增加 50g 蔬菜，如菠菜。）
    text = re.sub(r"^如\s*", "", text)
    text = re.sub(r"^例如\s*", "", text)
    text = re.sub(r"[。.]\s*$", "", text)
    # 需要X -> 提取 X（需要烤箱 -> 烤箱，随后会被工具过滤）
    text = re.sub(r"^需要\s*", "", text)
    # 网购X -> 提取 X（网购蛋挞液 -> 蛋挞液）
    text = re.sub(r"^网购\s*", "", text)
    # 其余配菜例如X、其他配料如X -> 提取 X（仅当有 例如/如 时）
    m = re.match(r"^(其余|其他|可选)(配菜|配料)(例如|如)\s*(.+)$", text)
    if m and m.group(4) and len(m.group(4)) <= 6 and m.group(4) not in ("一些", "等等", "之类"):
        text = m.group(4)
    text = re.sub(r'^["""\u201c\u201d\uff02]+\s*|\s*["""\u201c\u201d\uff02]+$', "", text)  # 去除首尾引号，如 "土菜油"
    text = re.sub(r"^\s*or\s+", "", text, flags=re.I)  # 去除 leading "or 咖啡粉"
    text = re.sub(r"^者", "", text)  # 去除解析残留的 "者" 前缀，如 者防烫手套
    text = re.sub(r"`+", "", text)  # 去除 markdown 代码标记，如 `冰糖`
    text = re.sub(r"\*+", "", text)  # 去除 markdown 粗体，如 **糖**
    text = re.sub(r"!+", "", text)   # 去除残留的 !（来自 ![alt](url) 解析）
    text = re.sub(r"\.{2,}", "", text)  # 去除省略号，如 "卤肉...等熟肉" -> "卤肉等熟肉"
    text = re.sub(r"[\U0001F300-\U0001F9FF]", "", text)  # 去除 emoji，如 干小米椒🌶
    # 去除 "— 可用X替代" 或 "—可用黄油替代" 等替代说明，保留主原料
    text = re.sub(r"[—－\-]\s*可用[^，。\s]+替代\s*$", "", text)
    # 去除括号及其内容（含未闭合括号，如 "蔬菜（比如土豆片"）
    text = re.sub(r"[（(][^）)]*[）)]?", "", text)
    text = re.sub(r"[（(][^）)]*$", "", text)  # 未闭合括号到末尾
    text = re.sub(r"[）)]\s*$", "", text)  # 去除尾部残留括号，如 "榨汁机）"
    text = re.sub(r"：.*$", "", text)
    text = re.sub(r"[：:]\s*$", "", text)  # 去除尾部冒号，如 "水:"
    text = re.sub(r"，\s*$", "", text)  # 去除尾部逗号，如 "袋装螺蛳粉一包，"
    text = re.sub(r"，[^，]+$", "", text)  # 去除尾部 "，XXX" 说明（需在量词前，如 "袋装螺蛳粉一包，其中应该包含"）
    # 去除前置修饰/量词，如 "未过期的一袋"、"半只"、"两个"
    text = re.sub(r"^未过期的\s*", "", text)
    text = re.sub(r"^(半只|半斤|半个)\s*", "", text)
    text = re.sub(r"^(两个|两只|两袋|两包)\s*", "", text)
    text = re.sub(r"^(一袋|一包|一只)\s*", "", text)
    # 去除前置数量+单位，如 "1 袋半成品薯条"、"2cm 两段葱段"
    text = re.sub(r"^\d+(\.\d+)?\s*cm\s*(两段|两片|一段|一片|几段|几片)\s*", "", text)
    text = re.sub(r"^(两段|两片|一段|一片|几段|几片)\s*", "", text)
    text = re.sub(r"^\d+(\.\d+)?\s*(袋|个|块|根|片|包|勺|颗|坨|斤|两|克|毫升|盒|双|g|ml|kg|L)\s*", "", text, flags=re.I)
    # 去除 "各 10g" 等尾部说明
    text = re.sub(r"\s*各\s*\d+(\.\d+)?\s*(g|kg|ml|L|克|毫升)?\s*$", "", text, flags=re.I)
    # 去除中间/尾部的 数字+单位（如 "清水 720g +"、"牛奶 50-100g"、"盐 5g"），循环直到无变化
    unit_patterns = [
        r"\s+\d+(\.\d+)?\s*-\s*\d+(\.\d+)?\s*(g|kg|ml|L|克|毫升|千克)\s*$",  # 50-100g
        r"\s+\d+(\.\d+)?\s*(g|kg|ml|L|克|毫升|千克)\s*[\+\±]?\s*$",  # 720g +、600g
        r"\s+\d+(\.\d+)?\s*(g|kg|ml|L|cm|克|毫升|千克|个|块|根|片|袋|包|勺|颗|坨|盒|双)?\s*$",
        r"\d+(\.\d+)?\s*(g|kg|ml|L|克|毫升|千克)\s*$",  # 清水2000ml（无数空格）
    ]
    while True:
        prev = text
        for pat in unit_patterns:
            text = re.sub(pat, "", text, flags=re.I)
        text = re.sub(r"[：:]\s*$", "", text)  # 去除尾部冒号（单位移除后可能露出，如 "牛奶:"）
        if text == prev:
            break
    text = re.sub(r"[：:]\s*$", "", text)  # 再次去除尾部冒号（如 "牛奶:"）
    # 去除尾部量词/说明，如 "香菜一颗"、"蛋挞皮 品牌不限"
    text = re.sub(r"\s*品牌不限\s*$", "", text)
    text = re.sub(r"(一颗|一个|一包|一块|一袋|若干|适量|少许|一点)\s*$", "", text)
    # 去除 "若干吸油纸" 中的 "若干"
    text = re.sub(r"^若干\s*", "", text)
    text = re.sub(r"直径\s*\d+\s*cm\s*的", "", text)
    # 去除附加说明，如 "黑鳕鱼，带皮"、"挂面或者鲜面条也行"
    text = re.sub(r"，[^，]+$", "", text)  # 再次处理（量词移除后可能露出新的尾部说明）
    text = re.sub(r"[也]?就行?$", "", text)
    # 简化 "鸡蛋的鸡蛋清" -> "鸡蛋清"
    text = re.sub(r"^[^的]*鸡蛋的鸡蛋清$", "鸡蛋清", text)
    text = re.sub(r"\s*[?？]+\s*", " ", text)
    text = text.strip()
    return text


def _should_skip_ingredient(raw_text: str, normalized: str) -> bool:
    """判断是否应跳过该原料（水、工具、温度+水、错误格式等）"""
    # 单位/温度在前的：100°C 沸水、30°C 温水、100°C 沸水锅 等
    if re.match(r"^\d+°?C?\s*(沸水|温水|开水|清水)", raw_text.strip()):
        return True
    # 水不能作为原材料
    if normalized in WATER_WORDS:
        return True
    # 工具（含 "搅拌机（破壁机" 等因 / 分割产生的残留）
    if normalized in TOOL_WORDS:
        return True
    if any(normalized.startswith(t) for t in TOOL_WORDS if len(t) >= 2):
        return True
    if any(t in normalized for t in (
        "纱布", "塑料杯", "刨丝器", "厚底锅", "克称", "密封玻璃", "陶瓷容器", "温度计",
        "微波炉", "炒锅", "模具", "过滤网", "过滤袋", "打火机", "吧勺", "利口酒杯",
        "防烫手套", "秒表", "轻食机", "面包机", "调理机", "果汁机",
        "打蛋器", "小刀", "簸箕", "水果刀", "厨刀", "隔热手套",
        "锡箔纸", "锡纸", "汤匙", "勺子", "茶匙",
        "陶瓷杯", "玻璃杯", "带刻度的杯子",
    )):
        return True
    # "其他X"、"其余X" 类模糊描述（如 其他淀粉、其余配菜）
    if (normalized.startswith("其他") or normalized.startswith("其余")) and len(normalized) <= 8:
        return True
    # 工具类模式（遇水发光冰块、过滤豆浆渣的纱布等）
    for pat in TOOL_PATTERNS:
        if re.search(pat, raw_text) or re.search(pat, normalized):
            return True
    # 模糊/容器类描述
    if normalized in INVALID_INGREDIENT_STRINGS:
        return True
    if any(inv in normalized for inv in INVALID_INGREDIENT_STRINGS):
        return True
    # 错误格式：..、[xxx](..、.md)、路径片段
    for pat in INVALID_INGREDIENT_PATTERNS:
        if re.search(pat, normalized):
            return True
    if normalized.startswith("[") or "](.." in raw_text:
        return True
    # 烹饪提示/口感描述（发苦、发甜、火候等），非原料
    if any(k in normalized for k in ("发苦", "发甜", "火候过了", "不够发")):
        return True
    return False


def _split_and_collect(text: str, seen: set, ingredients: List[str]) -> None:
    """按 /、和、or、或 分割，去除单位，收集有效原料（≤10字），排除工具、水、错误格式"""
    # 先移除图片引用 ![alt](path)，避免解析出 "泡发好的海参!海参"
    text = remove_image_refs(text)
    # 再替换 markdown 链接为纯文本，避免解析出 [xxx](..、path 等
    text = replace_markdown_links(text)
    # 在分割前移除括号及其内容，避免括号内的 / 被误分割（如 石榴粉(Amchur/Anardana)）
    text = re.sub(r"[（(][^）)]*[）)]?", "", text)
    text = re.sub(r"[（(][^）)]*$", "", text)
    # 将 "A or B"、"A 或 B"、"A或者B" 拆分为独立选项（用分隔符统一）
    text = re.sub(r"\s+or\s+", "\0", text, flags=re.I)
    text = re.sub(r"\s*或\s*", "\0", text)
    text = re.sub(r"或者", "\0", text)
    for sep in ["/", "、", "，"]:  # 逗号也作为分隔符，如 "油，盐，生抽，蚝油"
        text = text.replace(sep, "\0")
    parts = [p.strip() for p in text.split("\0") if p.strip()]
    for p in parts:
        normalized = _normalize_ingredient(p)
        if not normalized:
            continue
        if _should_skip_ingredient(p, normalized):
            continue
        if len(normalized) <= 10 and normalized not in seen:
            seen.add(normalized)
            ingredients.append(normalized)


def _is_skip_header(text: str) -> bool:
    """是否为应跳过的分类标题（原料、工具等）"""
    t = text.strip().rstrip(":")
    if t in ("原料", "工具", "调味料", "香料", "主食材", "可选原料", "可选工具", "注", "主料", "辅料"):
        return True
    # 注：、工具： 整行跳过；主料：、辅料： 只取冒号后内容，标题本身跳过
    if re.match(r"^(注|工具)[：:]\s*", text.strip()):
        return True
    return False


def _is_ingredient_section_header(text: str) -> bool:
    """是否为原料区块的标题"""
    if re.match(r"^[\*\*]*\s*原料\s*[\*\*]*$", text.strip()):
        return True
    if re.match(r"^#+\s*原料\s*$", text.strip()):
        return True
    if "所需原料" in text or "原料" in text:
        return True
    return False


def _is_tool_section_header(text: str) -> bool:
    """是否为工具区块的标题"""
    if re.match(r"^[\*\*]*\s*工具\s*[\*\*]*$", text.strip()):
        return True
    if re.match(r"^#+\s*工具\s*$", text.strip()):
        return True
    if "所必要的工具" in text or "可选工具" in text:
        return True
    return False


def extract_ingredients(content: str) -> List[str]:
    """
    解析 ## 必备原料和工具 后的内容，提取材料列表。
    - 区分原料与工具：只解析原料，不解析工具
    - 支持 原料/工具 嵌套结构（如 百香果橙子特调.md）
    - 支持 **原料** / **工具** 分块结构（如 披萨饼皮.md）
    - 去除括号及其内容、单位（如 3000 g）
    - 按 / 和 、 分割，每个部分单独加入
    - 分割后超过10字的忽略
    """
    lines = content.split("\n")
    in_section = False
    ingredients: List[str] = []
    seen = set()
    mode = "flat"  # flat | under_ingredients | under_tools

    for line in lines:
        stripped = line.strip()
        if stripped == "## 必备原料和工具":
            in_section = True
            mode = "flat"
            continue
        if not in_section:
            continue
        if stripped.startswith("## "):
            break

        is_list = stripped.startswith("- ") or stripped.startswith("* ")
        is_under = line.startswith("  ") and is_list
        is_first = is_list and not line.startswith("  ")

        if is_first:
            text = stripped[2:].strip()
            if re.match(r"^(原料|调味料|主料|辅料)[：:]\s*.+", text):
                content = re.sub(r"^(原料|调味料|主料|辅料)[：:]\s*", "", text)
                if content:
                    _split_and_collect(content, seen, ingredients)
                continue
            if _is_skip_header(text) or text.rstrip(":").strip() in ("原料", "工具"):
                if "原料" in text or text.rstrip(":").strip() == "原料":
                    mode = "under_ingredients"
                elif "工具" in text or text.rstrip(":").strip() == "工具":
                    mode = "under_tools"
                continue
            if _is_ingredient_section_header(text):
                mode = "under_ingredients"
                continue
            if _is_tool_section_header(text):
                mode = "under_tools"
                continue
            if mode == "under_tools":
                continue
            if mode == "flat" or mode == "under_ingredients":
                _split_and_collect(text, seen, ingredients)
                mode = "flat"

        elif is_under:
            if mode == "under_tools":
                continue
            if mode == "under_ingredients":
                text = stripped[2:].strip()
                if not text or _is_skip_header(text):
                    continue
                _split_and_collect(text, seen, ingredients)

        elif stripped and not stripped.startswith("-"):
            if _is_ingredient_section_header(stripped):
                mode = "under_ingredients"
            elif _is_tool_section_header(stripped):
                mode = "under_tools"

    return ingredients


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
    ingredients = extract_ingredients(content)
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
        "ingredients": ingredients,
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
