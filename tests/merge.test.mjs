import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  EXCLUDED_URLS,
  displayName,
  filterProducts,
  formatPrice,
  mergeProducts,
  productKey,
} from "../js/merge.js";

const rows = JSON.parse(readFileSync(new URL("../data/products.json", import.meta.url)));
const { products, excluded } = mergeProducts(rows);

function productWith(url) {
  return products.find((product) => product.offers.some((offer) => offer.url === url));
}

test("every source row is shown once or explicitly excluded", () => {
  assert.equal(rows.length, 169);
  assert.equal(excluded.length, 1);
  assert.equal(excluded[0].url, "https://obinnadigital.nestuge.com/7-day-small-business-content-kit");
  assert.equal(excluded[0].price, 500);
  assert.equal(excluded[0].currency, "NGN");

  const offerUrls = products.flatMap((product) => product.offers.map((offer) => offer.url));
  assert.equal(offerUrls.length, 168);
  assert.equal(new Set(offerUrls).size, 168);
  assert.equal(products.length, 87);

  const shown = new Set(offerUrls);
  for (const row of rows) {
    if (EXCLUDED_URLS.has(row.url)) assert.equal(shown.has(row.url), false);
    else assert.equal(shown.has(row.url), true);
  }
});

test("buy links and prices match the source row", () => {
  const byUrl = new Map(rows.map((row) => [row.url, row]));
  for (const product of products) {
    assert.ok(product.name);
    assert.equal(new Set(product.offers.map((offer) => offer.platform)).size, product.offers.length);
    for (const offer of product.offers) {
      const source = byUrl.get(offer.url);
      assert.equal(offer.platform, source.platform);
      assert.equal(offer.price, source.price);
      assert.equal(offer.currency, source.currency);
      assert.equal(offer.priceLabel, formatPrice(source.price, source.currency));
      assert.ok(offer.url.startsWith("https://"));
    }
  }
});

test("content kit drops the bad Nestuge price and keeps the other stores", () => {
  const product = productWith("https://obinnaya0.gumroad.com/l/7-day-smb-content-kit");
  assert.deepEqual(
    product.offers.map((offer) => [offer.platform, offer.price, offer.currency]),
    [
      ["Selar", 25000, "NGN"],
      ["Gumroad", 15, "USD"],
    ],
  );
  assert.equal(
    product.offers.some((offer) => offer.url.includes("nestuge")),
    false,
  );
  assert.match(product.name, /Instagram Posts/);
});

test("print planner stays separate from the Canva planner", () => {
  const printPlanner = productWith("https://obinnaya0.gumroad.com/l/freelance-weekly-planner-print");
  const canvaPlanner = productWith("https://obinnadigital.nestuge.com/freelance-weekly-planner-pack");
  assert.notEqual(printPlanner.id, canvaPlanner.id);
  assert.equal(printPlanner.offers.length, 1);
  assert.equal(printPlanner.offers[0].price, 12);
  assert.equal(printPlanner.offers[0].currency, "USD");
  assert.match(printPlanner.name, /\(Print\)/);
  assert.equal(canvaPlanner.offers.length, 3);
  const nestuge = canvaPlanner.offers.find((offer) => offer.platform === "Nestuge");
  assert.deepEqual([nestuge.price, nestuge.currency], [15, "USD"]);
});

test("dead Selar POS link is absent; live POS listings remain", () => {
  const urls = products.flatMap((product) => product.offers.map((offer) => offer.url));
  assert.equal(urls.includes("https://selar.com/56m17c1215"), false);
  const pos = productWith("https://obinnaya0.gumroad.com/l/pos-agent-float-commission-pack");
  assert.deepEqual(
    pos.offers.map((offer) => [offer.platform, offer.price, offer.currency]),
    [
      ["Nestuge", 21000, "NGN"],
      ["Gumroad", 14, "USD"],
    ],
  );
});

test("packs with no recorded Nestuge URL are not given one", () => {
  for (const url of [
    "https://obinnaya0.gumroad.com/l/market-vendor-daily-cash-sheet-pack",
    "https://obinnaya0.gumroad.com/l/delivery-dispatch-cod-log-pack",
    "https://obinnaya0.gumroad.com/l/customer-complaint-refund-log-pack",
  ]) {
    const product = productWith(url);
    assert.deepEqual(
      product.offers.map((offer) => offer.platform),
      ["Selar", "Gumroad"],
    );
  }
});

test("currency edge cases stay as recorded", () => {
  const quiet = productWith("https://obinnaya0.gumroad.com/l/quiet-wealth-systems");
  assert.equal(quiet.offers[0].priceLabel, "£49");
  const whatsapp = productWith("https://obinnadigital.nestuge.com/whatsapp-business-status-pack");
  const nestuge = whatsapp.offers.find((offer) => offer.platform === "Nestuge");
  assert.equal(nestuge.priceLabel, "$12");
  const free = productWith("https://obinnaya0.gumroad.com/l/free-freelancer-invoice-template");
  assert.equal(free.offers[0].priceLabel, "Free");
  assert.equal(formatPrice(25000, "NGN"), "₦25,000");
});

test("display names drop format boilerplate and keep real qualifiers", () => {
  assert.equal(
    displayName("Staff Records & Salary Pack — Editable Canva Templates for Small Businesses (A4)"),
    "Staff Records & Salary Pack",
  );
  assert.equal(
    displayName("Daily Freelancer Invoice Pack (NGN + USD) — Editable Canva Templates"),
    "Daily Freelancer Invoice Pack (NGN + USD)",
  );
  assert.equal(
    displayName("Shop Owner Starter Kit — 7 Editable Canva Record Packs for Small Businesses (A4)"),
    "Shop Owner Starter Kit — 7 Editable Canva Record Packs for Small Businesses",
  );
  assert.equal(
    displayName("15 SaaS Cancellation & Offboarding Email Templates"),
    "15 SaaS Cancellation & Offboarding Email Templates",
  );
  const staff = productWith("https://obinnadigital.nestuge.com/staff-records-salary-pack");
  assert.equal(staff.name, "Staff Records & Salary Pack");
  assert.equal(staff.offers.length, 3);
});

test("search and category filters narrow the catalog", () => {
  const invoices = filterProducts(products, { query: "invoice ngn" });
  assert.ok(invoices.length >= 1);
  assert.ok(invoices.every((product) => /invoice/i.test(product.name + product.description)));
  const cash = filterProducts(products, { query: "sales cash" });
  assert.ok(cash.some((product) => /cash book/i.test(product.name)));

  const emails = filterProducts(products, { category: "saas-email-templates" });
  assert.ok(emails.length > 0);
  assert.ok(emails.every((product) => product.category === "saas-email-templates"));

  const none = filterProducts(products, { query: "zzznomatch" });
  assert.equal(none.length, 0);
});

test("the print and Canva planner keys do not collide", () => {
  assert.notEqual(
    productKey("Freelance Weekly Planner Pack (Print)"),
    productKey("Freelance Weekly Planner Pack — Editable Canva Templates (A4)"),
  );
});
