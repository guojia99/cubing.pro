import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";

const PAGES = ["src/app/(main)/[...path]/page.tsx"];
rmSync(".static-export-algs.json", { force: true });

for (const page of PAGES) {
  const bak = `${page}.bak`;
  if (!existsSync(bak)) {
    continue;
  }

  writeFileSync(page, readFileSync(bak, "utf8"));
  unlinkSync(bak);
}
