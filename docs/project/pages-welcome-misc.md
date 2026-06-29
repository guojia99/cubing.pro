# pages — 欢迎页与通用页面

> 路径：`cubing.pro/src/pages/`

## 目录树

```
pages/
├── 404.tsx                        # 404 兜底
├── Welcome.tsx                    # 欢迎页容器
├── Welcome/                       # 欢迎页子组件
│   ├── ThanksSection.tsx          # 致谢区块
│   ├── AdvertisementCarousel.tsx # 广告轮播
│   └── ExternalLinksHomeSection.tsx # 首页外链
├── Settings.tsx                   # 设置页
├── Changelog/
│   └── index.tsx                  # 更新日志（加载 /CHANGELOG.md）
├── BuyCoffee/
│   └── index.tsx                  # 赞助页（QR code）
├── ExternalLinks/
│   ├── ExternalLinksPage.tsx      # 外链聚合页
│   ├── ExternalLinksHomeSection.tsx # 首页外链区块
│   ├── ExternalLinksGroupedView.tsx # 分组视图
│   ├── ExternalLinkCard.tsx       # 外链卡片
│   └── utils.ts                   # 外链工具
├── Advertisement/
│   ├── index.tsx                  # 广告页
│   └── config.ts                  # 广告配置
├── UserData/
│   └── PersonalKvList.tsx          # 个人 KV 数据管理
└── Tests/
    └── Test.tsx                   # 测试占位页
```

## 功能职责

| 组件 | 路由 | implType | 说明 |
|------|------|----------|------|
| `Welcome.tsx` | `/welcome` | hybrid | 委托 ThanksSection（API）+ AdvertisementCarousel（纯前端）+ ExternalLinksHomeSection（API） |
| `Changelog/index.tsx` | `/changelog` | frontend-only | `fetch('/CHANGELOG.md')` → Markdown 渲染 |
| `BuyCoffee/index.tsx` | `/buy-coffee` | frontend-only | 展示打赏二维码 |
| `ExternalLinksPage.tsx` | `/external-links` | api-driven | 加载外链列表并分组展示 |
| `Settings.tsx` | `/settings` | hybrid | UI 配置 → localStorage + 后端 KV 同步 |
| `PersonalKvList.tsx` | `/user/kv-data` | api-driven | 用户 KV 增删查 |
| `404.tsx` | `*` | frontend-only | 兜底 |
| `Test.tsx` | `/test` | frontend-only | 测试占位 |
