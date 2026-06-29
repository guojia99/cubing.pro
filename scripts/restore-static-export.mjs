import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";

const PAGES = ["src/app/(main)/[...path]/page.tsx"];

for (const page of PAGES) {
  const bak = `${page}.bak`;
  if (!existsSync(bak)) {
    continue;
  }

  writeFileSync(page, readFileSync(bak, "utf8"));
  unlinkSync(bak);
}
