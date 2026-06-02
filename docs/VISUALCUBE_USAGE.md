# sr-visualizer 使用说明

基于 [tdecker91/visualcube](https://github.com/tdecker91/visualcube)（VisualCube TS）—— 一个用于生成魔方 SVG/PNG 可视化图像的 TypeScript 库。

## 安装

```bash
npm install sr-visualizer
```

## 基本用法

### 渲染 PNG 图像

```tsx
import * as SRVisualizer from 'sr-visualizer';
import { useRef, useEffect } from 'react';

const CubeViewer = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      SRVisualizer.cubePNG(containerRef.current);
    }
  }, []);

  return <div ref={containerRef} />;
};
```

### 渲染 SVG 元素

```tsx
SRVisualizer.cubeSVG(document.getElementById('cube-container'));
```

## 配置项

通过第二个参数传入配置对象：

```tsx
SRVisualizer.cubePNG(element, {
  cubeSize: 3,
  width: 128,
  height: 128,
});
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cubeSize` | `1 - 17` | `3` | 魔方阶数，N 表示 NxNxN |
| `width` | `number` | `128` | SVG 容器宽度 |
| `height` | `number` | `128` | SVG 容器高度 |
| `dist` | `1 - 100` | `5` | 投影距离 |
| `algorithm` | `string` | - | WCA 打乱公式，如 `"R U R' U'"` |
| `case` | `string` | - | 显示应用该公式后还原的魔方状态 |
| `backgroundColor` | `string` | - | 背景色（HTML 颜色代码） |
| `cubeColor` | `string` | `'black'` | 魔方底色 |
| `maskColor` | `string` | `'#404040'` | 被遮罩贴纸的颜色 |
| `cubeOpacity` | `0 - 100` | `100` | 魔方透明度（0 = 完全透明） |
| `stickerOpacity` | `0 - 100` | `100` | 贴纸透明度 |
| `view` | `string` | - | 特殊视图，如 `'plan'` |
| `viewportRotations` | `[Axis, number][]` | `[[Axis.Y, 45],[Axis.X, -34]]` | 视角旋转（轴 + 角度） |
| `mask` | `Masking` | - | 遮罩区域（`fl`, `f2l`, `ll`, `cross` 等） |
| `maskAlg` | `string` | - | 对遮罩施加的旋转操作 |
| `colorScheme` | `{ [face: Face]: string }` | 见下文 | 面到颜色的映射 |
| `stickerColors` | `string[]` | - | 按 U R F D L B 顺序的颜色数组 |
| `facelets` | `string[]` | - | 以面字母定义的魔方状态（`u`=U面贴纸, `n`=空白, `o`=朝向面, `t`=透明） |
| `arrows` | `Arrow[]` 或 `string` | - | 在魔方上绘制箭头 |

### 默认配色方案

| 面 | 颜色 |
|----|------|
| U（顶） | 黄色 yellow |
| R（右） | 红色 red |
| F（前） | 蓝色 blue |
| D（底） | 白色 white |
| L（左） | 橙色 orange |
| B（后） | 绿色 green |

## 使用示例

### 1. 带打乱公式的魔方

```tsx
import { cubePNG } from 'sr-visualizer';

cubePNG(element, {
  cubeSize: 3,
  algorithm: "R U R' U'",
  width: 200,
  height: 200,
});
```

### 2. 自定义配色

```tsx
import { cubePNG, Face } from 'sr-visualizer';

cubePNG(element, {
  colorScheme: {
    [Face.U]: '#0000F2',
    [Face.R]: '#FFA100',
    [Face.F]: '#00D800',
    [Face.D]: '#FFFFFF',
    [Face.L]: '#EE0000',
    [Face.B]: '#FEFE00',
  },
});
```

### 3. 透明效果

```tsx
cubePNG(element, {
  cubeOpacity: 12,
  stickerOpacity: 50,
});
```

### 4. 遮罩（仅显示特定层）

```tsx
import { cubePNG, Masking } from 'sr-visualizer';

cubePNG(element, {
  mask: Masking.LL,
});
```

支持的 mask 值：`fl`, `f2l`, `ll`, `cll`, `ell`, `oll`, `ocll`, `oell`, `coll`, `ocell`, `wv`, `vh`, `els`, `cls`, `cmll`, `cross`, `f2l_3`, `f2l_2`, `f2l_sm`, `f2l_1`, `f2b`, `line`

### 5. 视角旋转

```tsx
import { cubePNG, Axis } from 'sr-visualizer';

cubePNG(element, {
  viewportRotations: [
    [Axis.X, -34],
  ],
});
```

### 6. 平面视图

```tsx
cubePNG(element, {
  view: 'plan',
});
```

### 7. 高阶魔方

```tsx
cubePNG(element, {
  cubeSize: 5,
  algorithm: "R U Uw2 Bw' Dw L' F' Lw' Dw Lw' B Lw2 Bw B2 U2 L' Fw Rw D' Rw' Bw D' Rw2 L2 B L2 Bw L B' R' F' R' B' Dw2 Lw2 D2 Dw' B Lw L' R' Fw Uw2 R2 Bw' Lw' B R L' Dw2 F D2 Bw' U' Uw F' B R' D2 Bw2",
});
```

### 8. 箭头标注

```tsx
import { cubePNG, Face, Arrow } from 'sr-visualizer';

cubePNG(element, {
  arrows: [
    {
      s1: { face: Face.U, n: 0 },
      s2: { face: Face.U, n: 2 },
      scale: 10,
    },
    {
      s1: { face: Face.R, n: 6 },
      s2: { face: Face.R, n: 2 },
      s3: { face: Face.R, n: 0 },
      scale: 8,
      influence: 5,
      color: 'yellow',
    },
  ],
});
```

也支持字符串格式：

```tsx
cubePNG(element, {
  arrows: 'U0U2,U2U8,U8U0,R6R2R0-s8-i5-yellow',
});
```

### 9. 兼容旧版 URL 参数

可直接传入 php 版本的 URL，自动解析参数：

```tsx
cubePNG(element, 'visualcube.php?pzl=4&size=500&alg=R U R\'');
```

## React Hook 封装参考

```tsx
import { useEffect, useRef } from 'react';
import * as SRVisualizer from 'sr-visualizer';
import type { VisualCubeOptions } from 'sr-visualizer';

export const useCubeVisualizer = (options: VisualCubeOptions = {}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      SRVisualizer.cubePNG(ref.current, options);
    }
  }, [options]);

  return ref;
};

// 使用
const CubeComponent = ({ algorithm }: { algorithm: string }) => {
  const cubeRef = useCubeVisualizer({ algorithm, width: 200, height: 200 });
  return <div ref={cubeRef} />;
};
```

## 导出的类型

| 名称 | 说明 |
|------|------|
| `Face` | 面枚举：`U`, `R`, `F`, `D`, `L`, `B` |
| `Axis` | 轴枚举：`X`, `Y`, `Z` |
| `Masking` | 遮罩枚举 |
| `Arrow` | 箭头定义类型 |
| `cubePNG` | 渲染为 PNG |
| `cubeSVG` | 渲染为 SVG 元素 |

## 注意事项

- `cubePNG` / `cubeSVG` 会操作传入的 DOM 元素，需确保 DOM 已就绪后再调用
- 在 React 中使用时，应放在 `useEffect` 内调用，避免 SSR 或 DOM 未挂载时执行
- 魔方阶数支持 1-17，但目前仅支持标准正方体
- `viewportRotations` 中的角度为正值表示顺时针旋转，负值表示逆时针旋转
