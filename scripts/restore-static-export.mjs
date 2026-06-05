import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";

const PAGE = "src/app/(main)/wca/player/[wcaId]/page.tsx";
const BAK = `${PAGE}.bak`;

if (!existsSync(BAK)) {
  process.exit(0);
}

writeFileSync(PAGE, readFileSync(BAK, "utf8"));
unlinkSync(BAK);
