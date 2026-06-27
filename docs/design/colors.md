# 颜色规范

Cubing Pro v4 使用 **CSS 变量单一真值**（[`src/styles/tokens.css`](../src/styles/tokens.css)）+ Chakra 语义 token（[`src/theme/index.ts`](../src/theme/index.ts)）。支持 **浅/深模式** 与 **6 套配色皮肤** 两个正交维度。

组件应优先引用语义 token（`bg` / `fg` / `accent` / `border` / `signal.*`），避免硬编码 `#fff` 与原始 `brand.600` 等色阶。

---

## 架构

```
tokens.css (:root / .light / .dark + [data-palette])
    → Chakra semanticTokens (var(--*))
    → 组件 bg="bg" color="fg" borderColor="border"
```

- **模式**：`next-themes` 在 `<html>` 上切换 `.light` / `.dark`（`storageKey: cubing-pro-theme`）
- **皮肤**：`data-palette` 在 `<html>` 上切换（`storageKey: cubing-pro-palette`）
- **设置**：[`SettingsPage`](../src/views/SettingsPage.tsx) 与顶栏 [`AppearanceMenu`](../src/components/ui/AppearanceMenu.tsx)

---

## 语义 Token 映射

| 语义 Token | CSS 变量 | 用途 |
|------------|----------|------|
| `bg` | `--background` | 页面背景 |
| `bg.muted` | `--muted` | 弱化区块 |
| `bg.elevated` | `--card` | 卡片 / 面板 |
| `bg.subtle` | `color-mix(foreground 4%, card)` | 列表行 |
| `fg` | `--foreground` | 主文字 |
| `fg.muted` | `--muted-foreground` | 副信息 |
| `fg.faint` | `--faint-foreground` | 占位 / 禁用 |
| `accent` | `--accent` | 品牌强调 |
| `accent.fg` | `--accent-foreground` | 强调底上文字 |
| `accent.soft` | `--accent-soft` | tag / 选中弱底 |
| `border` | `--border-default` | 默认边框 |
| `border.strong` | `--border-strong` | 强边框 |
| `signal.success` | `--signal-success` | 成功 |
| `signal.warning` | `--signal-warning` | 警告 |
| `signal.info` | `--signal-info` | 信息 |
| `signal.destructive` | `--destructive` | 危险 |

### 模块专用

| Token | 说明 |
|-------|------|
| `segment.*` | 分段切换（公式库等） |
| `formula.selected.*` | 公式行选中态 |
| `algs.card.*` | 公式库卡片 |
| `welcome.*` | 欢迎 / 赞助页 |

---

## 六套配色皮肤

| `data-palette` | 名称 | 色调 |
|----------------|------|------|
| `haitian`（默认） | 海天青 | 冷·青 |
| `qingdai` | 青黛 | 冷·蓝 |
| `zheshi` | 赭石 | 暖·赤 |
| `zhulu` | 竹露 | 中性偏绿 |
| `xiangye` | 缃叶 | 暖·黄 |
| `qinglian` | 青莲 | 冷·紫 |
| `rulin` | 儒林苑 | 暖·朱红（[中国色·儒林苑](https://zhongguose.com/ai/users/clf9a9c11d4547461fb1ab3)） |
| `doukou` | 豆蔻紫 | 暖·粉紫（[中国色·豆蔻紫](https://zhongguose.com/ai/users/cl242dbdf8bb6d452dbaa84)） |

状态色（`--signal-*` / `--destructive`）全皮肤共用；边框与衍生色通过 `color-mix(var(--foreground) …)` 自动跟随中性色。

---

## 衍生色规则

禁止手写 `rgba()` 中间色，一律：

```css
color-mix(in srgb, var(--accent) 12%, transparent)
color-mix(in srgb, var(--foreground) 8%, transparent)
```

---

## 图表与领域色

| 文件 | 用途 |
|------|------|
| [`src/theme/chartColors.ts`](../src/theme/chartColors.ts) | ECharts 序列色、坐标轴、tooltip |
| [`src/theme/domainColors.ts`](../src/theme/domainColors.ts) | 魔方贴纸、PK 阵营、奖牌等**故意不随皮肤**的固有色 |

---

## 页面级主题策略

| 策略 | 场景 | 做法 |
|------|------|------|
| 双主题 | 绝大多数页面 | 跟随用户 light/dark + palette |
| dark-locked | PK 大屏 | `<DarkMode>` 局部包裹 |
| light-locked | PNG 导出 | `<LightMode>` 局部包裹 |

---

## 使用示例

```tsx
<SegmentGroup.Indicator bg="segment.indicator" />
<SegmentGroup.Item color="segment.fg" _checked={{ color: "segment.fg.selected" }} />

<Box
  bg={isActive ? "formula.selected.bg" : "bg.subtle"}
  borderColor={isActive ? "formula.selected.border" : "border"}
  color={isActive ? "formula.selected.fg" : "fg"}
/>

<Button colorPalette="brand">保存</Button>
```

`colorPalette="brand"` 的 Button recipe 已映射到 `--accent` / `--accent-foreground`，会随皮肤变化。

---

## 相关文件

- 令牌真值：[`src/styles/tokens.css`](../src/styles/tokens.css)
- 主题装配：[`src/theme/index.ts`](../src/theme/index.ts)
- 完整改造说明：[`docs/color.md`](../color.md)
- 配置读写：[`src/lib/websiteUiConfig.ts`](../src/lib/websiteUiConfig.ts)
