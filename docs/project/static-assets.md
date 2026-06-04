# cubing.pro/public/ 静态资源索引

> 该目录为构建时原样发布的静态文件，**不是**后端 API。  
> 仅列出被业务代码引用的资源，**不**展开 `HowToCook/` 等大量子树。

## 顶层目录/文件索引

| 路径 | 类型 | 被谁使用 | 业务关键 |
|------|------|----------|----------|
| `CHANGELOG.md` | 文档 | `Changelog/index.tsx`（`fetch('/CHANGELOG.md')`） | 是 |
| `recipes.json` | 数据 | `Recipes/RecipeList.tsx`（`fetch('/recipes.json')`） | 是 |
| `tips.json` | 数据 | `KitchenSkills/KitchenSkillList.tsx`（`fetch('/tips.json')`） | 是 |
| `favicon.ico` | 图标 | 浏览器标签 | 是 |
| `logo.svg` | 品牌 | 页脚/布局 | 是 |
| `pro_icon.svg` | 品牌 | PWA 图标 | 是 |
| `CNAME` | 部署 | 自定义域名 | 是 |
| `404.svg` / `404.webp` | 资源 | 404 页面 | 否 |
| `coffee-icon.svg` | 资源 | 赞助页 | 否 |

## iba/

| 路径 | 被谁使用 |
|------|----------|
| `cocktails.json` | `Cocktails/CocktailList.tsx`（`fetch('/iba/cocktails.json')`） |

## HowToCook/

菜谱正文由页面按路径动态加载：  
`Recipes/RecipeDetail.tsx` 通过 `fetch('/HowToCook/dishes/...')` 或类似路径获取 Markdown。  
**不展开子树**（数百个 .md 文件）。

## geo/bound/

地图边界 GeoJSON，供 `WCA/PlayerComponents/WCAPlayerLitCitiesTab.tsx` 绘制选手参赛城市分布（避免 CDN 跨域）。

| 路径 | 说明 |
|------|------|
| `geo/bound/world.json` | 世界轮廓 |
| `geo/bound/twCounty2010.geo.json` | 台湾县级（可选叠加） |
| `geo/bound/100000_full.json` … `820000_full.json` | 省级 / 直辖市 / 特别行政区边界（adcode 命名） |

页面通过 `` `/geo/bound/${file}` `` 拉取；台湾细节另可能请求外部 GeoJSON URL（见组件内常量）。

## icons/

PWA 图标（128x128、192x192、512x512）。

## images/team-match/

团体赛相关图片资源。

## qrcode/

| 文件 | 被谁使用 |
|------|----------|
| `alipay.jpg` | 赞助页支付宝二维码 |
| `wechat.jpg` | 赞助页微信二维码 |

## scripts/

| 文件 | 被谁使用 |
|------|----------|
| `loading.js` | `config/config.ts` headScripts 注入，解决首次加载白屏 |

## advertisement/

广告资源目录。
