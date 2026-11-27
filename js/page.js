import { isFreeProduct } from "./merge.js";
import {
  GUMROAD_EMAIL_NOTE,
  SITE_ORIGIN,
  escapeHtml,
  listedPrice,
  metaDescription,
  pageTitle,
  productJsonLd,
  productParagraphs,
} from "./seo.js";

const MARK = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#f6f1e6"/><rect x="6.5" y="6.5" width="19" height="19" rx="2" fill="none" stroke="#12382c" stroke-width="1.75"/><circle cx="16" cy="16" r="4.2" fill="none" stroke="#8a5a10" stroke-width="1.75"/></svg>`;

function freeBanner(products, currentSlug) {
  const free = products.filter(isFreeProduct).filter((product) => product.slug !== currentSlug);
  const shown = free.length ? free : products.filter(isFreeProduct);
  if (!shown.length) return "";
  const links = shown
    .map((product) => {
      const offer = product.offers.find((item) => Number(item.price) === 0);
      if (!offer) return "";
      return `<a href="${escapeHtml(offer.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(product.name)}</a> (${escapeHtml(listedPrice(offer))} on ${escapeHtml(offer.platform)})`;
    })
    .filter(Boolean)
    .join(" · ");
  return `<aside class="free-banner"><div class="free-banner-inner"><p><strong>Get a free template.</strong> ${escapeHtml(GUMROAD_EMAIL_NOTE)}</p><p>${links}</p></div></aside>`;
}

function buyLinks(product) {
  return product.offers
    .map((offer) => {
      const label = `Buy ${product.name} on ${offer.platform} for ${offer.priceLabel}. Opens in a new tab.`;
      return `<a class="buy" href="${escapeHtml(offer.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label)}"><span class="buy-platform">${escapeHtml(offer.platform)}</span><span class="buy-price">${escapeHtml(offer.priceLabel)}</span></a>`;
    })
    .join("\n          ");
}

export function renderProductPage(product, products) {
  const title = pageTitle(product);
  const description = metaDescription(product);
  const canonical = `${SITE_ORIGIN}/p/${product.slug}/`;
  const jsonLd = JSON.stringify(productJsonLd(product)).replaceAll("<", "\\u003c");
  const image = (product.imageUrls || []).find((url) => String(url).startsWith("https://"));
  const ogImage = image || `${SITE_ORIGIN}/assets/og.png`;
  const paragraphs = productParagraphs(product)
    .map((paragraph) => `        <p>${escapeHtml(paragraph)}</p>`)
    .join("\n");
  const figure = image
    ? `<figure class="product-figure"><img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" width="800" height="800"></figure>`
    : `<div class="product-figure placeholder" aria-hidden="true"><span>O</span></div>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta name="theme-color" content="#12382c">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="product">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:image" content="${escapeHtml(ogImage)}">
    <meta property="og:locale" content="en_NG">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(ogImage)}">
    <link rel="icon" href="../../favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="../../assets/apple-touch-icon.png">
    <link rel="stylesheet" href="../../css/styles.css">
    <script type="application/ld+json">${jsonLd}</script>
  </head>
  <body>
    <a class="skip" href="#product">Skip to product</a>
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="../../">${MARK}<span>O Square</span></a>
        <p class="header-note"><a href="../../">All templates</a></p>
      </div>
    </header>
    ${freeBanner(products, product.slug)}
    <main class="product" id="product">
      <p class="eyebrow">${escapeHtml(product.categoryLabel)}</p>
      <h1>${escapeHtml(product.name)}</h1>
      ${figure}
      <div class="product-copy">
${paragraphs}
      </div>
      <div class="buys">
          ${buyLinks(product)}
      </div>
    </main>
    <footer class="site-footer">
      <div class="footer-inner">
        <h2>O Square</h2>
        <p class="footer-lead">Digital templates by Obinna Odimba for shops, freelancers, and small businesses.</p>
        <ul class="social">
          <li><a href="https://instagram.com/osquareartist" rel="me noopener noreferrer" target="_blank">Instagram</a></li>
          <li><a href="https://x.com/Osquareartist" rel="me noopener noreferrer" target="_blank">X</a></li>
          <li><a href="https://tiktok.com/@Osquareartistt" rel="me noopener noreferrer" target="_blank">TikTok</a></li>
          <li><a href="https://youtube.com/@Osquareartist" rel="me noopener noreferrer" target="_blank">YouTube</a></li>
          <li><a href="https://www.facebook.com/osquare" rel="me noopener noreferrer" target="_blank">Facebook</a></li>
          <li><a href="https://www.linkedin.com/in/obinna-odimba" rel="me noopener noreferrer" target="_blank">LinkedIn</a></li>
        </ul>
        <p class="footer-note">Checkout happens on Gumroad, Selar, or Nestuge. This page does not take payment. © 2026 Obinna Odimba.</p>
      </div>
    </footer>
  </body>
</html>
`;
}

export function renderSitemap(products) {
  const urls = [SITE_ORIGIN + "/", ...products.map((product) => `${SITE_ORIGIN}/p/${product.slug}/`)];
  const body = urls
    .map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export function renderRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
}
