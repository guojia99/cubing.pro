# 国际化架构与维护

核实日期：2026-11-18。本文以当前源码和可执行检查为准；词典齐全不等于正文、远端数据或浏览器交互均已验收。

## 七语与入口

`src/i18n/locales.ts` 是语言注册表，`Locale` 从 `SUPPORTED_LOCALES` 推导。语言菜单、存储校验、Intl 映射都使用这份注册表；不要在新页面另建两语判断。

| Locale | 菜单自称 | Intl locale |
| --- | --- | --- |
| `zh-CN` | 简体中文 | `zh-CN` |
| `en-US` | English | `en-US` |
| `ja` | 日本語 | `ja-JP` |
| `yue-Hant-HK` | 廣東話 | `zh-HK` |
| `ko` | 한국어 | `ko-KR` |
| `fr` | Français | `fr-FR` |
| `es` | Español | `es-ES` |

`src/i18n/index.ts` 将基础语言文件与 team-match、competition、puzzle、shared、shell、site-content 等领域词典合并为 **root `catalogs`**，导出 `MessageKey`、`translate` 和 `translateWithParams`。完整性测试实际导入这个合并入口，覆盖最终生效值，不能用自建 fixture 或单个分词典替代。合并后的检查无法发现已被后一个 spread 覆盖的重复定义，代码审查仍需检查 key 的归属。

`I18nProvider` 提供 `locale`、`setLocale`、`t`、`tf`。服务端和首次客户端渲染默认简体中文，挂载后读取 `cubing_pro_locale`；切换语言更新内存状态、存储和 `html.lang`，并通过 `storage` 事件同步其他标签页。localStorage getter、读写失败必须被捕获，语言切换不应依赖存储成功。非 React 模块可使用 `readStoredLocale`；不要在模块初始化时缓存用户语言。

Chakra 的 `LocaleProvider` 使用 `getIntlLocale`。`AntThemeProvider` 为七语映射 Ant Design 与 dayjs locale；粤语使用香港繁体内置组件文案。旧 Umi 页面通过 `useIntlMessage` / `useIntl` 兼容层调用词典。新增消息优先直接使用 `useI18n`，不要扩展 `locale === "zh-CN" ? 中文 : English`。

`LocalizedMetadata` 在语言或路径变化时更新文档标题与 description；比赛详情、站内选手、WCA 选手页拥有自己的异步标题。静态输出的首屏 metadata 与客户端切换后的 metadata 是两个验证点，不能只检查后者。

## 文案和正文规则

