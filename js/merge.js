/**
 * Merge one-row-per-store listings into one product.
 * Prices and URLs are copied from the data. Nothing is invented.
 */

export const EXCLUDED_URLS = new Set([
  // Nestuge lists this pack at ₦500. The same pack is $15 on Gumroad and ₦25,000 on Selar.
  "https://obinnadigital.nestuge.com/7-day-small-business-content-kit",
]);

export const PLATFORM_ORDER = ["Selar", "Nestuge", "Gumroad"];

export const CATEGORIES = [
  { id: "canva-smb-templates", label: "Business templates" },
  { id: "freelancer-kits", label: "Freelancer kits" },
  { id: "saas-email-templates", label: "SaaS emails" },
  { id: "notion-systems", label: "Notion systems" },
  { id: "personal-finance", label: "Personal finance" },
  { id: "ebook-and-planner", label: "Ebooks & planners" },
  { id: "free-lead-magnet", label: "Free" },
];

const CURRENCY_SYMBOLS = { USD: "$", GBP: "£", NGN: "₦" };

const PAREN_FORMAT = /\s*\((?:canva,\s*a4|canva|a4)\)\s*$/i;
const FORMAT_SUFFIX =
  /\s*(?:[—–-]\s*)?(?:editable\s+)?canva(?:\s+(?:templates?|signs))?(?:\s+for\s+small\s+businesses)?(?:\s*\(a4\))?\s*$/i;

export function categoryLabel(id) {
  const known = CATEGORIES.find((category) => category.id === id);
  if (known) return known.label;
  return String(id || "Other")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function productKey(name) {
  let key = String(name).toLowerCase().replaceAll("&", " and ");
  key = key.replaceAll("—", " ").replaceAll("–", " ").replaceAll("-", " ");
  key = key.replace(/\([^)]*\b(?:canva|a4)\b[^)]*\)/g, " ");
  key = key.replace(/\beditable\b/g, " ");
  key = key.replace(/\bcanva\b/g, " ");
  key = key.replace(/\btemplates?\b/g, " ");
  key = key.replace(/\ba4\b/g, " ");
  key = key.replace(/[^a-z0-9]+/g, " ");
  return key.replace(/\s+/g, " ").trim();
}

/** Drop repeated format boilerplate. Keep qualifiers such as (Print) and (NGN + USD). */
export function displayName(name) {
  let cleaned = String(name).replace(/\s+/g, " ").trim();
  let previous = "";
  while (cleaned !== previous) {
    previous = cleaned;
    cleaned = cleaned.replace(PAREN_FORMAT, "");
    cleaned = cleaned.replace(FORMAT_SUFFIX, "").trim();
    cleaned = cleaned.replace(/[—–-]\s*$/, "").trim();
  }
  return cleaned;
}

export function formatPrice(price, currency) {
  const amount = Number(price);
  if (amount === 0) return "Free";
  const formatted = Number.isInteger(amount)
    ? amount.toLocaleString("en-US")
    : amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  const symbol = CURRENCY_SYMBOLS[currency];
  return symbol ? symbol + formatted : `${currency} ${formatted}`;
}

function platformRank(platform) {
  const index = PLATFORM_ORDER.indexOf(platform);
  return index === -1 ? PLATFORM_ORDER.length : index;
}

function chooseDescription(offers) {
  const descriptions = offers.map((offer) =>
    String(offer.description || "")
      .replace(/^Short description\s+/i, "")
      .trim(),
  );
  descriptions.sort((a, b) => b.length - a.length);
  return descriptions[0] || "";
}

function mostCommon(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  let best = values[0];
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function imageUrlsFor(offers) {
  const urls = [];
  for (const platform of ["Gumroad", "Selar", "Nestuge"]) {
    const offer = offers.find((row) => row.platform === platform && row.image_url);
    if (offer && !urls.includes(offer.image_url)) urls.push(offer.image_url);
  }
  for (const offer of offers) {
    if (offer.image_url && !urls.includes(offer.image_url)) urls.push(offer.image_url);
  }
  return urls;
}

export function mergeProducts(rows) {
  const groups = new Map();
  const excluded = [];

  for (const row of rows) {
    if (EXCLUDED_URLS.has(row.url)) {
      excluded.push(row);
      continue;
    }
    const key = productKey(row.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const products = [];
  for (const [id, offers] of groups) {
    const longestName = offers.slice().sort((a, b) => b.name.length - a.name.length)[0].name;
    const category = mostCommon(offers.map((offer) => offer.category));
    const ordered = offers
      .slice()
      .sort((a, b) => platformRank(a.platform) - platformRank(b.platform) || a.url.localeCompare(b.url));

    products.push({
      id,
      name: displayName(longestName),
      description: chooseDescription(offers),
      category,
      categoryLabel: categoryLabel(category),
      imageUrls: imageUrlsFor(offers),
      offers: ordered.map((offer) => ({
        platform: offer.platform,
        url: offer.url,
        price: offer.price,
        currency: offer.currency,
        priceLabel: formatPrice(offer.price, offer.currency),
      })),
    });
  }

  products.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" }));
  return { products, excluded };
}

export function filterProducts(products, { category = "", query = "" } = {}) {
  const tokens = String(query).trim().toLowerCase().split(/\s+/).filter(Boolean);
  return products.filter((product) => {
    if (category && product.category !== category) return false;
    if (tokens.length === 0) return true;
    const haystack = [
      product.name,
      product.description,
      product.category,
      product.categoryLabel,
      ...product.offers.flatMap((offer) => [
        offer.platform,
        offer.priceLabel,
        String(offer.price),
        offer.currency,
      ]),
    ]
      .join(" ")
      .toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}
