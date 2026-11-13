import { spawnSync } from "node:child_process";

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

let status = 1;
try {
  status = run("npm", ["run", "howtocook:prepare"]);
  if (status === 0) status = run(process.execPath, ["scripts/prepare-static-export.mjs"]);
  if (status === 0) status = run(process.execPath, ["node_modules/next/dist/bin/next", "build"], { ...process.env, NEXT_OUTPUT_EXPORT: "1" });
  if (status === 0) status = run(process.execPath, ["scripts/post-static-export.mjs"]);
} catch (error) {
  console.error(error);
  status = 1;
} finally {
  // Restoration must not hide a failed compile, catalog request or export check.
  const restored = run(process.execPath, ["scripts/restore-static-export.mjs"]);
  if (status === 0) status = restored;
}
process.exitCode = status;