- 新增界面文案需同时提供七语 key，包含按钮、表格、空态、错误、toast、输入提示、图片 alt、标题和无障碍名称。不能用英文代替其他五语，也不能通过中文残留或 `defaultMessage` 掩盖漏译。
- 使用整句与命名参数，例如 `tf(key, { count, name })`，避免拼接各语言顺序不同的短语。占位符语法是 `{word}`，不是 ICU plural/select。七语的参数名称集合必须一致；重复次数可因语法而不同。`formatMessage.ts` 在单次插值前调用 `plurals.ts`，按 `Intl.PluralRules` 选择已审核的英语、法语、西班牙语词形；东亚语言保留原模板。当前审核了全部 299 个带参数键，其中 130 个需要复数处理，新增带参数键必须更新分类测试。
- 数量参数传有限的原生 `number`，不要预先转换为字符串；字符串数字、ID、公式和计时字符串不作复数推断。同一句包含多个数量时分别选择词形。语言中的 `one` 不等于 `count === 1`，例如法语的 0 和部分小数也属于 `one`。根 `tf`、领域 formatter、后台 hooks 与求解器诊断均使用同一格式化入口。
- 参数值是数据。`$&`、``$` ``、`$'`、花括号和魔方公式必须原样保留，单次回调替换不得再次解释参数中的占位符。数值和日期按页面语言调用 Intl，不能翻译持久化 ID、URL 或成绩编码。
- 合法专名、来源署名、邮箱、WCA ID、公式动作、DNF/DNS、ao5/ao12 等可保留原样，但不能把同句的说明文字一起豁免。界面中的中文、英文、日文等一视同仁，不能只禁中文。
- 菜谱正文与源菜名、食材来自 HowToCook，当前 `useRecipeMarkdown` 请求 `/HowToCook/...` 原文，**切换界面语言不会翻译菜谱正文**。有限的菜谱分类属于界面筛选标签，已通过 `finishing.recipeCategory.*` 七语显示，原分类值不变。来源名称、原始 Markdown、路径身份是合法源内容；外围操作和加载失败提示仍需本地化。不能把这个内容规则扩展为整个 Recipes 目录免检。
- 厨房技能正文使用 `/i18n/kitchen-skills/{locale}/index.json` 与对应 Markdown。`kitchenSkillContent.ts` 按 `category/id` 匹配译文，保留原始身份、图片基址和链接语义；新正文必须补齐七语，不能静默回退英文。
- 鸡尾酒使用 `cocktailContent.ts`：简体中文读取原始资源，其他六语读取 `/i18n/cocktails/{locale}.json`，按 slug 校验译文、材料、步骤和装饰。`originalName` / `originalIngredients` 保留源身份，显示内容使用译文，不改收藏键。
- 更新日志由 `parseChangelog.ts` 加载本地化正文资源 `/i18n/changelog/`，不能只翻译年份筛选和标题。正文资源、远端比赛名、用户输入与 API 错误不在源码字面量扫描覆盖内，需分别验证其来源和展示边界。
- 求解器保留历史诊断协议和公式来源数据，在展示边界由 `solverMessages.ts` 及词典转换。未知源名称不得通过通用正则乱翻译；新增诊断需要补齐有界映射和相应领域测试。
- API 动态正文与静态词典分开管理。可选读侧合同、资源/字段/语言绑定及源 hash/version 校验见 [站点 API 内容多语言展示合同](internationalization-content-contract.md)。`resolveLocalizedContent` 返回 `translated` / `original` / `missing`；原文或过期译文回退不能计作目标语言翻译完成。当前后端没有这些字段，helper 尚未接入生产页面，合同和单测通过不代表动态内容已七语化。

## 自动验证

不新增依赖，使用仓库已有 TypeScript、tsx、Playwright 和 Node 测试框架。`package.json` 提供 `test:i18n` 与 `check:i18n`，可接入 CI。

```bash
npm run test:i18n
node scripts/check-i18n.mjs --self-test
npm run check:i18n
npx tsx --test public/i18n/changelog/verify.test.mjs
node public/i18n/kitchen-skills/verify.mjs
./node_modules/.bin/eslint src/i18n/catalogs.test.ts scripts/check-i18n.mjs
./node_modules/.bin/tsc --noEmit --incremental false
git diff --check
```

`catalogs.test.ts` 验证：

- root catalogs 与注册表恰好七语，每语最终 key 集合相同，真实翻译函数返回该语言对应值。
- 每项是字符串、参数名匹配、无意外空串或纯空白；空值例外精确到 locale/key 并逐项说明，过期例外失败。当前仅英文两项 PR streak 后缀为空，英语语序由前置标签承担其语义。
- 注册项无重复，有可翻译语言名称、有效旗帜代码、固定 Intl 映射，保留已有存储 key。
- 非法 locale、原型属性名和非法运行时对象不能泄露继承对象或触发强制转换；未知 key 应返回 key 字符串。
- 每条带参数的真实消息接受 `$&`、``$` ``、`$'`、`$$`、数字及含花括号的字面值；未提供和继承的参数不能替换原占位符。
- SSR、七语存取、非法存储值、不存在的 storage、getter 抛错、getItem 抛错、setItem 抛错与只读失败情形。测试同步恢复原 `window` 描述符，不污染其他测试。

