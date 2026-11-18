import assert from "node:assert/strict";
import { test } from "node:test";

import {
  sharedZhCN, sharedEnUS, sharedJa, sharedYue, sharedKo, sharedFr, sharedEs,
  markdownEditorResources, translateShared, type SharedLocale,
} from "@/i18n/messages/shared";
import { ClientMessageError, clientErrorMessage } from "./clientError";
import { assertPayloadWithinLimit, USER_KV_MAX_BYTES } from "./user/user_kv";
import { getProficiencyLabel } from "./algs/formulaPracticeProficiency";
import { parseDateTime } from "@/utils/time/data_time";

const locales: SharedLocale[] = ["zh-CN", "en-US", "ja", "yue-Hant-HK", "ko", "fr", "es"];

test("seven shared catalogs have identical keys, values and interpolation tokens", () => {
  const keys = Object.keys(sharedZhCN);
  for (const catalog of [sharedEnUS, sharedJa, sharedYue, sharedKo, sharedFr, sharedEs]) {
    assert.deepEqual(Object.keys(catalog), keys);
    for (const key of keys as (keyof typeof sharedZhCN)[]) {
      assert.ok(catalog[key]?.trim(), key);
      assert.deepEqual(catalog[key].match(/\{+\w+\}+/g), sharedZhCN[key].match(/\{+\w+\}+/g), key);
    }
  }
});

test("typed client errors render with explicit locale and preserve unknown backend messages", () => {
  const error = new ClientMessageError("shared.error.payloadLimit", { limit: 12 });
  for (const locale of locales) {
    assert.equal(clientErrorMessage(error, locale, "shared.error.unknown"), translateShared(locale, "shared.error.payloadLimit", { limit: 12 }));
    assert.equal(clientErrorMessage(new Error("后端原始文本"), locale, "shared.error.unknown"), "后端原始文本");
    assert.equal(clientErrorMessage(null, locale, "shared.error.unknown"), translateShared(locale, "shared.error.unknown"));
    assert.ok(getProficiencyLabel("skilled", locale));
  }
  assert.throws(() => assertPayloadWithinLimit("x".repeat(USER_KV_MAX_BYTES + 1)), { messageKey: "shared.error.payloadLimit" });
  assert.doesNotThrow(() => assertPayloadWithinLimit("x".repeat(USER_KV_MAX_BYTES)));
});

test("editor resources preserve plugin placeholders and date formatting accepts explicit locale", () => {
  for (const locale of locales) {
    const resources = markdownEditorResources(locale);
    assert.ok(resources.textStyle.bold);
    assert.ok(resources.uploadImgModule.uploadError.includes("{{fileName}}"));
    const date = new Date(2026, 10, 18, 12);
    assert.equal(parseDateTime(date.toISOString(), locale), new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(date));
  }
  assert.equal(parseDateTime("invalid", "fr"), "-");
});
