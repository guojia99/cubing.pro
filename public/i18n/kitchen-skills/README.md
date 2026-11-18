# Kitchen skill content

These resources are maintained independently of `public/HowToCook` and `public/tips.json`.
The HowToCook synchronization and index parsers must not regenerate this directory.
Only kitchen tips are localized. Recipe Markdown and original media remain upstream assets.

## Layout

Each of `zh-CN`, `en-US`, `ja`, `yue-Hant-HK`, `ko`, `fr`, and `es` contains:

- `index.json`: `{ "locale": "...", "tips": [...] }`, with 19 metadata entries.
- `{category}/{original-id}.md`: full article Markdown, including `base/` articles.

Every metadata entry has `id`, `category`, `title`, `description`, `categoryName`, and
`mdPath`. `id` and `category` are stable upstream identities; `mdPath` is the resource-relative
`category/id.md`. Display strings are localized. Never use translated titles as identifiers.

## List integration

Import from `@/lib/kitchenSkillContent`:

```ts
const index = await loadKitchenSkillIndex(locale, controller.signal);
const localizedTips = localizeKitchenTips(originalData.tips, index);
```

`localizeKitchenTips` overrides only `title`, `description`, and `categoryName`. It preserves
the upstream `id`, `category`, `mdPath`, order, and any extra fields. Use `index.tips`
directly if the list does not need upstream fields. The loader and override helper throw
on missing or invalid resources rather than showing another language as a substitute.
The calling effect should abort its controller on cleanup and ignore aborted results.

## Detail integration

`useKitchenSkillMarkdown(category, id)` reads `useI18n().locale`, aborts requests on
identity/locale changes and unmount, and hides previous-language results immediately.
It keeps the existing `mdContent`, `headings`, `loading`, and `imageBase` interface.

`loadKitchenSkillContent(locale, category, id, signal)` loads and validates the index,
then the matching Markdown. `resolveKitchenSkillMarkdown` resolves relative images
and links against the original HowToCook file. Links to known kitchen tips become
stable `/other/kitchen-skills/category/id` routes; recipe links continue to point to
the original `/HowToCook/dishes/...` Markdown. External URLs, fragments, and fenced
code remain unchanged. No translated media or recipe copies are required.

## Validation

Run from the repository root:

```sh
node public/i18n/kitchen-skills/verify.mjs
npx eslint src/lib/kitchenSkillContent.ts src/views/KitchenSkills/hooks/useKitchenSkillMarkdown.ts
```

The resource check compares all 133 articles with the 19 source identities, verifies
nonempty metadata, Markdown block counts, tables, code blocks, images, link destinations,
and untranslated source paragraphs. It also checks that Chinese snapshots match upstream.
Structural checks complement language review; they do not certify translation quality
or independently verify the source articles' cooking, health, or safety claims.
