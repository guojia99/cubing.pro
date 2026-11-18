# 站点 API 内容多语言展示合同（提案）

核实日期：2026-11-18。本文基于本地前端与相邻 `../cubing-pro` Go 源码，不代表线上部署或数据库核验。范围是动态内容的可选读侧扩展、选择 helper 和回退规则；没有修改后端、调用线上写接口、发布译文或接入页面。七种界面语言存在，不等于动态内容已完成七语翻译。

## 当前事实与接入缺口

| 内容 | 当前实际协议与源码 | 翻译能力现状 |
| --- | --- | --- |
| 外链 | GET `/public/otherLinks`；`public/orgs.ts`；Go `src/api/app/other_link/types.go`、`GetOtherLinks.go` | 单语言 `name`、`desc`；`groups: string[]` 是原标签，`group_map` 按原标签关联 `links[].key`；没有翻译字段 |
| 致谢 | GET `/public/acknowledgments`，直接数组；Go `src/api/app/acknowledgments/types.go`、`GetAcknowledgments.go` | 单语言 `other`；无不可变行 ID、源语言、翻译或版本字段；`wcaID` 可以为空且不是致谢行唯一身份 |
| 比赛 | GET `/public/comps/{id}`，保持 `{code,data,msg}`；前端 `comps/typings.d.ts`、Go `src/internel/database/model/competition/competition.go` | `Name`、`Illustrate`、`IllustrateHTML`、`RuleMD` 和后端 `RuleHTML` 均是单字符串，无本提案元数据；前端详情类型未声明 `RuleHTML` |

上述 Go DTO/模型没有 `translations`、`sourceLocale`、`sourceHash`、`sourceVersion`。外链也没有 `groupIds`，致谢没有拟议的 `contentId`。这些不是可直接依赖的服务端能力。现有外链/致谢 GET 从系统 KV 解码到上述 DTO；对应 Set handler 绑定 DTO 后再存 KV，不能依赖未知 JSON 属性被保留。不要向现有写接口提交此提案并声称持久化成功。

`resolveLocalizedContent` 只在 `src/lib/localizedContent.test.ts` 被调用，当前没有生产页面或 service 调用。实际链路仍是：

- `getOtherLinks` → `unwrapOtherLinks` / `sanitizeOtherLinks` → 外链 View。normalizer 重新构造四个旧字段，会丢弃顶层 `sourceLocale`、`translations`、`groupIds`；仅增补 TS 类型不能穿透它。外链分组标题、卡片名称和描述仍用原文。
- `getAcknowledgments` → `ThanksSection` 的 `thankToThanksPerson` 不保留 `other` 或翻译元数据；首页当前不展示 `other`。后台原始内容编辑也没有翻译接线。
- 比赛详情将 `Illustrate` 传给 `Markdown`，`IllustrateHTML` 传给 `EditorView`；规则页将 `RuleMD` 传给 `Markdown`。这些路径均未调用 helper。

本次允许的四个文件不足以完成后端、normalizer、页面、管理端的接线，故不修改这些路径，也不宣称完成动态内容七语展示。后续接入必须逐字段验收，不通过全局翻译界面文案代替内容翻译。

## 最小兼容扩展

共享提案类型与 helper 放在 `src/lib/localizedContent.ts`；`public/types.ts` 仅以 `import type` 引入通用类型并为旧 DTO 添加可选属性，避免 lib 反向依赖 public service。比赛提案类型也放在 lib，不扩展 `CompAPI.Data`：当前 `CreateCompReq = Data`，直接扩展会把未经支持的读侧元数据带入写协议。

```ts
type ContentTranslation<Field extends string = string> = {
  resourceId: string;
  field: Field;
  locale: Locale;
  text: string;
} & (
  | { sourceHash: string; sourceVersion?: string }
  | { sourceHash?: string; sourceVersion: string }
);
// 外层和 entry 中的 field / locale 必须同时精确匹配。
type ContentTranslations<Field extends string> = Partial<{
  [Language in Locale]: Partial<{ [Key in Field]: ContentTranslation<Key> }>;
}>;
interface ContentLocalization<Field extends string> {
  sourceLocale?: Locale;
  translations?: ContentTranslations<Field>;
}
```