`check-i18n.mjs` 使用 TypeScript AST 扫描 `src` 下 JS/TS/JSX/TSX：

- 检查 JSXText、直接 JSX 字符串表达式、`label` / `placeholder` / `title` / `alt` / `description` / `caption` / `content` / `message` / `text` / `header` / `tooltip` / `okText` / `cancelText` / `emptyText` 与文本型 `aria-*` 属性及同名对象属性。
- 检查直接 `toast` / `toaster` 字符串、其常用方法、`message.success/error/...`、`notification.*` 和 alert/confirm/prompt。模板字符串、条件表达式、拼接、逻辑回退中的字面部分同样检查。普通本地 `message(key)` 描述符不是 toast。
- AST 自然排除注释和类型字符串。路径排除仅针对 root 词典目录、vendor、测试/fixture 目录和 `*.test.*` / `*.spec.*` / `*.d.*`；不会排除整个业务页面目录。纯符号、完整魔方动作序列及数字单位属于技术记法。
- 所有其他例外必须列入脚本的 `ALLOWLIST`，同时指定**精确文件路径、上下文、字面值、出现次数、逐项原因**。没有通配中文规则、没有自动生成 baseline，也没有忽略现有缺口的开关。新增相同文字的命中超过审核次数仍失败，删除或改动旧命中造成的过期例外也失败。
- 返回非零表示有未审查字面值或无效/过期例外。输出含文件、行列、类别和原文字面值。`--self-test` 仅运行检测器正反例，不能代替全仓扫描；它验证新中文与英文、无障碍属性、toast、注释、翻译调用、技术符号、数字实体和例外计数。
- 源文件语法解析失败会直接失败，不能把无法解析的页面当成扫描通过。

这是直接源码展示位置的防倒退检查，不是完整数据流分析或翻译质量认证。它不会追踪任意变量/函数返回值至 UI，也不会检查任意别名 toast、CSS `content`、JSON/Markdown 正文或 API 响应。字段与 key 齐全不能证明每条译文准确，更不能证明没有复制中文或英文到其他语言。需配合领域测试和实际七语页面检查。

例外只适用于已经核实的用途。例如 `MilestoneContent` 的中文源标签在 `Milestone.tsx` 展示前被 `wca.milestone.type.*` 覆盖，二阶 `engine/types.ts` 颜色与方法说明在 `TwoSolverView.tsx` 展示时使用词典。后续若改变这些消费路径，必须复查例外原因，不能把源文本直接显示出来。

## 本次审计与剩余缺口

首次执行未建豁免的扫描报告了 237 个候选。审查后合法专名、技术记法、翻译 key、显示前本地化的源数据逐项记录，真实缺口继续报错。工作区存在并行集成，下面是 2026-11-18 核对时的快照，修复进度以重新运行检查为准。

2026-11-18 集成核验：`npm run test:i18n` 的 43 项（根词典、复数、独立入口与真实 Provider hooks 浏览器验证、内容合同）全部通过；相关领域定向测试 18 项通过；全仓扫描为 **0 处未审核字面值、166 处审核后的精确例外、0 个 allowlist 错误**。全仓 `tsc --noEmit --incremental false` 和目标 ESLint 通过。厨房技巧 133 篇与七份索引校验、更新日志 9 项和静态路由/脚本 75 项回归通过。

使用当前源码的隔离副本执行 `SKIP_HOWTOCOOK=1 npm run build`，compile、lint/type、629/629 页面预渲染及收尾通过；保留 45 条既有构建警告，未覆盖用户 `dist`。生产浏览器严格测试覆盖七语菜单、跨标签同步、键盘、七种视口、三种 storage 禁用情形及 metadata；另完成 60 个独立上下文回归，其中 30 次延迟 chunk 加载。测试期间发现并修复 next-themes 脚本与 Chakra/Emotion 样式顺序造成的生产 hydration 错误，未屏蔽异常。最终生产测试零 `pageerror` / `console.error`；隔离 dev 在人为延迟 chunk 时曾出现 Field ID 属性 hydration 警告，最终 production 未复现。

