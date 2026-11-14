import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(root, "node_modules/cubing");
const outdir = path.join(root, "public/two-solver/scrambler");
// Keep cubing's module-worker graph outside webpack. Its documented esbuild
// fallback needs import.meta.url to refer to an actual browser module URL.
await build({
  absWorkingDir: root,
  entryPoints: {
    scramble: path.join(packageRoot, "dist/lib/cubing/scramble/index.js"),
    "search-worker-entry": path.join(packageRoot, "dist/lib/cubing/chunks/search-worker-entry.js"),
  },
  outdir, bundle: true, splitting: true, format: "esm", platform: "browser", target: "es2022",
  minify: true, legalComments: "eof", chunkNames: "chunk-[hash]",
});
const pkg = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
await writeFile(path.join(outdir, "NOTICE.txt"), `cubing.js ${pkg.version}\nSource: https://github.com/cubing/cubing.js\nLicense: ${pkg.license}\nGenerated without source modifications by scripts/prepare-two-scrambler.mjs.\nThe module graph includes dependency license notices in generated files.\n`);
console.log(`Prepared cubing.js ${pkg.version} browser scramble modules.`);