保留旧 URL、响应 envelope、字段大小写、字段类型、空值/省略语义、排序和所有原文。`translations` 缺失、空对象或部分语言缺失都是正常情况，旧 payload 不需要迁移即可继续显示原文。源字段不得被译文覆盖；不得把缺失字段写成虚构译文。

目标 locale 必须使用注册表精确值：`zh-CN`、`en-US`、`ja`、`yue-Hant-HK`、`ko`、`fr`、`es`。不做 `en`、`ja-JP` 等别名推断，不回退到英语或其他目标语言。未支持的目标 locale 返回原文诊断，不抛弃源内容。

`sourceLocale` 只在可靠知道源语言时设置；不能根据界面语言、汉字、地区、作者身份猜测。未知或注册表外源语省略，结果的原文 `locale` 为 `undefined`。源语未知仍可使用绑定正确且 freshness 验证通过的译文，这不构成对源语的识别。记录多个字段源语不同则省略记录级声明，由未来适配器为单字段提供已核实的源语；不能拿某一字段的源语覆盖全部字段。

## 资源身份、字段和分组

| 对象 | `resourceId` 规范 | 可翻译字段 |
| --- | --- | --- |
| 外链条目 | `external-link:{key}`，`key` 必须由数据发布方保证稳定、唯一且不复用 | `name`、`desc`；品牌名等专名是否有正式译名需审核 |
| 外链分组标签 | 固定集合身份 `external-link-groups:site`；可扩展为其他明确命名空间 | `field` 使用 `groupIds[原标签]` 的不可变组 ID，不使用显示标签 |
| 致谢行 | `acknowledgment:{contentId}`，拟议的服务端不可变行 ID | 仅 `other`，且需发布授权与内容审核 |
| 比赛 | `competition:{id}`，规范十进制服务端数值 ID；不采用比赛名称 | `Name`、`Illustrate`、`IllustrateHTML`、`RuleMD`、`RuleHTML`；大小写敏感 |

`resourceId` 从当前资源独立构造，绝不能从待验证译文中复制。entry 中重复携带 ID、field 和 locale，用于发现错缓存、错拼接和跨字段投递，即使两个对象原文完全一样也不能互用译文。缓存键必须包含资源 ID、字段、目标 locale 和当前源 hash/version。此检查不是认证或数字签名，服务端/资源发布者的可信性仍是前提。

现有分组用原标签作为关联键，不是可保证不可变的 ID。提案增加可选 `groupIds: Record<原标签, 不可变组ID>`，只供译文定位；不改变 `groups`、`group_map`、`tops` 或 `links[].key`。组改名时必须同时迁移原标签关联和 `groupIds` 的键，但保留组 ID；删除后不能复用 ID。重复标签或重复 ID 应由发布端拒绝。尚无可信组 ID 的旧数据只能展示原标签，不能用数组位置、译文标签或临时 hash 冒充稳定 ID。

致谢中的昵称、WCA ID、头像、金额、置顶/排序均不是可翻译内容；`contentId` 是内容行身份而不是用户身份。匿名、多次捐赠、重复昵称不能合并。当前无此 ID 时 `other` 只读原文，不根据昵称或 WCA ID 配对翻译。比赛组织者、参赛者、用户输入身份、URL、邮箱、公式、计时编码、成绩值等也不能由通用 helper 翻译。用户自由文本不自动送外部翻译服务。

## Hash 和版本的严格含义

`sourceHash = "sha256:" + lowercaseHex(SHA-256(UTF-8(当前源字段字符串)))`。

- 输入是 JSON 解码后的该单个源字段，**不是** JSON 的引号/转义表示，不是整条对象，不是渲染后的 DOM 或译文。例：JSON 中 `\n` 解码为一个 LF 字符再编码 UTF-8。
- 不 trim、不合并空格、不改换行（CRLF 与 LF 不同）、不做 Unicode NFC/NFD、实体解码、HTML 净化或 Markdown 格式化。BOM 若属于字符串则计入。发布端应拒绝未配对 UTF-16 surrogate，避免跨语言编码分歧。
- `sourceHash` 必须是恰好 71 个 ASCII 字符：`sha256:` 加 64 位小写十六进制，无前后空白或换行。实现同时检查长度与 `^sha256:[a-f0-9]{64}$`，避免 JavaScript `$` 在末尾换行前匹配的例外。源文任何字节变化均使旧 hash 译文失效；无效格式属于不可验证，不算已译。hash 不证明译文正确、安全或经人工审核。
- 调用方必须对当前原文独立计算 hash，或使用受信发布流水线对同一原文快照计算且校验过的 hash。不能把 entry 的 hash 原样传作“当前 hash”。helper 同步且无 I/O，不计算 hash；错误调用方传入旧 hash/伪造 hash 时它无法发现。异步计算时须在资源、原文或 locale 变化后丢弃旧任务结果。

