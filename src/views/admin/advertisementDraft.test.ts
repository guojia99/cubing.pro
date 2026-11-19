import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { catalogs, SUPPORTED_LOCALES, translate } from "../../i18n";
import { advertisementZhCN, getAdvertisementMessages, type AdvertisementMessageKey } from "../../i18n/messages/advertisements";
import { matchRoute } from "../../config/routes";
import { isAdvertisementUrl, moveAdvertisement, newAdvertisement, validAdvertisementImage, validateAdvertisements } from "./advertisementDraft";

const valid = () => ({ ...newAdvertisement(), title: "Test", imageUrl: "/image.png", enabled: true });

test("drafts have unique permitted keys, start disabled and preserve fixed ad identities", () => {
  const a = newAdvertisement();
  const b = newAdvertisement();
  assert.notEqual(a.key, b.key);
  assert.equal(a.enabled, false);
  assert.equal(validateAdvertisements([valid()]), null);
  for (const key of ["cuberwenjun", "contact", "", "x.y", "x".repeat(65)]) {
    assert.equal(validateAdvertisements([{ ...valid(), key }])?.messageKey, "advertisements.invalidKey");
  }
  const item = valid();
  assert.equal(validateAdvertisements([item, { ...item }])?.index, 1);
});

test("URL validation follows the advertisement API restrictions", () => {
  for (const value of ["", "/", "/advertisement?key=a#products", "/v3/cube-api/static/image/id", "https://example.com/a?q=1", "http://localhost:20000/img"]) assert.equal(isAdvertisementUrl(value), true, value);
  for (const value of ["//example.com", "/%2fexample.com", "https://user:pass@example.com", "https://example.com/\\x", "https://example.com/%5cfoo", "/%0a", "/x\u007f", "javascript:alert(1)", "data:image/png,x", "image.png", "https:///", "/bad%", " https://example.com"]) assert.equal(isAdvertisementUrl(value), false, value);
  assert.equal(isAdvertisementUrl("", true), false);
  assert.equal(isAdvertisementUrl("/images/ad cover.png", true), true);
  assert.equal(isAdvertisementUrl("/%252fexample.com"), false);
});

test("validation covers Unicode lengths, collection limits, durations and all image/link fields", () => {
  assert.equal(validateAdvertisements([]), null);
  const item = valid();
  assert.equal(validateAdvertisements([{ ...item, title: "🧩".repeat(200) }]), null);
  assert.equal(validateAdvertisements([{ ...item, title: "🧩".repeat(201) }])?.messageKey, "advertisements.invalidTitle");
  assert.equal(validateAdvertisements([{ ...item, title: "   " }])?.messageKey, "advertisements.invalidTitle");
  assert.equal(validateAdvertisements([{ ...item, description: "a".repeat(4001) }])?.messageKey, "advertisements.textLimit");
  assert.equal(validateAdvertisements([{ ...item, contact: "a".repeat(501) }])?.messageKey, "advertisements.textLimit");
  for (const duration of [NaN, Infinity, 0, 120.1]) assert.equal(validateAdvertisements([{ ...item, duration }])?.messageKey, "advertisements.invalidDuration");
  for (const duration of [1, 1.5, 120]) assert.equal(validateAdvertisements([{ ...item, duration }]), null);
  assert.equal(validateAdvertisements(Array.from({ length: 51 }, valid))?.messageKey, "advertisements.limit");
  for (const field of ["products", "showcase"] as const) {
    assert.equal(validateAdvertisements([{ ...item, [field]: Array.from({ length: 21 }, () => ({ imageUrl: "/img", caption: "" })) }])?.messageKey, "advertisements.limit");
    assert.equal(validateAdvertisements([{ ...item, [field]: [{ imageUrl: "", caption: "" }] }])?.messageKey, "advertisements.invalidUrl");
    assert.equal(validateAdvertisements([{ ...item, [field]: [{ imageUrl: "/img", caption: "", href: "javascript:x" }] }])?.messageKey, "advertisements.invalidUrl");
  }
  assert.equal(validateAdvertisements([{ ...item, targetUrl: "//host" }])?.messageKey, "advertisements.invalidUrl");
  assert.equal(validateAdvertisements([{ ...item, products: [{ imageUrl: "/img", caption: "a".repeat(8 * 1024 * 1024) }] }])?.messageKey, "advertisements.payloadLimit");
});

test("reordering is immutable and preserves the complete enabled/disabled objects", () => {
  const items = [valid(), { ...valid(), enabled: false }, valid()];
  const reordered = moveAdvertisement(items, 1, -1);
  assert.deepEqual(reordered, [items[1], items[0], items[2]]);
  assert.equal(items[0].enabled, true);
  assert.equal(reordered[0].enabled, false);
  assert.equal(moveAdvertisement(items, 0, -1), items);
  assert.equal(moveAdvertisement(items, 2, 1), items);
});

test("uploads reject oversized files, unsupported types and pixel bombs", () => {
  const file = { type: "image/png", size: 5 * 1024 * 1024 };
  assert.equal(validAdvertisementImage(file, 8192, 1), true);
  assert.equal(validAdvertisementImage(file, 5000, 4000), true);
  for (const [width, height] of [[8193, 1], [1, 8193], [5000, 4001], [0, 1]]) assert.equal(validAdvertisementImage(file, width, height), false);
  assert.equal(validAdvertisementImage({ ...file, size: file.size + 1 }, 1, 1), false);
  assert.equal(validAdvertisementImage({ ...file, type: "image/gif" }, 1, 1), false);
});

test("seven registered root catalogs include all shared advertisement messages", () => {
  const keys = Object.keys(advertisementZhCN) as AdvertisementMessageKey[];
  for (const { key: locale } of SUPPORTED_LOCALES) {
    for (const key of keys) {
      assert.ok(catalogs[locale][key].trim(), `${locale}:${key}`);
      assert.equal(getAdvertisementMessages(locale)(key), translate(locale, key));
    }
    for (const suffix of ["products", "showcase", "visit", "preview", "close", "loading", "loadError", "retry", "imageUnavailable"]) assert.ok(keys.includes(`advertisements.${suffix}` as AdvertisementMessageKey));
  }
});

test("admin route is dispatched and its superadmin entry immediately follows sponsorship", () => {
  assert.equal(matchRoute("/admin/advertisements/")?.id, "admin-advertisements");
  assert.equal(matchRoute("/admin/advertisements")?.pageComponent, "admin/AdminAdvertisementsPageView.tsx");
  const home = readFileSync(new URL("AdminHomePageView.tsx", import.meta.url), "utf8");
  assert.match(home, /to: "\/admin\/acknowledgments",\s*avatar: [^\n]+\s*},\s*{\s*title: t\("advertisements.adminTitle"\)/);
  const page = readFileSync(new URL("../../app/(main)/[...path]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /case "admin-advertisements":\s*return <AdminAdvertisementsPageView \/>/);
  const view = readFileSync(new URL("AdminAdvertisementsPageView.tsx", import.meta.url), "utf8");
  assert.match(view, /<AdminGuard required=\{\[Auth.AuthSuperAdmin\]\}>/);
  assert.match(view, /<ManagedAdThumbnail ad=\{ad\} preview/);
});
