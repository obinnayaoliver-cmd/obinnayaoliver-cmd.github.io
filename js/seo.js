/**
 * Titles, descriptions, and offer copy built only from catalog fields.
 * A phrase is added only when the product name, description, category, or store title supports it.
 */

export const SITE_ORIGIN = "https://obinnayaoliver-cmd.github.io";
export const GUMROAD_EMAIL_NOTE = "Gumroad asks for an email address before you receive the file.";

const TOPICS = [
  { pattern: /petty cash/i, phrase: "petty cash template" },
  { pattern: /cash book/i, phrase: "cash book template" },
  { pattern: /stock tracker|\binventory\b/i, phrase: "stock tracker template" },
  { pattern: /\binvoice\b/i, phrase: "invoice template" },
  { pattern: /\breceipts?\b/i, phrase: "receipt template" },
  { pattern: /\btimesheets?\b/i, phrase: "timesheet template" },
  { pattern: /\bbudget\b/i, phrase: "budget tracker" },
  { pattern: /profit (?:&|and) loss/i, phrase: "profit and loss template" },
  { pattern: /subject[- ]lines?/i, phrase: "email subject lines" },
];

export function listedPrice(offer) {
  if (Number(offer.price) === 0) {
    if (offer.currency === "USD") return "$0";
    if (offer.currency === "GBP") return "£0";
    if (offer.currency === "NGN") return "₦0";
    return `${offer.currency} 0`;
  }
  return offer.priceLabel;
}

export function keywordParts(product) {
  const blob = [product.name, product.description, ...(product.sourceNames || [])].join("\n");
  const has = (pattern) => pattern.test(blob);
  const nameHits = TOPICS.filter((entry) => entry.pattern.test(product.name));
  let topic = nameHits.length === 1 ? nameHits[0].phrase : null;
  if (!topic && /\bsaas\b/i.test(product.name) && /\bemails?\b/i.test(product.name)) {
    topic = /template/i.test(product.name) ? "SaaS email templates" : "SaaS emails";
  }
  if (topic && topic.endsWith("template") && !/template/i.test(blob)) {
    topic = topic.replace(/ template$/, "");
  }

  const nigeria = has(/\b(nigeria|nigerian|naira|ngn|keke|okada|aso-?ebi|ajo)\b/i);
  const freelance = has(/freelance/i);
  const founders = has(/\bfounders?\b/i);
  const smallBusiness = product.category === "canva-smb-templates" || has(/small business/i);
  const abroad = nigeria && /\b(usd|gbp|worldwide|abroad)\b/i.test(product.name);

  let audience = null;
  if (freelance && smallBusiness && nigeria && abroad) audience = "small businesses and freelancers in Nigeria and abroad";
  else if (freelance && nigeria && abroad) audience = "freelancers in Nigeria and abroad";
  else if (smallBusiness && nigeria && abroad) audience = "small businesses in Nigeria and abroad";
  else if (freelance && smallBusiness && nigeria) audience = "small businesses and freelancers in Nigeria";
  else if (freelance && nigeria) audience = "freelancers in Nigeria";
  else if (smallBusiness && nigeria) audience = "small businesses in Nigeria";
  else if (freelance && smallBusiness) audience = "small businesses and freelancers";
  else if (freelance) audience = "freelancers";
  else if (smallBusiness) audience = "small businesses";
  else if (founders) audience = "SaaS founders";

  return { topic, audience };
}

function coveredByName(phrase, name) {
  if (!phrase) return true;
  const nameL = name.toLowerCase();
  const words = phrase
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3 && word !== "and" && word !== "with");
  if (!words.length) return true;
  return words.every((word) => nameL.includes(word) || (word.endsWith("s") && nameL.includes(word.slice(0, -1))));
}

function cap(phrase) {
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

export function pageTitle(product) {
  const { topic, audience } = keywordParts(product);
  const topicText = topic && !coveredByName(topic, product.name) ? topic : "";
  const audienceText = audience && !coveredByName(audience, product.name) ? audience : "";
  let extra = "";
  if (topicText && audienceText) extra = `${cap(topicText)} for ${audienceText}`;
  else if (topicText) extra = cap(topicText);
  else if (audienceText) extra = `For ${audienceText}`;
  const full = extra ? `${product.name} | ${extra} | O Square` : `${product.name} | O Square`;
  if (full.length <= 100) return full;
  if (topicText) {
    const topicOnly = `${product.name} | ${topicText} | O Square`;
    if (topicOnly.length <= 100) return topicOnly;
  }
  return `${product.name} | O Square`;
}

export function priceClause(product) {
  const bits = product.offers.map((offer) => `${offer.platform} ${listedPrice(offer)}`);
  if (bits.length === 1) return `Listed price: ${bits[0]}.`;
  return `Listed prices: ${bits.join(", ")}.`;
}

export function formatSentence(sourceNames) {
  const blob = (sourceNames || []).join("\n");
  if (!blob.trim()) return "";
  const editable = /\beditable\b/i.test(blob);
  const canva = /\bcanva\b/i.test(blob);
  const a4 = /\ba4\b/i.test(blob);
  const signs = /\bsigns?\b/i.test(blob);
  const templates = /\btemplates?\b/i.test(blob);
  if (!editable && !canva && !a4 && !signs) return "";

  if (signs && !templates) {
    const label = [editable ? "editable" : "", canva ? "Canva" : "", "signs"].filter(Boolean).join(" ");
    return `The store title describes these as ${label}${a4 ? " (A4)" : ""}.`;
  }

  const noun = templates || canva ? "template" : "file";
  const label = [editable ? "editable" : "", canva && noun !== "file" ? "Canva" : "", noun]
    .filter(Boolean)
    .join(" ");
  const withSize = `${label}${a4 ? " (A4)" : ""}`;
  const article = /^[aeiou]/i.test(withSize) ? "an" : "a";
  return `The store title describes this as ${article} ${withSize}.`;
}

export function productParagraphs(product) {
  const paragraphs = [];
  const description = String(product.description || "").trim();
  if (description) paragraphs.push(description);
  const format = formatSentence(product.sourceNames);
  if (format) paragraphs.push(format);
  paragraphs.push(priceClause(product));
  return paragraphs;
}

function clip(text, max) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1).replace(/\s+\S*$/, "");
  return `${cut || clean.slice(0, max - 1)}…`;
}

export function metaDescription(product) {
  const { topic, audience } = keywordParts(product);
  const topicText = topic && !coveredByName(topic, product.name) ? topic : "";
  const audienceText = audience && !coveredByName(audience, product.name) ? audience : "";
  let lead = "";
  if (topicText && audienceText) lead = `${cap(topicText)} for ${audienceText}. `;
  else if (topicText) lead = `${cap(topicText)}. `;
  else if (audienceText) lead = `For ${audienceText}. `;
  const prices = priceClause(product);
  const room = Math.max(40, 170 - lead.length - prices.length - 1);
  const body = clip(product.description || product.name, room);
  return `${lead}${body} ${prices}`.replace(/\s+/g, " ").trim();
}

export function productJsonLd(product) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: `${SITE_ORIGIN}/p/${product.slug}/`,
    category: product.categoryLabel,
    brand: { "@type": "Brand", name: "O Square" },
    offers: product.offers.map((offer) => ({
      "@type": "Offer",
      url: offer.url,
      price: String(offer.price),
      priceCurrency: offer.currency,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Person", name: "Obinna Odimba" },
    })),
  };
  const image = (product.imageUrls || []).find((url) => String(url).startsWith("https://"));
  if (image) data.image = image;
  return data;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
