import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, mock, test } from "node:test";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: [new URL("./staticExportPaths.ts", import.meta.url).pathname],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const {
  getAlgsDetailStaticParamsFromMap,
  getAllCatchAllStaticParams,
  getCatchAllStaticParams,
} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

const envKeys = ["CUBE_API_UPSTREAM", "NEXT_PUBLIC_API_BASE", "NEXT_OUTPUT_EXPORT", "NODE_ENV"];
const apiBase = "https://backend.test/v3/cube-api";
const endpoint = `${apiBase}/public/algorithm/`;
const fakeRoot = path.resolve("/virtual/static-export-project");
const manifestPath = path.join(fakeRoot, ".static-export-algs.json");
let savedEnv;
let files;
let calls;
let timeouts;
let respond;

function catalog(names = ["PLL"]) {
  return {
    CubeKeys: ["333"],
    ClassMap: { "333": names.map((name) => ({ name, image: "<svg/>", alg: "R U", userdata: "private" })) },
  };
}

beforeEach(() => {
  savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  for (const key of envKeys) delete process.env[key];
  process.env.CUBE_API_UPSTREAM = `${apiBase}///`;
  process.env.NEXT_PUBLIC_API_BASE = "https://ignored.test";
  process.env.NEXT_OUTPUT_EXPORT = "1";
  files = new Map();
  calls = [];
  timeouts = [];
  respond = () => Response.json(catalog());
  mock.method(process, "cwd", () => fakeRoot);
  mock.method(fs, "readFileSync", () => { throw new Error("ENOENT: no fixture public JSON"); });
  mock.method(fs, "writeFileSync", (filename, content, encoding) => {
    assert.equal(encoding, "utf-8");
    files.set(filename, content);
  });
  const timeout = AbortSignal.timeout.bind(AbortSignal);
  mock.method(AbortSignal, "timeout", (ms) => {
    timeouts.push(ms);
    return timeout(ms);
  });
  mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return respond();
  });
});

