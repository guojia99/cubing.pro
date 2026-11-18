import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

const directory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(directory, "../..");
const source = JSON.parse(readFileSync(path.join(publicDirectory, "tips.json"), "utf8"));
const locales = ["zh-CN", "en-US", "ja", "yue-Hant-HK", "ko", "fr", "es"];
const parser = unified().use(remarkParse).use(remarkGfm);
const failures = [];
const warnings = [];

function inspect(markdown) {
  const counts = {};
  const destinations = [];
  const paragraphs = [];
  const codes = [];
  function visit(node) {
    counts[node.type] = (counts[node.type] || 0) + 1;
    if (["link", "image", "definition"].includes(node.type)) destinations.push(node.url);
    if (node.type === "code") codes.push(node.value);
    if (node.type === "paragraph") {
      paragraphs.push(markdown.slice(node.position.start.offset, node.position.end.offset).trim());
    }
    node.children?.forEach(visit);
  }
  visit(parser.parse(markdown));
  return { counts, destinations, paragraphs, codes };
}

assert.equal(source.tips.length, 19);
for (const locale of locales) {
  let index;
  try {
    index = JSON.parse(readFileSync(path.join(directory, locale, "index.json"), "utf8"));
    assert.equal(index.locale, locale);
    assert.equal(index.tips.length, 19);
    assert.equal(new Set(index.tips.map((tip) => `${tip.category}/${tip.id}`)).size, 19);
  } catch (error) {
    failures.push(`${locale}: ${error.message}`);
    continue;
  }
  let complete = 0;
  for (const original of source.tips) {
    const label = `${locale}/${original.category}/${original.id}`;
    try {
      const tip = index.tips.find((item) => item.id === original.id && item.category === original.category);
      assert.ok(tip, "Missing identity");
      for (const field of ["title", "description", "categoryName"]) {
        assert.ok(typeof tip[field] === "string" && tip[field].trim(), `Missing ${field}`);
      }
      assert.equal(tip.mdPath, `${original.category}/${original.id}.md`);
      const markdown = readFileSync(path.join(directory, locale, tip.mdPath), "utf8");
      const upstream = readFileSync(path.join(publicDirectory, "HowToCook", original.mdPath), "utf8");
      assert.ok(markdown.trim().startsWith("# "), "Missing article heading");
      if (locale === "zh-CN") assert.equal(markdown.trim(), upstream.trim(), "Chinese source drift");
      else assert.notEqual(markdown.trim(), upstream.trim(), "Untranslated source body");
      const actual = inspect(markdown);
      const expected = inspect(upstream);
      for (const type of ["heading", "listItem", "table", "tableRow", "tableCell", "image", "code"]) {
        assert.equal(actual.counts[type] || 0, expected.counts[type] || 0, `${type} count differs`);
      }
      assert.deepEqual([...actual.destinations].sort(), [...expected.destinations].sort(), "Link/image destinations differ");
      if (actual.counts.paragraph !== expected.counts.paragraph) {
        warnings.push(`${label}: paragraph count ${expected.counts.paragraph} -> ${actual.counts.paragraph}`);
      }
      if (locale !== "zh-CN") {
        const identical = actual.paragraphs.filter((text) => /[\u3400-\u9fff]/u.test(text) &&
          text.replace(/!?\[[^\]]*\]\([^)]*\)/g, "").length > 20 && expected.paragraphs.includes(text));
        assert.deepEqual(identical, [], "Untranslated Chinese paragraphs");
        actual.codes.forEach((text, i) => {
          if (/[\u3400-\u9fff]/u.test(text)) {
            assert.notEqual(text, expected.codes[i], "Untranslated Chinese text/code block");
          }
        });
      }
      for (const destination of actual.destinations) {
        if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(destination)) continue;
        const resolved = new URL(destination, `https://kitchen.invalid/HowToCook/${original.mdPath}`);
        assert.ok(existsSync(path.join(publicDirectory, decodeURIComponent(resolved.pathname))), `Missing local destination: ${destination}`);
      }
      complete++;
    } catch (error) {
      failures.push(`${label}: ${error.message}`);
    }
  }
  console.log(`${locale}: ${complete}/19 verified`);
}
for (const warning of warnings) console.warn(`REVIEW ${warning}`);
for (const failure of failures) console.error(`FAIL ${failure}`);
if (failures.length) process.exitCode = 1;
else console.log("PASS: all 133 articles and seven indexes verified");
