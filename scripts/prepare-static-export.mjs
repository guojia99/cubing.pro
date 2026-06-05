import { existsSync, readFileSync, writeFileSync } from "node:fs";

const PAGE = "src/app/(main)/wca/player/[wcaId]/page.tsx";
const BAK = `${PAGE}.bak`;

const source = readFileSync(PAGE, "utf8");
if (!existsSync(BAK)) {
  writeFileSync(BAK, source);
}

if (!source.includes("export const dynamicParams = false;")) {
  writeFileSync(
    PAGE,
    source.replace(
      "export const dynamicParams = true;",
      "export const dynamicParams = false;",
    ),
  );
}
