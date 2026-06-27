import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";

const PAGES = [
  "src/app/(main)/wca/player/[wcaId]/page.tsx",
  "src/app/(main)/competition/[id]/page.tsx",
  "src/app/(main)/player/[id]/page.tsx",
  "src/app/(main)/admin/organizers/[orgId]/comp/[compId]/result/page.tsx",
];

for (const page of PAGES) {
  const bak = `${page}.bak`;
  if (!existsSync(bak)) {
    continue;
  }

  writeFileSync(page, readFileSync(bak, "utf8"));
  unlinkSync(bak);
}
