# Welcome — 欢迎页

## 1. 功能概述

首页展示致谢区块、广告轮播和外链快捷入口。

## 2. implType 判定依据

- `ThanksSection.tsx`：import `getAcknowledgments`（`/public/acknowledgments`）、`apiGetWCAPersonProfile`（WCA 官方 API 获取头像）
- `AdvertisementCarousel.tsx`：无 import，读取本地广告配置
- `ExternalLinksHomeSection.tsx`：import `getOtherLinks`

**结论：hybrid** — 有 API 调用但失败不影响整体展示。

## 3. 用户流程

进入首页 → 并行加载致谢列表 + 外链列表 → 渲染轮播和链接卡片。

## 4. 页面与组件树

```
Welcome.tsx
├── ThanksSection.tsx
│   └── getAcknowledgments → /public/acknowledgments
├── AdvertisementCarousel.tsx
│   └── Advertisement/config.ts
└── ExternalLinksHomeSection.tsx
    └── getOtherLinks → /public/otherLinks
```

## 5. 状态与数据

无 localStorage。全部为运行时请求。

## 6. 接口契约

| 函数 | 端点 | 见 |
|------|------|------|
| `getAcknowledgments` | `GET /public/acknowledgments` | [public-api.md](../../api/public-api.md) |
| `getOtherLinks` | `GET /public/otherLinks` | [public-api.md](../../api/public-api.md) |
| `apiGetWCAPersonProfile` | `worldcubeassociation.org/api/v0/persons/{wcaID}` | [frontend-services.md](../../api/frontend-services.md) |

## 7. 限制与待办

- 广告轮播内容为本地配置，未走后台管理
