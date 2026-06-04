# 颜色规范

Cubing Pro v4 使用 Chakra UI v3 语义 token（定义于 `src/theme/index.ts`），支持**正常（浅色）**与**夜晚（深色）**两套配色。组件应优先引用语义 token，避免硬编码 `#fff` / `white` 与无效 token（如 `brand.solid` 仅适用于 `colorPalette="brand"` 的 Button recipe，不能直接用作 `bg`）。

---

## 品牌色板（两套模式共用）

| Token | 色值 | 用途 |
|-------|------|------|
| `brand.50` | `#e8f7fc` | 极浅背景、hover 底色 |
| `brand.100` | `#c5ebf6` | 分段切换轨道、accent.subtle |
| `brand.200` | `#9eddef` | 浅色边框 |
| `brand.400` | `#42bddc` | 深色模式强调 |
| `brand.500` | `#22a8cb` | 主色、深色模式指示条 |
| `brand.600` | `#1a8aad` | 浅色模式指示条、按钮 emphasis |
| `brand.800` | `#11526b` | 浅色正文、未选中分段文字 |
| `brand.900` | `#0c3a4d` | 浅色主文字 |
| `brand.950` | `#082533` | 深色页面背景、深色选中分段文字 |
| `ocean.50` | `#eef9fb` | 深色模式主文字 |
| `ocean.200` | `#a9e0eb` | 深色模式次要文字 |

---

## 正常模式（浅色 `_light`）

| 语义 Token | 引用 | 说明 |
|------------|------|------|
| `bg` | `canvas` `#fafafa` | 页面背景 |
| `bg.muted` | `white` | 卡片、输入区背景 |
| `bg.elevated` | `white` | 浮层、固定按钮 |
| `bg.subtle` | （Chakra 默认） | 列表行默认背景 |
| `fg` | `brand.900` | 主文字 |
| `fg.muted` | `brand.700` | 次要说明 |
| `border` | `brand.200` | 分割线、边框 |
| `accent` | `brand.500` | 链接、图标强调 |
| `segment.track` | `brand.100` | 分段切换容器背景 |
| `segment.indicator` | `brand.600` | 选中项滑块背景 |
| `segment.fg` | `brand.800` | 未选中项文字 |
| `segment.fg.selected` | `white` | 选中项文字（需在 `segment.indicator` 之上） |
| `formula.selected.bg` | `#ecfdf5` | 公式列表选中行背景 |
| `formula.selected.border` | `green.400` | 公式列表选中行边框 |
| `formula.selected.fg` | `green.700` | 公式列表选中行文字 |

### 对比度要求（浅色）

- 选中分段：**白字 + brand.600 底**，对比度 ≥ 4.5:1
- 未选中分段：**brand.800 字 + brand.100 底**
- 禁止：未选中项使用 `white` 字；禁止指示条使用 `brand.solid` 等 recipe 专用 token

---

## 夜晚模式（深色 `_dark`）

| 语义 Token | 引用 | 说明 |
|------------|------|------|
| `bg` | `brand.950` | 页面背景 |
| `bg.muted` | `brand.900` | 卡片、输入区背景 |
| `bg.elevated` | `brand.900` | 浮层 |
| `fg` | `ocean.50` | 主文字 |
| `fg.muted` | `ocean.200` | 次要说明 |
| `border` | `brand.800` | 分割线、边框 |
| `segment.track` | `brand.900` | 分段切换容器背景 |
| `segment.indicator` | `brand.500` | 选中项滑块背景 |
| `segment.fg` | `ocean.200` | 未选中项文字 |
| `segment.fg.selected` | `brand.950` | 选中项文字（浅底深字，避免纯白带光晕） |
| `formula.selected.bg` | `rgba(16, 185, 129, 0.12)` | 公式列表选中行背景 |
| `formula.selected.border` | `green.400` | 公式列表选中行边框 |
| `formula.selected.fg` | `green.300` | 公式列表选中行文字 |

### 对比度要求（深色）

- 选中分段：**brand.950 字 + brand.500 底**（或等价高对比组合）
- 未选中分段：**ocean.200 字 + brand.900 底**

---

## 公式模块专用常量

`src/views/Algs/utils/constants.ts` 中部分装饰色（卡片渐变、练习工具色块）仍使用 rgba 字面量，适用于大面积浅色卡片；**交互控件（切换、选中态）必须使用上表语义 token**，以保证深浅色一致。

| 常量 | 用途 |
|------|------|
| `ALGS_COLORS` | 列表卡片边框/背景 |
| `SET_CARD_COLORS` | 公式集分组卡片 |
| `PRACTICE_COLORS` | 练习工具面板色块 |

---

## 使用示例

```tsx
// 分段切换（公式详情弹窗）
<SegmentGroup.Indicator bg="segment.indicator" />
<SegmentGroup.Item
  color="segment.fg"
  _checked={{ color: "segment.fg.selected" }}
/>

// 公式行选中
<Box
  bg={isActive ? "formula.selected.bg" : "bg.subtle"}
  borderColor={isActive ? "formula.selected.border" : "border"}
  color={isActive ? "formula.selected.fg" : "fg"}
/>
```

---

## 相关文件

- 主题定义：`src/theme/index.ts`
- 公式详情切换：`src/views/Algs/components/AlgsModal.tsx`
- 公式模块常量：`src/views/Algs/utils/constants.ts`