Node 示例（不增加浏览器 Node 依赖）：

```ts
import { createHash } from "node:crypto";
const hash = (source: string) =>
  `sha256:${createHash("sha256").update(source, "utf8").digest("hex")}`;
// hash("工具") === "sha256:5ca6730d441522017552bf309fcddbed161b77440dc3a11d9945788d802afdb3"
```

版本替代方案 `sourceVersion` 是非空字符串 opaque token，只作精确相等比较，不比较大小。允许只用版本的前提是：服务端或受信内容流水线保证每次源字段变化都原子地产生新且不复用的版本，并将当前源文与当前版本放在同一一致快照中。记录级版本必须覆盖记录内所有被翻译字段；任一字段变化应失效所有记录版本译文。源语、内容格式或影响翻译解释的元数据变化也必须更换版本。

当前比赛 `updatedAt` 只是既有更新时间，尚未证明具备上述并发、精度、所有写路径覆盖和不复用保证，不能直接当作满足合同的 `sourceVersion`。翻译条目的更新时间、前端缓存时间、构建时间或随意固定的 `v1` 同样不能作当前源版本。

至少一个 freshness 约束须通过。hash 与 version 在当前值或 entry **任一侧**出现就必须两侧都有效且相同；同时出现时全部通过才能算译文。hash 通过但 version 过期仍回退，反之亦然。缺一侧、无效或完全无 freshness 为 `source-unverified`；有效但不相等为 `translation-stale`。调用方没有可信版本时可选择只用当前源 hash，但 entry 也必须采用 hash-only 协议，不能偷偷忽略已有版本。

## 可执行合同样例

下列是拟议读响应/片段，非现有服务端响应。译文仅为结构示例，不代表生产审核或七语完整度；哈希按上文算法从所示原文实算。

外链：增加的属性都是可选的，原分组与条目关联不变。

```json
{
  "tops": ["timer"],
  "groups": ["工具"],
  "group_map": {"工具": ["timer"]},
  "groupIds": {"工具": "tools-01"},
  "sourceLocale": "zh-CN",
  "translations": {
    "en-US": {
      "tools-01": {
        "resourceId": "external-link-groups:site", "field": "tools-01", "locale": "en-US",
        "text": "Tools",
        "sourceHash": "sha256:5ca6730d441522017552bf309fcddbed161b77440dc3a11d9945788d802afdb3"
      }
    }
  },
  "links": [{
    "key": "timer", "name": "魔方工具", "desc": "在线计时与练习",
    "url": "https://example.invalid", "icon": "", "icon_url": "",
    "sourceLocale": "zh-CN",
    "translations": {
      "en-US": {
        "desc": {
          "resourceId": "external-link:timer", "field": "desc", "locale": "en-US",
          "text": "Online timing and practice",
          "sourceHash": "sha256:b7cee63864c94849a187330563a6938914d34dca1c41032c6dbd72774698cec8"
        }
      }
    }
  }]
}
```

`name` 没有译文则返回原名；`fr` 没有译文则返回原描述。组标题的调用使用 `original: data.groups[0]`、`field: data.groupIds[data.groups[0]]` 和集合资源 ID，渲染标题可用结果文本，但分组查找仍使用原标签。

致谢：需要未来服务端先提供稳定 `contentId`。这里省略未知源语，不推断为中文。

```json
{
  "contentId": "thanks-8", "wcaID": "", "nickname": "Example", "amount": 0,
  "avatar": "", "other": "感谢支持",
  "translations": {
    "en-US": {
      "other": {
        "resourceId": "acknowledgment:thanks-8", "field": "other", "locale": "en-US",
        "text": "Thank you for your support",
        "sourceHash": "sha256:8c11e9a49ccc14c0b4a2de25356028de836804fe39bfaf230d9fa79c67926292"
      }
    }
  }
}
```