| 核验项 | 位置 | 当前状态 |
| --- | --- | --- |
| 导出失败提示 | `src/views/Algs/AlgsListView.tsx` | 复用现有七语通用消息 `teamMatch.exportFailed`；原始异常仅通过 `console.error` 记录诊断，不向 toast 透传本地英文错误 |
| 主办选项 ID 格式 | `src/views/admin/AdminCompetitionGroupsPageView.tsx` | 新增七语 `finishing.organizerOption`，使用 `{name}` / `{id}` 参数；保留源名称和数值 ID，渲染时随当前 locale 格式化 |
| 默认语言 title/description | `src/lib/defaultMetadata.ts` 及所有导出 metadata 的 `src/app` page/layout | 统一通过 `getDefaultMetadata` 从 shell 消息生成 `zh-CN` 标题和描述；catch-all 按 route ID 查 shell key，未知路由使用 shell 未找到消息；保留根标题模板与图标 |
| 原型 key 返回非字符串 | `src/i18n/index.ts` 的翻译查找 | 当前工作区已使用自有 key 检查，对应安全测试通过；本次未修改 root 翻译入口 |
| 非法对象 locale 的强制转换 | 同上 | 当前工作区先验证 locale，对应安全测试通过；本次未修改 root 翻译入口 |

静态首屏默认中文是明确的架构选择：保留现有 URL，不新增语言路由，不做七语静态 SEO。初始 HTML、无 JavaScript 场景及不运行 JavaScript 的抓取器使用统一的 `zh-CN` metadata；挂载后由已接入的 `LocalizedMetadata` 根据 locale 与路径更新标题和 description，比赛与选手详情继续由各自页面管理异步标题。统一入口复用真实 shell 消息，不通过搬移重复字面值或增加扫描豁免规避检查；首屏与 hydration 后结果仍需分别验收。

初次发现的 `Scroll to top` 和绘图下载按钮英文 aria-label 已修复，不能为它们保留过期例外。复数规则和内容合同测试是工程完整性检查，不替代母语人工审校；远端正文及图片内嵌文字仍需按来源独立验收。

## 维护与人工验收

1. 在正确的领域词典补齐七语并确认 root 真正合并，保留 key、占位符与业务 ID 的边界；避免同一 key 在多个 spread 中被覆盖。
2. 页面使用 `t` / `tf`，领域格式化器订阅当前 locale。不要把已翻译的 UI 文字存入持久化状态作为后续逻辑条件。
3. 运行 root 测试与扫描。如果是专名或技术数据，逐项检查实际消费路径再增加精确例外和原因；普通 UI 漏译应修正文案调用。已有 allowlist 不是迁移债务清单。
4. 运行该领域单元测试。语言菜单可在已有本地服务上执行 `node src/i18n/i18n.browser.test.mjs`，默认 `http://127.0.0.1:3000/settings/`，通过 `I18N_TEST_URL` 覆盖；测试要求本机地址并拦截 API/外部请求。严格检查 storage 禁用时的未捕获异常、hydration 和控制台错误，不能增加异常白名单来制造通过。
5. 实际检查七语：切换、刷新、跨标签同步、键盘操作、菜单焦点、窄屏长文本、html.lang、标题/description、表格/日历、日期数字、toast、错误、空态、aria 文本与正文资源。静态输出需分别验证首屏 HTML 与 hydration 后结果；内容页检查图片和内链仍指向原始身份。
6. 更新正文时检查七语资源 key/slug/category/id 与源内容一一对应，检查取消请求、失败提示和旧语言内容不闪回。保留署名、来源和许可证；不要直接覆盖上游 vendor 文件。
