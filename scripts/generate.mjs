import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeProducts } from "../js/merge.js";
import { renderProductPage, renderRobots, renderSitemap } from "../js/page.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");

function outputs() {
  const rows = JSON.parse(readFileSync(join(root, "data/products.json"), "utf8"));
  const { products } = mergeProducts(rows);
  const files = new Map();
  files.set("sitemap.xml", renderSitemap(products));
  files.set("robots.txt", renderRobots());
  for (const product of products) {
    files.set(`p/${product.slug}/index.html`, renderProductPage(product, products));
  }
  return files;
}

function extraPages(expected) {
  const pageDir = join(root, "p");
  if (!existsSync(pageDir)) return [];
  const extras = [];
  for (const slug of readdirSync(pageDir)) {
    const rel = `p/${slug}/index.html`;
    if (!expected.has(rel)) extras.push(rel);
  }
  return extras;
}

const files = outputs();

if (check) {
  const problems = [];
  for (const [rel, contents] of files) {
    const full = join(root, rel);
    if (!existsSync(full)) {
      problems.push(`missing ${rel}`);
      continue;
    }
    if (readFileSync(full, "utf8") !== contents) problems.push(`stale ${rel}`);
  }
  for (const rel of extraPages(files)) problems.push(`extra ${rel}`);
  if (problems.length) {
    console.error(problems.slice(0, 30).join("\n"));
    console.error(
      `${problems.length} generated file(s) do not match data/products.json. Run: node scripts/generate.mjs`,
    );
    process.exit(1);
  }
  console.log(`OK: ${files.size} generated files match data/products.json`);
} else {
  for (const [rel, contents] of files) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, contents);
  }
  const pageDir = join(root, "p");
  if (existsSync(pageDir)) {
    for (const slug of readdirSync(pageDir)) {
      if (!files.has(`p/${slug}/index.html`)) rmSync(join(pageDir, slug), { recursive: true, force: true });
    }
  }
  console.log(`Wrote ${files.size - 2} product pages, sitemap.xml, and robots.txt`);
}