比赛：下例仅为未来 `data` 的增量片段，其他字段和外层 envelope 保留原样。各源格式独立绑定，不用 Markdown 的 hash 验证 HTML。

```json
{
  "id": 42,
  "RuleMD": "## 规则\n每人五次尝试。",
  "IllustrateHTML": "<p>比赛说明</p>",
  "sourceLocale": "zh-CN",
  "translations": {
    "en-US": {
      "RuleMD": {
        "resourceId": "competition:42", "field": "RuleMD", "locale": "en-US",
        "text": "## Rules\nFive attempts per person.",
        "sourceHash": "sha256:2d26d95ec9dbaa6f41e198633a0debd8a83fb897411a57a8336a2f3562e5ece7"
      },
      "IllustrateHTML": {
        "resourceId": "competition:42", "field": "IllustrateHTML", "locale": "en-US",
        "text": "<p>Competition information</p>",
        "sourceHash": "sha256:9ce15435e17f4fab2d6853da0f28e4312a598cb16e7212dc42102d43de74feb5"
      }
    }
  }
}
```

未来调用示例（目前未接线）：

```ts
const selected = resolveLocalizedContent({
  resourceId: `external-link:${link.key}`,
  original: link.desc,
  sourceLocale: link.sourceLocale,
  locale,
  field: "desc",
  translations: link.translations,
  sourceHash: independentlyComputedCurrentDescHash,
});
// 保留 link.desc 与 selected.status/reason；展示层按既有纯文本组件显示 selected.text。
```

版本协议示例：在已满足版本前提且适配器持有当前 `sourceVersion: "revision-42"` 时，entry `{resourceId:"competition:42",field:"RuleMD",locale:"fr",text:"...",sourceVersion:"revision-42"}` 可以通过；当前版本变成 `revision-43` 则过期。这里的 token 仅为示例，不是当前 API 新增的字段。

## 返回值和诊断

helper 不联网、不自动翻译、不写存储、不改输入、不净化 HTML，也不检查译文语义或发布审批。它只接受由调用方提供的单个原字段与当前身份/freshness。

| 返回 | 语义与处理 |
| --- | --- |
| `translated` | ID、字段、locale 精确相符，译文为非空字符串，且 freshness 全部验证通过；`text` 完整保留原字节含空白，`locale` 为目标语 |
| `original` | 保留原字符串，`locale` 仅取有效已知源语；同时保留 `reason`，不能统计成翻译完成 |
| `missing` | 源字段非字符串、null、undefined、空串或纯空白；`text:null`、`locale:undefined`、`reason:"source-missing"`；不能拿缓存译文填补无法验证的源文 |

`original.reason` 是稳定诊断码，不是直接展示给用户的英文文案：

| reason | 条件 |
| --- | --- |
| `unsupported-locale` | 目标不在七语注册表，包括非法运行时值 |
| `source-locale` | 目标等于明确已知源语，保持原文 |
| `identity-unverified` | 当前资源 ID 或字段为空/无效，无法安全定位 |
| `translation-missing` | 精确目标 locale/field 无自有 entry（null 也视为缺失） |
| `translation-invalid` | entry 的身份元数据缺失/无效，或译文非字符串/为空白 |
| `translation-mismatch` | entry 的资源 ID、字段或 locale 与当前目标不符 |
| `source-unverified` | freshness 缺失、格式无效、仅单侧提供，不能证明当前有效 |
| `translation-stale` | 有效 hash 或版本与当前值不相等，旧译文不得继续展示为已译 |

判定顺序为源缺失 → 目标 locale → 同源语 → 当前身份 → 查 entry → entry 身份 → 文本 → hash → version。遇到首个问题即返回一个诊断，不承诺一次报告所有问题。例如 hash 已过期时无需继续比较版本。对象查找仅接受自有属性，继承的语言、字段、文本和 freshness 不参与验证。

展示层应分别记录原文、选中结果与诊断，提供可理解的原文/缺译状态或后台审计；UI 提示仍须通过既有界面词典本地化。监测可记录 ID/field/locale/status/reason，避免上传致谢自由文本、个人资料或正文。覆盖率以当前资源、当前源修订、当前字段逐语言统计，只将 `translated` 计入目标译文；源语 `original` 可以作为源语可用性另计，不能把它凑成七语翻译完成。

