# pages — 菜谱/厨房/鸡尾酒（other/*）

> 路径：`cubing.pro/src/pages/Recipes/`、`KitchenSkills/`、`Cocktails/`

## 目录树

```
Recipes/
├── RecipeList.tsx                 # 菜谱列表
└── RecipeDetail.tsx               # 菜谱详情

KitchenSkills/
├── KitchenSkillList.tsx            # 厨房技巧列表
└── KitchenSkillDetail.tsx          # 厨房技巧详情

Cocktails/
├── CocktailList.tsx               # 鸡尾酒列表
└── CocktailDetail.tsx             # 鸡尾酒详情
```

## 功能职责

| 组件 | 路由 | implType | 数据来源 |
|------|------|----------|----------|
| `RecipeList.tsx` | `/other/recipes` | frontend-only | `fetch('/recipes.json')` + localStorage 收藏 |
| `RecipeDetail.tsx` | `/other/recipes/:category/:id` | frontend-only | `fetch('/HowToCook/dishes/...')` |
| `KitchenSkillList.tsx` | `/other/kitchen-skills` | frontend-only | `fetch('/tips.json')` |
| `KitchenSkillDetail.tsx` | `/other/kitchen-skills/:category/:id` | frontend-only | 加载 Markdown |
| `CocktailList.tsx` | `/other/cocktails` | frontend-only | `fetch('/iba/cocktails.json')` + localStorage |
| `CocktailDetail.tsx` | `/other/cocktails/:slug` | frontend-only | 从 JSON 解析 |

## localStorage keys

| key | 使用页面 | 说明 |
|-----|----------|------|
| `cubing-pro-recipes-favorites` | RecipeList | 收藏菜谱 |
| `cubing-pro-recipes-tonight-list` | RecipeList | "今晚吃什么" |
| `cubing-pro-recipes-tonight-checked` | RecipeList | 已勾选食材 |
| `cubing-pro-cocktails-favorites` | CocktailList | 收藏鸡尾酒 |
| `cubing-pro-cocktails-tonight-list` | CocktailList | "今晚喝什么" |
| `cubing-pro-cocktails-tonight-checked` | CocktailList | 已勾选食材 |
| `cubing-pro-cocktails-safety-ack-v1` | CocktailList | 酒精安全声明确认 |
| `cubing-pro-cocktail-spin-{date}` | CocktailList | 每日转盘历史 |
