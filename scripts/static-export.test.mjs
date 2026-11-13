import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const scriptsDir = fileURLToPath(new URL("./", import.meta.url));
const pagePath = "src/app/(main)/[...path]/page.tsx";
const originalPage = "// Keep the original page intact.\nexport const dynamicParams = true;\n";
const manifestPath = ".static-export-algs.json";
const snippetPath = "dist/nginx-dynamic-fallback.conf.snippet";
const apiBase = "https://backend.test/v3/cube-api";
const routes = [["algs", "333", "PLL"], ["algs", "333", "LS1"]];

function write(root, relative, content) {
  const filename = path.join(root, relative);
  mkdirSync(path.dirname(filename), { recursive: true });
  writeFileSync(filename, content);
}

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "cubing-static-export-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, pagePath, originalPage);
  return root;
}

function writeManifest(root, paths = routes, overrides = {}) {
  write(root, manifestPath, JSON.stringify({ version: 1, apiBase, paths, ...overrides }));
}

function writeRoute(root, segments) {
  for (const file of ["index.html", "index.txt"]) {
    write(root, path.join("dist", ...segments, file), `fixture ${file}\n`);
  }
}

function run(root, script) {
  const result = spawnSync(process.execPath, [path.join(scriptsDir, script)], {
    cwd: root,
    encoding: "utf8",
    timeout: 10_000,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null, result.stderr);
  return result;
}

function assertSuccess(result) {
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function assertFailure(result, reason) {
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, reason);
}

function assertRestored(root) {
  assert.equal(readFileSync(path.join(root, pagePath), "utf8"), originalPage);
  assert.equal(existsSync(path.join(root, `${pagePath}.bak`)), false);
  assert.equal(existsSync(path.join(root, manifestPath)), false);
}

test("prepare removes stale manifest, preserves backup, and restore recovers the original page", (t) => {
  const root = fixture(t);
  writeManifest(root);
  assertSuccess(run(root, "prepare-static-export.mjs"));
  assert.equal(existsSync(path.join(root, manifestPath)), false);
  assert.equal(readFileSync(path.join(root, `${pagePath}.bak`), "utf8"), originalPage);
  assert.equal(
    readFileSync(path.join(root, pagePath), "utf8"),
    originalPage.replace("dynamicParams = true", "dynamicParams = false"),
  );

  writeManifest(root);
  assertSuccess(run(root, "prepare-static-export.mjs"));
  assert.equal(existsSync(path.join(root, manifestPath)), false);
  assert.equal(readFileSync(path.join(root, `${pagePath}.bak`), "utf8"), originalPage);

  writeManifest(root);
  assertSuccess(run(root, "restore-static-export.mjs"));
  assertRestored(root);

  writeManifest(root);
  assertSuccess(run(root, "restore-static-export.mjs"));
  assertRestored(root);
});

test("post verifies every manifest route including LS1 before writing nginx fallback rules", (t) => {
  const root = fixture(t);
  writeManifest(root);
  routes.forEach((segments) => writeRoute(root, segments));
  const result = run(root, "post-static-export.mjs");
  assertSuccess(result);
  assert.match(result.stdout, /Verified 2 algorithm routes/);
  assert.ok(result.stdout.includes(apiBase));
  const snippet = readFileSync(path.join(root, snippetPath), "utf8");
  assert.equal((snippet.match(/location ~/g) ?? []).length, 4);
  for (const placeholder of [
    "/competition/__dynamic__/index.html",
    "/player/__dynamic__/index.html",
    "/wca/player/__dynamic__/index.html",
    "/admin/organizers/__dynamic__/comp/__dynamic__/result/index.html",
  ]) {
    assert.ok(snippet.includes(`try_files $uri $uri/ ${placeholder} =404;`));
  }
  assert.equal(snippet.includes("/algs/"), false);
});

test("post rejects a missing LS1 directory even when PLL is complete", (t) => {
  const root = fixture(t);
  writeManifest(root);
  writeRoute(root, routes[0]);
  assertFailure(run(root, "post-static-export.mjs"), /Algorithm export is incomplete:.*algs\/333\/LS1\/index\.html/);
  assert.equal(existsSync(path.join(root, snippetPath)), false);
});

test("post reads original Chinese, spaced, and percent-encoded path segments without transforming them", (t) => {
  const root = fixture(t);
  const originalRoutes = [
    ["algs", "\u4e09\u9636 + cube", " \u4e2d\u6587 LS1 "],
    ["algs", "%E4%B8%89%E9%98%B6%20cube", "%E4%B8%AD%E6%96%87%20LS1"],
  ];
  writeManifest(root, originalRoutes);
  originalRoutes.forEach((segments) => writeRoute(root, segments));
  assertSuccess(run(root, "post-static-export.mjs"));

  rmSync(path.join(root, snippetPath));
  rmSync(path.join(root, "dist", ...originalRoutes[0]), { recursive: true });
  writeRoute(root, originalRoutes[0].map(encodeURIComponent));
  assertFailure(run(root, "post-static-export.mjs"), /Algorithm export is incomplete/);
  assert.equal(existsSync(path.join(root, snippetPath)), false);
});

for (const [label, file, kind] of [
  ["missing HTML", "index.html", "missing"],
  ["empty HTML", "index.html", "empty"],
  ["HTML directory", "index.html", "directory"],
  ["HTML present but text missing", "index.txt", "missing"],
  ["HTML present but text empty", "index.txt", "empty"],
  ["HTML present but text is a directory", "index.txt", "directory"],
]) {
  test(`post rejects ${label} and leaves an existing nginx snippet untouched`, (t) => {
    const root = fixture(t);
    writeManifest(root);
    routes.forEach((segments) => writeRoute(root, segments));
    const relative = path.join("dist", ...routes[1], file);
    rmSync(path.join(root, relative));
    if (kind === "empty") write(root, relative, "");
    if (kind === "directory") mkdirSync(path.join(root, relative));
    write(root, snippetPath, "existing nginx configuration\n");
    const result = run(root, "post-static-export.mjs");
    assertFailure(result, /Algorithm export is incomplete/);
    assert.ok(result.stderr.includes(path.join(...routes[1], file)));
    assert.equal(readFileSync(path.join(root, snippetPath), "utf8"), "existing nginx configuration\n");
  });
}

for (const [label, contents] of [
  ["missing manifest", undefined],
  ["invalid JSON", "{broken"],
  ["wrong version", JSON.stringify({ version: 2, apiBase, paths: routes })],
  ["missing version", JSON.stringify({ apiBase, paths: routes })],
  ["missing paths", JSON.stringify({ version: 1, apiBase })],
  ["non-array paths", JSON.stringify({ version: 1, apiBase, paths: {} })],
  ["empty paths", JSON.stringify({ version: 1, apiBase, paths: [] })],
]) {
  test(`post rejects ${label} even when exported directories exist`, (t) => {
    const root = fixture(t);
    routes.forEach((segments) => writeRoute(root, segments));
    if (contents !== undefined) write(root, manifestPath, contents);
    assertFailure(run(root, "post-static-export.mjs"), /manifest|JSON|ENOENT/);
    assert.equal(existsSync(path.join(root, snippetPath)), false);
  });
}

test("post rejects malformed paths instead of normalizing or skipping them", async (t) => {
  const invalidPaths = [
    null, "algs/333/LS1", {}, [],
    ["algs", "333"], ["algs", "333", "LS1", "extra"],
    ["player", "333", "LS1"],
  ];
  for (const segment of ["", " ", ".", "..", "../LS1", "a/b", "a\\b", "\0", "a\nb", "a\tb", "\u001f", "\u007f", 333, null]) {
    invalidPaths.push(["algs", segment, "LS1"], ["algs", "333", segment]);
  }
  for (const segments of invalidPaths) {
    await t.test(JSON.stringify(segments), (t) => {
      const root = fixture(t);
      writeRoute(root, routes[0]);
      writeManifest(root, [routes[0], segments]);
      assertFailure(run(root, "post-static-export.mjs"), /Invalid algorithm path/);
      assert.equal(existsSync(path.join(root, snippetPath)), false);
    });
  }
});

// Only npm and Next are simulated. Preparation, validation, and restoration run
// as real child processes using the original scripts and an isolated cwd.
const runnerHarness = `
import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { scriptsDir, pagePath, manifestPath, apiBase, routes, scenario } = JSON.parse(process.argv[1]);
const realSpawnSync = childProcess.spawnSync;
childProcess.spawnSync = (command, args, options) => {
  let step;
  if (command === "npm") {
    assert.deepEqual(args, ["run", "howtocook:prepare"]);
    step = "howtocook";
  } else {
    assert.equal(command, process.execPath);
    step = {
      "scripts/prepare-static-export.mjs": "prepare",
      "node_modules/next/dist/bin/next": "build",
      "scripts/post-static-export.mjs": "post",
      "scripts/restore-static-export.mjs": "restore",
    }[args[0]];
    assert.ok(step, "Unexpected child command: " + JSON.stringify(args));
  }
  appendFileSync("calls.jsonl", JSON.stringify({ step, args }) + "\\n");
  if (step === "howtocook") return { status: scenario === "howtocook-failure" ? 19 : 0 };
  if (step === "build") {
    assert.deepEqual(args, ["node_modules/next/dist/bin/next", "build"]);
    assert.equal(options.env.NEXT_OUTPUT_EXPORT, "1");
    assert.ok(readFileSync(pagePath, "utf8").includes("dynamicParams = false;"));
    assert.equal(existsSync(manifestPath), false);
    writeFileSync(manifestPath, JSON.stringify({ version: 1, apiBase, paths: routes }));
    if (scenario === "spawn-error") throw new Error("simulated next spawn failure");
    if (scenario === "build-failure") return { status: 17 };
    if (scenario === "signal-failure") return { status: null, signal: "SIGTERM" };
    for (const segments of routes) {
      const directory = path.join("dist", ...segments);
      mkdirSync(directory, { recursive: true });
      writeFileSync(path.join(directory, "index.html"), "<html>fixture</html>");
      if (scenario !== "post-failure") writeFileSync(path.join(directory, "index.txt"), "fixture RSC");
    }
    return { status: 0 };
  }
  assert.deepEqual(args, ["scripts/" + path.basename(args[0])]);
  const result = realSpawnSync(command, [path.join(scriptsDir, path.basename(args[0]))], options);
  if (step === "restore" && scenario === "restore-failure") return { status: 23 };
  return result;
};
syncBuiltinESMExports();
await import(pathToFileURL(path.join(scriptsDir, "build-static.mjs")).href);
`;

for (const [scenario, expectedStatus, expectedCalls] of [
  ["success", 0, ["howtocook", "prepare", "build", "post", "restore"]],
  ["build-failure", 17, ["howtocook", "prepare", "build", "restore"]],
  ["post-failure", 1, ["howtocook", "prepare", "build", "post", "restore"]],
  ["prepare-failure", 1, ["howtocook", "prepare", "restore"]],
  ["howtocook-failure", 19, ["howtocook", "restore"]],
  ["spawn-error", 1, ["howtocook", "prepare", "build", "restore"]],
  ["signal-failure", 1, ["howtocook", "prepare", "build", "restore"]],
  ["restore-failure", 23, ["howtocook", "prepare", "build", "post", "restore"]],
]) {
  test(`runner ${scenario}: preserves exit status and always restores and cleans the manifest`, (t) => {
    const root = fixture(t);
    writeManifest(root, [["algs", "stale", "old-build"]]);
    if (scenario === "prepare-failure") {
      // A prior backup lets the real restore repair a page missing at prepare time.
      write(root, `${pagePath}.bak`, originalPage);
      rmSync(path.join(root, pagePath));
    }
    const result = spawnSync(process.execPath, [
      "--input-type=module", "--eval", runnerHarness,
      JSON.stringify({ scriptsDir, pagePath, manifestPath, apiBase, routes, scenario }),
    ], { cwd: root, encoding: "utf8", timeout: 10_000 });
    assert.ifError(result.error);
    assert.equal(result.signal, null, result.stderr);
    assert.equal(result.status, expectedStatus, result.stderr || result.stdout);
    const calls = readFileSync(path.join(root, "calls.jsonl"), "utf8")
      .trim().split("\n").map((line) => JSON.parse(line).step);
    assert.deepEqual(calls, expectedCalls, result.stderr);
    assertRestored(root);
    if (scenario === "post-failure") assert.match(result.stderr, /Algorithm export is incomplete/);
    if (scenario === "prepare-failure") assert.match(result.stderr, /ENOENT/);
    if (scenario === "spawn-error") assert.match(result.stderr, /simulated next spawn failure/);
    assert.equal(existsSync(path.join(root, snippetPath)), ["success", "restore-failure"].includes(scenario));
  });
}