## 字段安全和发布要求

- `name`、`desc`、分组标签、`other` 和比赛 `Name` 用既有 React 纯文本渲染，保持默认转义。译文出现 HTML 不能据此升级成 HTML 渲染；不得插入 DOM、脚本、样式或 `dangerouslySetInnerHTML`。
- `Illustrate`、`RuleMD` 继续使用既有 Markdown 渲染及 URL/图片规则。当前 `Markdown.tsx` 使用 `react-markdown` + `remark-gfm`，未接 raw HTML 插件。翻译不能借新增插件绕过现有边界，不能把 Markdown 译文送入 HTML renderer，也不能更换资源/图片基址或改变 ID/链接身份。新增或修改链接需校验协议和目标，防止钓鱼与危险 URI。
- `IllustrateHTML`、后端 `RuleHTML` 必须保持 HTML 字段边界，不得因 hash 通过就标记为安全。**当前 `EditorView` 直接 `dangerouslySetInnerHTML`，本次没有发现该函数内的净化措施，也未在本次修复它。** 将不受信译文接入此路径前必须落实与原内容相同或更严格的发布授权、HTML 白名单净化及 URL 策略；拒绝脚本、事件属性、危险协议和非授权嵌入。现有路径不能作为译文安全认证；未完成该验收就保留原文，不接入 HTML 译文。
- Markdown 与 HTML 不是可互换译文；同一显示区混用原文和译文可能产生重复/冲突。后续页面应明确选用格式、同时失效派生 HTML，分别验证对应源文，不能用翻译 Markdown 冒充 HTML 已完成。
- hash 应在上述精确定义的源字段上计算；HTML 源内容若经净化后存储则以存储并实际交付的版本为源，变更时更新 hash/版本。显示时安全净化是独立步骤，不能用“净化后碰巧相同”放行旧原文 hash。
- 发布方需校验 ID 唯一性、field 白名单、locale 注册值、非空译文、hash 格式、版本和源文快照一致性，限制正文长度、嵌套深度和响应总量。翻译资源只能由授权内容流程发布，审核适用条款、来源和署名；不能让用户任意附加 `translations` 越过原内容发布权限。
- helper 单测中的七语是合成 fixture；`translated` 只证明合同校验通过，不证明目标语言识别、翻译质量、完整覆盖、HTML 安全或许可。

## 验收与后续接入条件

本次单测覆盖旧 DTO 兼容、七个精确 locale、身份/字段/locale 错投、原型属性、未知源语、缺失原文、空/无效译文、原文逐字节变化、hash/version 单用与同时约束、过期回退、分组关联不变以及 HTML 原样返回不代表安全。

```bash
./node_modules/.bin/tsx --test src/lib/localizedContent.test.ts
./node_modules/.bin/eslint src/lib/localizedContent.ts src/lib/localizedContent.test.ts src/services/cubing-pro/public/types.ts
./node_modules/.bin/tsc --noEmit --incremental false
git diff --check -- src/lib/localizedContent.ts src/lib/localizedContent.test.ts src/services/cubing-pro/public/types.ts docs/project/internationalization-content-contract.md
```

2026-11-18 本次验证结果：15 项单测全部通过（包含直接读取本文三段 JSON 并验证 hash、选择状态及源文变化后的过期回退）；上述三个 TS 文件的 ESLint 无错误或警告；全仓 `tsc --noEmit --incremental false` 通过；范围内 `git diff --check` 通过。另执行 `npm run lint`，全仓报告 892 个错误、31,322 个警告，涉及范围外源码及 `var/.../i18n-header-next` 等生成文件；未修改范围外文件或 lint 配置，不能将全仓 lint 记为通过。未运行浏览器接线验收或后端服务，也未核验线上部署。

生产接入仍需：后端明确支持可选字段及版本快照；提供致谢行/组稳定 ID；normalizer 保留经验证元数据；各 View 逐字段调用并展示诊断；管理端避免旧全量保存抹掉元数据；完成权限、HTML/Markdown 安全及真实内容逐语验收。本次未执行这些集成步骤，动态正文与用户/比赛内容不能由当前前端承诺全量七语。
