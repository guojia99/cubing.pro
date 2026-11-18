# Changelog translations

`/CHANGELOG.md` remains the unmodified Chinese source. The existing page URL is
unchanged. Other locales load `manifest.json` and their own JSON file in parallel.
Failed HTTP requests, invalid JSON, missing translations, and invalid manifests
produce a localized error; they never fall back to Chinese or English content.

The version 1 manifest contains `[date, scope, itemKeys]` groups in source order.
Its 339 records use 319 translated texts because identical source messages share
a message key. Each record has the unique identity `date/scope/itemKey`.
Keys are permanent: append new keys instead of renumbering existing ones. The
manifest controls scope and dates independently of translated headings or text.
`itemCount` validates completeness at runtime. All six dictionaries include the
four nested bullets in item `002`; these are children of one top-level record.

The source calls FTO Megaminx in parentheses. The translations retain both pieces
of information and identify the parenthetical wording as belonging to the source.

Run the source correspondence, coverage, loader, and failure checks from the
repository root:

```sh
node --import tsx --test public/i18n/changelog/verify.test.mjs
```

The checks compare every date, scope, position, identity, and nested-bullet count,
and reject missing or empty translations, extra keys, duplicate records, truncated
manifests, and exact English fallback in non-English dictionaries. Automated
coverage checks do not substitute for a native-speaker editorial review.
