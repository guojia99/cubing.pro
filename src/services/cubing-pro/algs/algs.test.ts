import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { Request } from "../request";
import { getAlgCubeClass, hasStableCatalogIds, type AlgClassDetail, type AlgItem } from "./algs";

const groupId = "abcdef0123456789";
const solutionId = "0123456789abcdef";
const oldKey = "alg_class_cache_333_OLL";
const newKey = "alg_class_cache_v2_333_OLL";

function catalog(item: Partial<AlgItem> = {}): AlgClassDetail {
  return { name: "OLL", sets: [{ name: "S", groups: [{ name: "G", groupId, algs: [
    { name: "Case", algs: ["R", "", "U"], solutionIds: [solutionId, null, "bbbbbbbbbbbbbbbb"], ...item },
  ] }] }] };
}

test("catalog IDs are required on every group and nonempty move, including slots after an empty move", () => {
  assert.ok(hasStableCatalogIds(catalog()));
  assert.ok(hasStableCatalogIds(catalog({ algs: [], solutionIds: undefined })));
  for (const invalid of [undefined, null, "", solutionId.slice(1), `${solutionId}0`, solutionId.toUpperCase(), "g".repeat(16)]) {
    const data = catalog();
    data.sets.push({ name: "Other", groups: [{ name: "Other", groupId: invalid ?? undefined, algs: [] }] });
    assert.equal(hasStableCatalogIds(data), false);
    assert.equal(hasStableCatalogIds(catalog({ solutionIds: [solutionId, null, invalid ?? null] })), false);
  }
  for (const ids of [undefined, [], [solutionId, null], [solutionId, null, solutionId, solutionId]]) {
    assert.equal(hasStableCatalogIds(catalog({ solutionIds: ids })), false);
  }
});

function cacheFixture(t: TestContext, response = catalog()) {
  const entries = new Map<string, string>();
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  };
  for (const [key, value] of Object.entries({ localStorage: storage, window: { location: { hostname: "127.0.0.1" } } })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => original ? Object.defineProperty(globalThis, key, original) : Reflect.deleteProperty(globalThis, key));
  }
  const requests: string[] = [];
  const adapter = Request.defaults.adapter;
  Request.defaults.adapter = async config => {
    requests.push(`${config.method} ${config.url}`);
    return { data: response, status: 200, statusText: "OK", headers: {}, config };
  };
  t.after(() => { Request.defaults.adapter = adapter; });
  const seed = (key: string, data: unknown) => storage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  return { entries, seed, requests, response };
}

test("a legacy class entry is bypassed and removed only for the class saved in v2", async t => {
  const { entries, seed, requests, response } = cacheFixture(t);
  seed(oldKey, catalog({ solutionIds: undefined }));
  seed("alg_class_cache_222_CLL", {});
  assert.deepEqual(await getAlgCubeClass("333", "OLL"), response);
  assert.deepEqual(requests, ["get /public/algorithm/333/OLL"]);
  assert.deepEqual(JSON.parse(entries.get(newKey)!).data, response);
  assert.equal(entries.has(oldKey), false);
  assert.equal(entries.has("alg_class_cache_222_CLL"), true);
});

test("a malformed v2 entry is bypassed and replaced with fresh IDs", async t => {
  const { entries, seed, requests, response } = cacheFixture(t);
  for (const malformed of [catalog({ solutionIds: [solutionId] }), { sets: [{ groups: [null] }] }]) {
    seed(newKey, malformed);
    assert.deepEqual(await getAlgCubeClass("333", "OLL"), response);
    assert.deepEqual(JSON.parse(entries.get(newKey)!).data, response);
  }
  assert.deepEqual(requests, Array(2).fill("get /public/algorithm/333/OLL"));
});

test("a valid v2 entry is served without a request", async t => {
  const { seed, requests } = cacheFixture(t);
  const cached = { ...catalog(), name: "From cache" };
  seed(newKey, cached);
  assert.deepEqual(await getAlgCubeClass("333", "OLL"), cached);
  assert.deepEqual(requests, []);
});

test("a response missing stable IDs can be displayed but does not populate v2 or remove legacy data", async t => {
  const { entries, seed, requests, response } = cacheFixture(t, catalog({ solutionIds: undefined }));
  seed(oldKey, response);
  assert.deepEqual(await getAlgCubeClass("333", "OLL"), response);
  assert.equal(entries.has(newKey), false);
  assert.equal(entries.has(oldKey), true);
  assert.deepEqual(requests, ["get /public/algorithm/333/OLL"]);
});
