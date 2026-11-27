import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mergeProducts } from "../js/merge.js";
import { renderProductPage, renderSitemap } from "../js/page.js";
import { escapeHtml, metaDescription, pageTitle, productJsonLd } from "../js/seo.js";

const rows = JSON.parse(readFileSync(new URL("../data/products.json", import.meta.url)));
const { products } = mergeProducts(rows);

function productWith(url) {
  return products.find((product) => product.offers.some((offer) => offer.url === url));
}

test("every product has a unique slug and a page that repeats its offers", () => {
  assert.equal(products.length, 87);
  const slugs = products.map((product) => product.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);

  for (const product of products) {
    const html = renderProductPage(product, products);
    assert.ok(html.includes(`<h1>${escapeHtml(product.name)}</h1>`));
    assert.match(html, /<title>[^<]+ \| O Square<\/title>/);
    const json = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(json["@type"], "Product");
    assert.equal(json.offers.length, product.offers.length);
    product.offers.forEach((offer, index) => {
      assert.equal(json.offers[index].url, offer.url);
      assert.equal(json.offers[index].price, String(offer.price));
      assert.equal(json.offers[index].priceCurrency, offer.currency);
      assert.ok(html.includes(offer.url));
      assert.ok(html.includes(offer.priceLabel));
    });
    assert.equal(html.includes("obinnadigital.nestuge.com/7-day-small-business-content-kit"), false);
    assert.equal(html.includes("selar.com/56m17c1215"), false);
  }
});

test("keyword lines follow the product and do not cross over", () => {
  const cash = productWith("https://obinnaya0.gumroad.com/l/daily-sales-cash-book-pack");
  assert.match(pageTitle(cash), /Cash book template/i);
  assert.match(metaDescription(cash), /₦21,000/);
  assert.match(metaDescription(cash), /\$14/);
  assert.equal(productJsonLd(cash).offers.find((offer) => offer.priceCurrency === "NGN").price, "21000");

  const petty = products.find((product) => /petty cash/i.test(product.name));
  assert.match(pageTitle(petty), /Petty cash template/i);
  assert.match(metaDescription(petty), /freelancers/i);

  const stock = products.find((product) => /stock tracker/i.test(product.name));
  assert.match(metaDescription(stock), /stock tracker template/i);

  const invoice = products.find((product) => product.name.startsWith("Daily Freelancer Invoice Pack"));
  assert.match(pageTitle(invoice) + metaDescription(invoice), /invoice template/i);
  assert.match(pageTitle(invoice) + metaDescription(invoice), /Nigeria/i);

  const saas = productWith("https://obinnaya0.gumroad.com/l/cancellation-offboarding-saas");
  const saasText = pageTitle(saas) + metaDescription(saas);
  assert.doesNotMatch(saasText, /petty cash|cash book|stock tracker|Nigeria/i);

  const linkedin = products.find((product) => /linkedin dm/i.test(product.name));
  assert.doesNotMatch(pageTitle(linkedin) + metaDescription(linkedin), /email template/i);
});

test("free downloads are the two Gumroad rows priced at zero", () => {
  const free = products.filter((product) => product.offers.some((offer) => offer.price === 0));
  assert.deepEqual(
    free.map((product) => product.offers.map((offer) => [offer.platform, offer.price, offer.currency, offer.url])),
    [
      [["Gumroad", 0, "USD", "https://obinnaya0.gumroad.com/l/free-freelancer-invoice-template"]],
      [["Gumroad", 0, "USD", "https://obinnaya0.gumroad.com/l/subject-lines-free"]],
    ],
  );
  const paid = productWith("https://obinnaya0.gumroad.com/l/daily-sales-cash-book-pack");
  const page = renderProductPage(paid, products);
  assert.match(page, /Get a free template/);
  assert.match(page, /email address/);
  assert.match(page, /free-freelancer-invoice-template/);
  assert.match(page, /subject-lines-free/);
});

test("sitemap lists the homepage and every product url", () => {
  const xml = renderSitemap(products);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(locs, [
    "https://obinnayaoliver-cmd.github.io/",
    ...products.map((product) => `https://obinnayaoliver-cmd.github.io/p/${product.slug}/`),
  ]);
});

test("committed pages match the generator", () => {
  execFileSync("node", ["scripts/generate.mjs", "--check"], { stdio: "pipe" });
});
