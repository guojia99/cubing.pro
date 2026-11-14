import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "../cubing-pro/build/Algs/2x2db");
const output = path.join(root, "public/two-solver/data");
const locations = {
  CLL: "2x2/CLL", EG1: "2x2/EG-1", EG2: "2x2/EG-2", LEG1: "2x2/LEG-1",
  "TCLL+": "2x2/TCLL+", "TCLL-": "2x2/TCLL-",
  ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`LS${i + 1}`, `2x2/LS-${i + 1}`])),
  CBL: "2x2CBL/CBL", EGLS1: "EGLS/EG1LS", EGLS2: "EGLS/EG2LS",
  TEG1: "2x2/TEG-1", TEG2: "2x2/TEG-2", FH: "2x2/FH",
};
await mkdir(output, { recursive: true });
const manifest = { source: "2x2DB", origin: "https://2x2db.vercel.app/database", schema: 1, methods: {} };
for (const [method, location] of Object.entries(locations)) {
  const raw = await readFile(path.join(source, location, "algs_info.json"), "utf8");
  const records = Object.values(JSON.parse(raw)).map(r => ({ name: r.name, group: r.group, algs: r.a }));
  const text = JSON.stringify({ method, records });
  await writeFile(path.join(output, `${method}.json`), text + "\n");
  manifest.methods[method] = { records: records.length, sha256: createHash("sha256").update(text + "\n").digest("hex") };
}
await writeFile(path.join(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Prepared ${Object.keys(locations).length} solver sets in public/two-solver/data; no backend files changed.`);
