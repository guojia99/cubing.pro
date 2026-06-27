# 配色系统全面改造 — 设计与任务文档

> 目标：把 Cubing Pro v4 现有「品牌色板 + 浅/深双模式」的配色，升级为一套**单一真值来源（Single Source of Truth）的语义令牌体系**，并在「设置」中支持用户切换**整套配色皮肤（中国传统色系）**。
>
> 参考标准：[cuberoot.me /code/tokens](https://cuberoot.me/zh/code/tokens)（令牌方法论）、[中国色 配色工具](https://zhongguose.com/ai/palettes)（皮肤取色）。

---

## 0. 现状盘点（改造起点）

| 维度 | 现状 | 问题 |
|------|------|------|
| 令牌定义 | `src/theme/index.ts`：`brand.50–950` + `ocean.*` 原始色阶 + 一批 `semanticTokens`（`bg/fg/accent/border/segment/formula/algs/welcome…`） | 语义层和原始层混用；新增模块时常直接引用 `brand.600` 等原始色，绕过语义层 |
| 模式切换 | `next-themes`（`attribute="class"`，`storageKey="cubing-pro-theme"`），`provider.tsx` 默认 `light`、`enableSystem={false}` | 只有 light/dark；无「整套皮肤」概念 |
| 设置入口 | `src/views/SettingsPage.tsx` + `src/lib/websiteUiConfig.ts`（`navTheme` / `fontSizeBase`，本地 + 云端 KV 同步） | 已有持久化骨架，可直接扩展 `palette` 字段 |
| 硬编码色 | 全站约 60+ 文件含 `#rrggbb` / `rgba()` 字面量（统计、图表、绘图、PK 大屏、公式卡片等） | 不随主题/皮肤变化；皮肤切换后会出现「孤岛色」 |
| 中间色 | 多处手写 `rgba(34,168,203,0.35)` 之类 | 应统一用 `color-mix` 从令牌推导 |

**改造不改业务逻辑**：仅调整令牌定义、主题装配、设置 UI 与取色引用。布局可按需重构，业务流程保持不变。

---

## 1. 设计原则（来自 cuberoot 标准）

1. **单一真值来源**：全站配色只从一组令牌取值。背景 / 文字 / 品牌 / 状态 / 边框五组令牌，每个都同时给出**亮、暗两套真值**。
2. **绝不硬码灰阶 / 中间色**：需要 hover 底、半透明叠加、弱化色、压暗一档时，一律用 `color-mix(in srgb, var(--token) N%, transparent|black|white)` 从令牌推导。
3. **语义优先**：组件只引用语义令牌（`bg` / `fg` / `accent` / `border` …），不直接引用 `brand.600` 等原始色阶。原始色阶只服务于令牌定义文件。
4. **皮肤是覆盖层**：用户可选的「配色主题（皮肤）」通过 `data-palette` 覆盖令牌真值；**基础令牌结构不动**，只是被皮肤盖住色值。light / dark 模式与皮肤是**两个正交维度**（2 模式 × N 皮肤）。
5. **无障碍底线**：正文与背景对比度 ≥ 4.5:1（WCAG AA），强调色/状态色在两种模式下均需达标；不靠颜色单通道传达信息。

---

## 2. 令牌体系（五组 + 衍生规则）

> 命名采用 cuberoot 的语义命名（`--background` / `--foreground` …），落到 Chakra 时映射为同名 semanticToken（见 §4）。下表为 **`claude-海天`（默认皮肤）** 的真值；其余皮肤见 §3。

### 2.1 背景与表面 `surfaces`

| 令牌 | Light | Dark | 用途 |
|------|-------|------|------|
| `--background` | `#f7fafb` | `#082533` | 页面主背景 |
| `--card` | `#ffffff` | `#0c3a4d` | 卡片 / 面板背景 |
| `--popover` | `#ffffff` | `#0e3f54` | 浮层 / 下拉 / 弹窗 |
| `--muted` | `#eef4f6` | `#0e4458` | 弱化区块背景 |

### 2.2 文字 `text`

| 令牌 | Light | Dark | 用途 |
|------|-------|------|------|
| `--foreground` | `#0c3a4d` | `#eef9fb` | 主文字 |
| `--muted-foreground` | `#156d8c` | `#a9e0eb` | 副信息 / 说明文字 |
| `--faint-foreground` | `#4aafc9` | `#4a8aa0` | 占位 / 禁用 / 弱化文字 |

配对前景：`--card-foreground` = `--popover-foreground` = `--foreground`（除非皮肤另指定）。

### 2.3 品牌强调 `brand`

| 令牌 | Light | Dark | 用途 |
|------|-------|------|------|
| `--accent` | `#1a8aad` | `#22a8cb` | 品牌强调（链接、图标、选中态底） |
| `--accent-foreground` | `#ffffff` | `#082533` | 强调底之上的文字（保证对比度） |
| `--accent-soft` | `color-mix(in srgb, var(--accent) 8%, transparent)` | `color-mix(in srgb, var(--accent) 18%, transparent)` | tag / 选中底 / 弱化强调背景 |
| `--ring` | `var(--accent)` | `var(--accent)` | focus ring |

### 2.4 状态色 `signals`（亮暗一致，可被皮肤微调）

| 令牌 | 值（L=D） | 用途 |
|------|-----------|------|
| `--signal-success` | `#5aac7e` | 成功 / 正向（PR、达标） |
| `--signal-warning` | `#d4a259` | 警告 |
| `--signal-info` | `#4a9eff` | 信息 |
| `--destructive` | `#e05c5c` | 危险 / 删除 |
| `--destructive-foreground` | `#ffffff` | 危险底之上文字 |

> 状态色承载固定语义（绿=成功、红=危险），原则上**不随皮肤大改**；皮肤仅可做 ±5% 明度微调以贴合整体调性。

### 2.5 边框 `borders`

| 令牌 | Light | Dark | 用途 |
|------|-------|------|------|
| `--border-default` | `color-mix(in srgb, var(--foreground) 12%, transparent)` | `color-mix(in srgb, var(--foreground) 14%, transparent)` | 默认边框 / 分隔线 |
| `--border-strong` | `color-mix(in srgb, var(--foreground) 22%, transparent)` | `color-mix(in srgb, var(--foreground) 24%, transparent)` | 强边框 |
| `--input` | `var(--border-default)` | `var(--border-default)` | 输入框边框 |

### 2.6 衍生色：一律 `color-mix`（禁止手算 rgba）

| 场景 | 推导公式 |
|------|----------|
| 半透明 hover 底 / 细分隔线 | `color-mix(in srgb, var(--foreground) 8%, transparent)` |
| accent 弱化（tag / 选中底） | `color-mix(in srgb, var(--accent) 12%, transparent)` |
| accent hover 压一档 | `color-mix(in srgb, var(--accent) 88%, black)` |
| accent 提亮一档（暗色 hover） | `color-mix(in srgb, var(--accent) 88%, white)` |
| 比默认略强的边框 | `color-mix(in srgb, var(--foreground) 20%, transparent)` |
| 状态色弱化底 | `color-mix(in srgb, var(--signal-success) 14%, transparent)` |

> Chakra 侧若需在 token 内引用其它 token，写法为 `color-mix(in srgb, {colors.fg} 8%, transparent)`，构建期会展开为 CSS var。

---

## 3. 皮肤（配色主题）— 中国传统色系

用户在「设置 / 外观」可选 **8 套整套皮肤**：1 套品牌默认（claude 风海天青）+ 7 套中国传统色系（取色自 [中国色](https://zhongguose.com/ai/palettes) 及用户公开调色板）。皮肤通过 `<html data-palette="…">` 覆盖 §2 的令牌真值，**与 light/dark 正交**。

切换皮肤时：仅 `--accent` 系与（可选的）中性面板色调随皮肤变；`--signal-*` 保持语义恒定；边框、衍生色因基于 `color-mix(--foreground …)` 会**自动跟随**新中性色。

### 3.1 皮肤总表（accent 真值）

| `data-palette` | 名称 | 灵感（中国传统色） | accent Light | accent Dark | 中性色调倾向 |
|----------------|------|--------------------|--------------|-------------|--------------|
| `haitian`（默认） | 海天青 | 蔚蓝 / 海天 | `#1a8aad` | `#22a8cb` | 冷·青 |
| `qingdai` | 青黛 | 靛青 `#1685a9` / 黛 `#4a4266` / 群青 `#2e59a7` | `#1e5fa8` | `#4f8fdb` | 冷·蓝 |
| `zheshi` | 赭石 | 赤 / 朱砂 `#ed5126` / 陶土 terracotta | `#b8553a` | `#d97757` | 暖·赤 |
| `zhulu` | 竹露 | 竹青 `#789262` / 石绿 `#57c3c2` / 葱青 | `#3f7d57` | `#5aac7e` | 中性偏绿 |
| `xiangye` | 缃叶 | 缃色 `#f0c239` / 琥珀 `#ca6924` / 秋香 `#d9b611` | `#a8761a` | `#d4a259` | 暖·黄 |
| `qinglian` | 青莲 | 青莲 `#8d4bbb` / 黛紫 `#574266` / 紫檀 | `#6b4a9c` | `#9a6dd7` | 冷·紫 |
| `rulin` | 儒林苑 | [朱红 `#ed5126`](https://zhongguose.com/ai/users/clf9a9c11d4547461fb1ab3) scheme | `#bc1b00` | `#ed5126` | 暖·朱 |
| `doukou` | 豆蔻紫 | [豆蔻紫 `#ad6598`](https://zhongguose.com/ai/users/cl242dbdf8bb6d452dbaa84) scheme | `#854072` | `#d68bbf` | 暖·粉紫 |

### 3.2 各皮肤中性 / 文字真值

> 中性面板带极低饱和度的同色相微染（避免「纯灰孤岛」）。状态色全皮肤共用 §2.4。`--accent-foreground`、`--accent-soft`、边框均按 §2 规则自动推导，下表只列需显式覆盖的真值。

**`qingdai` 青黛**

| 令牌 | Light | Dark |
|------|-------|------|
| `--background` | `#f6f8fc` | `#0a1430` |
| `--card` | `#ffffff` | `#101d3f` |
| `--popover` | `#ffffff` | `#13224a` |
| `--muted` | `#eef1f9` | `#13214a` |
| `--foreground` | `#16223f` | `#eef1fb` |
| `--muted-foreground` | `#3a4d7a` | `#aab6da` |
| `--faint-foreground` | `#8090b5` | `#5a6a96` |
| `--accent-foreground` | `#ffffff` | `#0a1430` |

**`zheshi` 赭石**

| 令牌 | Light | Dark |
|------|-------|------|
| `--background` | `#faf6f3` | `#241611` |
| `--card` | `#ffffff` | `#2e1d16` |
| `--popover` | `#ffffff` | `#35221a` |
| `--muted` | `#f3ebe6` | `#33211a` |
| `--foreground` | `#3a2018` | `#f7ece6` |
| `--muted-foreground` | `#7a5040` | `#dcb6a6` |
| `--faint-foreground` | `#b08470` | `#8a6a5a` |
| `--accent-foreground` | `#ffffff` | `#241611` |

**`zhulu` 竹露**

| 令牌 | Light | Dark |
|------|-------|------|
| `--background` | `#f5faf6` | `#0d1f16` |
| `--card` | `#ffffff` | `#13291d` |
| `--popover` | `#ffffff` | `#173021` |
| `--muted` | `#e9f3ec` | `#163020` |
| `--foreground` | `#16321f` | `#ecf7ef` |
| `--muted-foreground` | `#3f6b4f` | `#a9d7b8` |
| `--faint-foreground` | `#7aa089` | `#5a8a6a` |
| `--accent-foreground` | `#ffffff` | `#0d1f16` |

**`xiangye` 缃叶**

| 令牌 | Light | Dark |
|------|-------|------|
| `--background` | `#fbf8f0` | `#211c0e` |
| `--card` | `#ffffff` | `#2b2413` |
| `--popover` | `#ffffff` | `#322a17` |
| `--muted` | `#f3eddd` | `#302916` |
| `--foreground` | `#352c12` | `#f7f1e0` |
| `--muted-foreground` | `#6f5d22` | `#d8c79a` |
| `--faint-foreground` | `#a8925a` | `#8a7a4a` |
| `--accent-foreground` | `#2a2207` | `#211c0e` |

**`qinglian` 青莲**

| 令牌 | Light | Dark |
|------|-------|------|
| `--background` | `#f8f6fc` | `#19102b` |
| `--card` | `#ffffff` | `#221638` |
| `--popover` | `#ffffff` | `#281b41` |
| `--muted` | `#f0ecf8` | `#261a40` |
| `--foreground` | `#261540` | `#f2ecfb` |
| `--muted-foreground` | `#54407a` | `#c3b0da` |
| `--faint-foreground` | `#9080b5` | `#6a5a96` |
| `--accent-foreground` | `#ffffff` | `#19102b` |

**`rulin` 儒林苑**（来源：[376288517 公开调色板](https://zhongguose.com/ai/users/clf9a9c11d4547461fb1ab3)）

| 令牌 | Light | Dark |
|------|-------|------|
| `--background` | `#fff8f4` | `#1a0000` |
| `--card` | `#ffffff` | `#390000` |
| `--popover` | `#ffffff` | `#5d0000` |
| `--muted` | `#ffefe6` | `#390000` |
| `--foreground` | `#390000` | `#ffc297` |
| `--muted-foreground` | `#8c0000` | `#ff9066` |
| `--faint-foreground` | `#c45a40` | `#c45a40` |
| `--accent-foreground` | `#ffffff` | `#1a0000` |

**`doukou` 豆蔻紫**（来源：[2242209295 公开调色板](https://zhongguose.com/ai/users/cl242dbdf8bb6d452dbaa84)）

| 令牌 | Light | Dark |
|------|-------|------|
| `--background` | `#fdf8fc` | `#080004` |
| `--card` | `#ffffff` | `#1e0015` |
| `--popover` | `#ffffff` | `#39002c` |
| `--muted` | `#ffecf8` | `#1e0015` |
| `--foreground` | `#1e0015` | `#ffdbff` |
| `--muted-foreground` | `#5e1c4e` | `#f2a5da` |
| `--faint-foreground` | `#bb71a5` | `#bb71a5` |
| `--accent-foreground` | `#ffffff` | `#080004` |

> 取色后**必须用对比度工具复核**（见 §8）：每套皮肤的 `--foreground` × `--background`、`--accent-foreground` × `--accent` 都要 ≥ 4.5:1（大字号控件 ≥ 3:1）。表中数值为设计初值，实施时以复核为准微调。

---

## 4. 技术架构

### 4.1 三层结构

```
[ CSS 变量层 ]  src/styles/tokens.css
   :root / .light / .dark          → 默认皮丝 haitian 的两套真值
   [data-palette="qingdai"] .light → 皮肤覆盖
   [data-palette="qingdai"] .dark
        │  （所有 --token 在此定真值，中间色用 color-mix 现算）
        ▼
[ Chakra 语义层 ]  src/theme/index.ts
   semanticTokens.colors.bg        = { value: "var(--background)" }
   semanticTokens.colors.fg        = { value: "var(--foreground)" }
   semanticTokens.colors.accent    = { value: "var(--accent)" }  …
        │  （组件只认这一层）
        ▼
[ 组件层 ]  bg="bg"  color="fg"  borderColor="border"  …
```

**要点**：模式（light/dark）由 `next-themes` 加在 `<html>` 的 `.light` / `.dark` class 决定；皮肤由 `data-palette` 决定。CSS 变量同时受这两者作用域控制，因此 Chakra semanticToken **不再需要写 `_light` / `_dark`**（除少数 Chakra 内置组件 recipe 仍需的情况），真正做到「一处定义、四象限（2×N 皮肤再 ×2 模式）自动生效」。

### 4.2 防闪烁（FOUC）

`next-themes` 已处理 `.dark`/`.light` 的预水合注入。**皮肤需自行注入**：在 `src/app/layout.tsx` 的 `<head>` 加一段内联脚本，于水合前从 `localStorage` 读取皮肤并写到 `document.documentElement.dataset.palette`，默认 `haitian`。

```html
<script>
 (function(){try{
   var p = localStorage.getItem("cubing-pro-palette") || "haitian";
   document.documentElement.dataset.palette = p;
 }catch(e){}})();
</script>
```

### 4.3 受影响文件清单

| 文件 | 改动 |
|------|------|
| `src/styles/tokens.css`（新增） | 定义所有皮肤 × 模式的 CSS 变量真值 |
| `src/theme/index.ts` | semanticTokens 改为引用 `var(--*)`；保留 `brand.*`/`ocean.*` 原始阶仅供令牌文件内部 / 历史 recipe；`globalCss` 引入 `tokens.css` |
| `src/app/layout.tsx` | 注入皮肤预水合脚本；引入 `tokens.css` |
| `src/lib/websiteUiConfig.ts` | `WebsiteUiConfig` 增加 `palette` 字段；新增 `applyPaletteToDocument` / 读写 `cubing-pro-palette` |
| `src/views/SettingsPage.tsx` | 增加「配色主题」选择器（色卡预览）；保存时写 palette + 云端 KV |
| `src/components/layout/AppHeader.tsx` | （可选）「外观」菜单：模式切换 + 皮肤快速切换 |
| `src/i18n/messages/{zh-CN,en-US}.ts` | 新增 `settings.palette.*` 文案 |
| `docs/design/colors.md` | 同步更新为新令牌体系（替换旧 `brand.x` 说明） |
| 约 60 个含硬编码色的视图/图表文件 | 按 §6 分批迁移 |

---

## 5. 设置与外观 UX

### 5.1 设置页（`SettingsPage`）

在现有「主题 / 根字号」字段后，新增「配色主题」：
- 色卡按钮展示该皮肤的 `accent + muted-foreground + foreground` 三色小样（强调 / 副色 / 文字），便于区分相近主题
- 选中即**实时预览**（写 `data-palette`），点「保存」才落本地 + 云端 KV。
- 与「主题（浅/深/跟随系统）」组合：模式与皮肤独立选择。

### 5.2 头部「外观」菜单（可选增强）

把 `ColorModeButton` 升级为下拉「外观」：上半区切换 浅/深/系统，下半区 6 个皮肤色卡，所选即时生效并持久化。与设置页共用同一套读写函数，避免状态分裂。

### 5.3 配置数据模型

```ts
// websiteUiConfig.ts
export type Palette =
  | "haitian" | "qingdai" | "zheshi" | "zhulu" | "xiangye" | "qinglian";

export type WebsiteUiConfig = {
  navTheme?: WebsiteUiNavPreference; // 既有：light | realDark | system
  fontSizeBase?: number;             // 既有
  palette?: Palette;                 // 新增，默认 "haitian"
};
```
本地 key：`cubing-pro-palette`（独立存，供预水合脚本同步读取）；同时整体序列化进既有云端 `USER_KV_KEYS.website_ui_config`。

---

## 6. 硬编码色迁移计划（分批）

> 原则：所有交互/结构色 → 语义令牌；纯装饰/数据可视化色 → 见下分类。

**分类处置**
1. **结构与交互色**（背景、文字、边框、选中、hover）：一律改语义令牌，禁止字面量。
2. **图表色**（ECharts / 统计 / 成功率热力）：抽出 `src/theme/chartColors.ts`，从令牌 + `color-mix` 派生序列色，随皮肤/模式变化。
3. **品类语义色**（魔方贴纸色、PK 阵营色、绘图调色板）：属于**领域固有色**，不纳入皮肤切换；集中到常量文件并加注释说明「故意不随主题」。
4. **公式模块**（`src/views/Algs/utils/constants.ts` 的 rgba 卡片色）：改为 `color-mix(--accent/--foreground …)` 派生，删除手写 rgba。

**批次（建议顺序）**
- B1 主题与基建：`tokens.css` + `theme/index.ts` + layout 脚本 + websiteUiConfig + 设置页（不动业务）。
- B2 高频公共：`AppHeader` / 公式库 `Algs/*` / 卡片与 segment。
- B3 数据展示：WCA 统计、`components/Data/*`、Echarts 图表（引入 `chartColors.ts`）。
- B4 大屏/绘图/PK：`TeamMatch/*`、`DrawTools/*`（领域色归类，不进皮肤）。
- B5 收尾：admin、广告位、零散视图；全局 grep 复核无遗漏字面量。

**迁移核对命令（仅交互色应清零，领域色登记白名单）**
```bash
rg "#[0-9a-fA-F]{3,6}\b|rgba?\(" src --type ts --type tsx
```

---

## 7. 主题策略（页面级）

参考 cuberoot「双主题 / dark-locked / light-locked」，为本项目落地：
- **双主题（跟随用户）**：绝大多数页面，走令牌自动翻。
- **强制深色（dark-locked）**：PK 大屏 / 直播比分等沉浸式场景（`TeamMatch` 全屏）——用 `<Box className="dark">` 局部锁定，避免浅色下大屏刺眼。
- **强制浅色（light-locked）**：导出图（`bracketExportPng` / `TonightReceipt` 等需固定底色的截图导出）——局部锁 `light`，保证导出一致。

> 锁定通过包裹容器加 `chakra-theme light/dark` class 实现（已有 `LightMode`/`DarkMode` 组件可复用），不影响全局用户选择。皮肤（`data-palette`）在锁定区仍生效，除非该场景明确要中性化。

---

## 8. 无障碍与验收

### 8.1 对比度硬指标（每套皮肤 × 每个模式都需通过）
- `--foreground` × `--background` ≥ **4.5:1**
- `--muted-foreground` × `--background` ≥ **4.5:1**（说明文字）
- `--accent-foreground` × `--accent` ≥ **4.5:1**
- `--faint-foreground` × `--background` ≥ **3:1**（仅用于占位/禁用）
- 状态色文字组合（如成功绿字在卡片底）≥ **4.5:1**

### 8.2 验收清单
- [ ] 6 皮肤 × 2 模式 = 12 组合全站可浏览无「孤岛色」。
- [ ] 切皮肤/切模式无闪烁（FOUC），刷新后保持。
- [ ] 登录用户：设置随云端 KV 同步；游客：本地持久化。
- [ ] `rg` 扫描：交互/结构色无硬编码字面量；领域色在白名单内并有注释。
- [ ] 所有对比度项通过（用 §8.1 指标核对，工具见下）。
- [ ] `prefers-reduced-motion` 下主题切换无强制动画。
- [ ] 组件只引用语义令牌，未直接引用 `brand.600` 等原始阶（令牌文件除外）。

### 8.3 工具
- 对比度：浏览器 DevTools / [WebAIM Contrast Checker]、Lighthouse Accessibility。
- 视觉回归：对 12 组合截图比对（B5 阶段）。

---

## 9. 落地里程碑

| 阶段 | 内容 | 产出 |
|------|------|------|
| M1 | §4 基建 + §2 默认皮肤令牌 + 设置页皮肤选择 | 默认皮肤跑通双模式，可切但只有 1 套皮肤 |
| M2 | §3 五套传统色皮肤 + 对比度复核 | 6 皮肤可选，全部达标 |
| M3 | §6 B2–B3 迁移（公共组件 + 图表） | 主要页面随皮肤变化 |
| M4 | §6 B4–B5 迁移 + §7 页面级策略 | 全站无孤岛色，大屏/导出按策略锁定 |
| M5 | §8 验收 + 文档同步（本文件 + `colors.md`） | 验收清单全绿 |

---

## 10. 附：默认皮肤 Chakra 映射示例

```ts
// src/theme/index.ts （节选，semanticTokens 引用 CSS 变量）
semanticTokens: {
  colors: {
    bg: {
      DEFAULT:  { value: "var(--background)" },
      muted:    { value: "var(--muted)" },
      elevated: { value: "var(--card)" },
      subtle:   { value: "color-mix(in srgb, var(--foreground) 4%, var(--card))" },
    },
    fg: {
      DEFAULT: { value: "var(--foreground)" },
      muted:   { value: "var(--muted-foreground)" },
      faint:   { value: "var(--faint-foreground)" },
    },
    accent: {
      DEFAULT:  { value: "var(--accent)" },
      fg:       { value: "var(--accent-foreground)" },
      soft:     { value: "var(--accent-soft)" },
    },
    border: {
      DEFAULT: { value: "var(--border-default)" },
      strong:  { value: "var(--border-strong)" },
    },
    // 状态、segment、formula 等同理改为 var(--*)
  },
}
```

```css
/* src/styles/tokens.css （节选） */
:root, .light {
  --background:#f7fafb; --card:#fff; --popover:#fff; --muted:#eef4f6;
  --foreground:#0c3a4d; --muted-foreground:#156d8c; --faint-foreground:#4aafc9;
  --accent:#1a8aad; --accent-foreground:#fff;
  --accent-soft:color-mix(in srgb, var(--accent) 8%, transparent);
  --ring:var(--accent);
  --signal-success:#5aac7e; --signal-warning:#d4a259;
  --signal-info:#4a9eff; --destructive:#e05c5c; --destructive-foreground:#fff;
  --border-default:color-mix(in srgb, var(--foreground) 12%, transparent);
  --border-strong:color-mix(in srgb, var(--foreground) 22%, transparent);
  --input:var(--border-default);
}
.dark {
  --background:#082533; --card:#0c3a4d; --popover:#0e3f54; --muted:#0e4458;
  --foreground:#eef9fb; --muted-foreground:#a9e0eb; --faint-foreground:#4a8aa0;
  --accent:#22a8cb; --accent-foreground:#082533;
  --accent-soft:color-mix(in srgb, var(--accent) 18%, transparent);
}
[data-palette="qingdai"].light, [data-palette="qingdai"] .light {
  --background:#f6f8fc; --card:#fff; --popover:#fff; --muted:#eef1f9;
  --foreground:#16223f; --muted-foreground:#3a4d7a; --faint-foreground:#8090b5;
  --accent:#1e5fa8; --accent-foreground:#fff;
}
[data-palette="qingdai"].dark, [data-palette="qingdai"] .dark {
  --background:#0a1430; --card:#101d3f; --popover:#13224a; --muted:#13214a;
  --foreground:#eef1fb; --muted-foreground:#aab6da; --faint-foreground:#5a6a96;
  --accent:#4f8fdb; --accent-foreground:#0a1430;
}
/* zheshi / zhulu / xiangye / qinglian 依 §3.2 表同理 */
```

---

## 11. 相关文件索引

- 令牌真值（新增）：`src/styles/tokens.css`
- 主题装配：`src/theme/index.ts`
- 模式 Provider：`src/components/ui/provider.tsx`、`src/components/ui/color-mode.tsx`
- 预水合脚本：`src/app/layout.tsx`
- 配置读写：`src/lib/websiteUiConfig.ts`、`src/config/defaultSettings.ts`
- 设置 UI：`src/views/SettingsPage.tsx`
- 头部外观入口：`src/components/layout/AppHeader.tsx`
- 文案：`src/i18n/messages/{zh-CN,en-US}.ts`
- 旧颜色规范（待同步）：`docs/design/colors.md`