afterEach(() => {
  mock.restoreAll();
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

test("each build fetches fresh paths with no-store and a 15 second deadline, including new LS1", async () => {
  const first = await getAllCatchAllStaticParams();
  assert.ok(first.some(({ path }) => path.join("/") === "algs/333/PLL"));
  assert.ok(!first.some(({ path }) => path.includes("LS1")));
  const firstManifest = JSON.parse(files.get(manifestPath));
  assert.deepEqual(firstManifest.paths, [["algs", "333", "PLL"]]);

  respond = () => Response.json(catalog(["PLL", "LS1", "LS1"]));
  const second = await getAllCatchAllStaticParams();
  assert.equal(second.filter(({ path }) => path.join("/") === "algs/333/LS1").length, 1);
  assert.deepEqual(JSON.parse(files.get(manifestPath)).paths, [
    ["algs", "333", "PLL"], ["algs", "333", "LS1"],
  ]);
  assert.equal(calls.length, 2);
  assert.deepEqual(timeouts, [15000, 15000]);
  for (const { url, options } of calls) {
    assert.equal(url, endpoint);
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.signal.aborted, false);
  }
});

test("manifest at cwd root contains only version, normalized base and original decoded paths", async () => {
  const cube = "三阶 + cube";
  const name = " 中文 + LS1 ";
  const map = { CubeKeys: [cube, cube], ClassMap: { [cube]: [{ name }, { name }] } };
  respond = () => Response.json({ ...map, userdata: "private", svg: "<svg/>" });
  await getAllCatchAllStaticParams();
  assert.deepEqual([...files.keys()], [manifestPath]);
  assert.deepEqual(JSON.parse(files.get(manifestPath)), {
    version: 1, apiBase, paths: [["algs", cube, name]],
  });
  assert.ok(files.get(manifestPath).includes(name));
  assert.ok(!files.get(manifestPath).includes("%"));
  assert.deepEqual(getAlgsDetailStaticParamsFromMap(map), [{ path: ["algs", cube, name] }]);
});

test("API base priority retains upstream, public override and default with trailing slashes removed", async () => {
  await getAllCatchAllStaticParams();
  delete process.env.CUBE_API_UPSTREAM;
  process.env.NEXT_PUBLIC_API_BASE = "https://public.test/api///";
  await getAllCatchAllStaticParams();
  assert.equal(JSON.parse(files.get(manifestPath)).apiBase, "https://public.test/api");
  delete process.env.NEXT_PUBLIC_API_BASE;
  await getAllCatchAllStaticParams();
  assert.deepEqual(calls.map(({ url }) => url), [
    endpoint, "https://public.test/api/public/algorithm/", "https://cubing.pro/v3/cube-api/public/algorithm/",
  ]);
});

for (const [label, response, reason] of [
  ["404", () => new Response("missing", { status: 404, statusText: "Not Found" }), /HTTP 404 Not Found/],
  ["500", () => new Response("down", { status: 500 }), /HTTP 500/],
  ["invalid JSON", () => new Response("not json"), /invalid JSON/],
  ["network error", () => { throw new Error("backend offline"); }, /backend offline/],
  ["timeout", () => { throw new DOMException("request exceeded 15000ms", "TimeoutError"); }, /15000ms/],
  ["malformed payload", () => Response.json({}), /CubeKeys/],
  ["missing static paths", () => Response.json(catalog([])), /at least one algorithm detail path/],
]) {
  test(`static export rejects ${label} with endpoint and reason`, async () => {
    respond = response;
    await assert.rejects(getAllCatchAllStaticParams(), (error) => {
      assert.ok(error.message.includes(`GET ${endpoint}`));
      assert.match(error.message, reason);
      return true;
    });
    assert.equal(files.size, 0);
  });
}

test("development without export falls back to fixed routes when backend is unavailable or malformed", async () => {
  delete process.env.NEXT_OUTPUT_EXPORT;
  process.env.NODE_ENV = "development";
  for (const response of [
    () => new Response("missing", { status: 404 }),
    () => { throw new Error("backend offline"); },
    () => new Response("not json"),
    () => Response.json({}),
    () => Response.json(catalog(["../bad"])),
  ]) {
    respond = response;
    assert.deepEqual(await getAllCatchAllStaticParams(), getCatchAllStaticParams());
  }
  assert.equal(files.size, 0);
});

test("successful non-export calls never write a manifest; explicit true export does", async () => {
  for (const flag of [undefined, "0", "false"]) {
    if (flag === undefined) delete process.env.NEXT_OUTPUT_EXPORT;
    else process.env.NEXT_OUTPUT_EXPORT = flag;
    const params = await getAllCatchAllStaticParams();
    assert.ok(params.some(({ path }) => path.join("/") === "algs/333/PLL"));
    assert.equal(files.size, 0);
  }
  process.env.NEXT_OUTPUT_EXPORT = "true";
  await getAllCatchAllStaticParams();
  assert.equal(files.size, 1);
});

const malformedMaps = [
  null, [], {}, { CubeKeys: "333", ClassMap: {} }, { CubeKeys: [], ClassMap: {} },
  { CubeKeys: ["333"], ClassMap: null }, { CubeKeys: ["333"], ClassMap: [] },
  { CubeKeys: ["333"], ClassMap: {} }, { CubeKeys: ["toString"], ClassMap: {} },
  { CubeKeys: ["333"], ClassMap: { "333": {} } },
  { CubeKeys: ["333"], ClassMap: { "333": [null] } },
  { CubeKeys: ["333"], ClassMap: { "333": [{}] } },
  { ...catalog(), ClassMap: { ...catalog().ClassMap, extra: null } },
  { ...catalog(), ClassMap: { ...catalog().ClassMap, extra: [{ name: "../bad" }] } },
];
for (const value of ["", " ", ".", "..", "a/b", "a\\b", "\0", "a\nb", 333, null]) {
  malformedMaps.push(
    { CubeKeys: [value], ClassMap: {} },
    { CubeKeys: ["333"], ClassMap: { "333": [{ name: "valid" }, { name: value }] } },
  );
}

test("all malformed entries throw instead of being silently skipped", async () => {
  for (const map of malformedMaps) {
    assert.throws(() => getAlgsDetailStaticParamsFromMap(map), /CubeKeys|ClassMap/);
    respond = () => Response.json(map);
    await assert.rejects(getAllCatchAllStaticParams(), (error) => {
      assert.ok(error.message.includes(endpoint));
      assert.match(error.message, /CubeKeys|ClassMap/);
      return true;
    });
  }
  assert.equal(files.size, 0);
});

test("static export fails visibly if manifest cannot be written", async () => {
  mock.method(fs, "writeFileSync", () => { throw new Error("EACCES: read-only root"); });
  await assert.rejects(getAllCatchAllStaticParams(), (error) => {
    assert.ok(error.message.includes(endpoint));
    assert.match(error.message, /cannot write \.static-export-algs\.json.*EACCES/);
    return true;
  });
});
