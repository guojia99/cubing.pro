import { existsSync, readFileSync, writeFileSync } from "node:fs";

/** 静态导出需 dynamicParams = false；dev 保持 true 以支持任意动态 URL */
const PAGES = ["src/app/(main)/[...path]/page.tsx"];

for (const page of PAGES) {
  const bak = `${page}.bak`;
  const source = readFileSync(page, "utf8");

  if (!existsSync(bak)) {
    writeFileSync(bak, source);
  }

  if (!source.includes("export const dynamicParams = false;")) {
    writeFileSync(
      page,
      source.replace(
        "export const dynamicParams = true;",
        "export const dynamicParams = false;",
      ),
    );
  }
}
