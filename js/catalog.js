import { CATEGORIES, filterProducts, isFreeProduct, mergeProducts } from "./merge.js";
import { GUMROAD_EMAIL_NOTE, listedPrice } from "./seo.js";

const grid = document.querySelector("#catalog");
const resultCount = document.querySelector("#result-count");
const chips = document.querySelector("#category-chips");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#q");
const emptyState = document.querySelector("#empty-state");
const status = document.querySelector("#status");
const freeSection = document.querySelector("#free");
const freeNote = document.querySelector("#free-note");
const freeList = document.querySelector("#free-list");

const params = new URLSearchParams(location.search);
let activeCategory = params.get("cat") || "";
let query = params.get("q") || "";
let allProducts = [];

searchInput.value = query;

function httpsUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function writeUrl() {
  const next = new URLSearchParams();
  if (activeCategory) next.set("cat", activeCategory);
  if (query) next.set("q", query);
  const search = next.toString();
  const path = location.pathname;
  history.replaceState(null, "", search ? `${path}?${search}` : path);
}

function categoriesFor(products) {
  const present = new Set(products.map((product) => product.category));
  const known = CATEGORIES.filter((category) => present.has(category.id));
  const extras = [...present]
    .filter((id) => !CATEGORIES.some((category) => category.id === id))
    .map((id) => ({
      id,
      label: products.find((product) => product.category === id)?.categoryLabel || id,
    }));
  return [...known, ...extras];
}

function renderChips(products) {
  chips.replaceChildren();
  const categories = [{ id: "", label: "All" }, ...categoriesFor(products)];
  if (activeCategory && !categories.some((category) => category.id === activeCategory)) {
    activeCategory = "";
  }

  for (const category of categories) {
    const count = category.id
      ? products.filter((product) => product.category === category.id).length
      : products.length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.setAttribute("aria-pressed", String(category.id === activeCategory));
    button.dataset.category = category.id;
    button.append(document.createTextNode(category.label));
    const countEl = document.createElement("span");
    countEl.className = "chip-count";
    countEl.textContent = String(count);
    button.append(countEl);
    button.addEventListener("click", () => {
      activeCategory = category.id;
      for (const chip of chips.querySelectorAll(".chip")) {
        chip.setAttribute("aria-pressed", String(chip.dataset.category === activeCategory));
      }
      writeUrl();
      render();
    });
    chips.append(button);
  }
}

function attachImage(frame, urls, eager) {
  const placeholder = frame.querySelector(".placeholder");
  const usable = urls.map(httpsUrl).filter(Boolean);
  if (usable.length === 0) return;

  const image = document.createElement("img");
  image.alt = "";
  image.hidden = true;
  image.decoding = "async";
  if (eager) image.fetchPriority = "high";
  else image.loading = "lazy";
  let index = 0;
  const showNext = () => {
    if (index >= usable.length) {
      image.remove();
      return;
    }
    image.src = usable[index];
    index += 1;
  };
  image.addEventListener("load", () => {
    image.hidden = false;
    placeholder.hidden = true;
  });
  image.addEventListener("error", showNext);
  frame.append(image);
  showNext();
}

function renderCard(product, eager) {
  const card = document.createElement("article");
  card.className = "card";

  const media = document.createElement("div");
  media.className = "media";
  const placeholder = document.createElement("div");
  placeholder.className = "placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  const mark = document.createElement("span");
  mark.textContent = "O";
  placeholder.append(mark);
  media.append(placeholder);
  attachImage(media, product.imageUrls, eager);
  const mediaLink = document.createElement("a");
  mediaLink.className = "media-link";
  mediaLink.href = `p/${product.slug}/`;
  mediaLink.setAttribute("aria-label", `Details for ${product.name}`);
  mediaLink.append(media);

  const body = document.createElement("div");
  body.className = "card-body";

  const category = document.createElement("p");
  category.className = "eyebrow";
  category.textContent = product.categoryLabel;

  const title = document.createElement("h2");
  const titleLink = document.createElement("a");
  titleLink.href = `p/${product.slug}/`;
  titleLink.textContent = product.name;
  title.append(titleLink);

  const description = document.createElement("p");
  description.className = "desc";
  description.textContent = product.description;

  body.append(category, title, description);

  const buys = document.createElement("div");
  buys.className = "buys";
  for (const offer of product.offers) {
    const href = httpsUrl(offer.url);
    if (!href) continue;
    const link = document.createElement("a");
    link.className = "buy";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute(
      "aria-label",
      `Buy ${product.name} on ${offer.platform} for ${offer.priceLabel}. Opens in a new tab.`,
    );
    const platform = document.createElement("span");
    platform.className = "buy-platform";
    platform.textContent = offer.platform;
    const price = document.createElement("span");
    price.className = "buy-price";
    price.textContent = offer.priceLabel;
    link.append(platform, price);
    buys.append(link);
  }

  card.append(mediaLink, body, buys);
  return card;
}

function renderFree(products) {
  const free = products.filter(isFreeProduct);
  if (!free.length) {
    freeSection.hidden = true;
    return;
  }
  const noun = free.length === 1 ? "download" : "downloads";
  const freeOffers = free.flatMap((product) => product.offers.filter((offer) => Number(offer.price) === 0));
  const platforms = [...new Set(freeOffers.map((offer) => offer.platform))].join(" and ");
  const prices = [...new Set(freeOffers.map((offer) => listedPrice(offer)))].join(", ");
  freeNote.textContent = `${free.length} free ${noun} on ${platforms} (${prices}). ${GUMROAD_EMAIL_NOTE}`;
  freeList.replaceChildren();
  for (const product of free) {
    const offer = product.offers.find((item) => Number(item.price) === 0);
    const card = document.createElement("article");
    card.className = "free-card";
    const heading = document.createElement("h3");
    const details = document.createElement("a");
    details.href = `p/${product.slug}/`;
    details.textContent = product.name;
    heading.append(details);
    const copy = document.createElement("p");
    copy.textContent = product.description;
    const button = document.createElement("a");
    button.className = "buy";
    button.href = httpsUrl(offer.url);
    button.target = "_blank";
    button.rel = "noopener noreferrer";
    button.setAttribute(
      "aria-label",
      `Get ${product.name} free on ${offer.platform}. Opens in a new tab.`,
    );
    const label = document.createElement("span");
    label.textContent = `Get it free on ${offer.platform}`;
    const price = document.createElement("span");
    price.className = "buy-price";
    price.textContent = listedPrice(offer);
    button.append(label, price);
    card.append(heading, copy, button);
    freeList.append(card);
  }
  freeSection.hidden = false;
}

function render() {
  const visible = filterProducts(allProducts, { category: activeCategory, query });
  const fragment = document.createDocumentFragment();
  visible.forEach((product, index) => fragment.append(renderCard(product, index < 6)));
  grid.replaceChildren(fragment);

  const noun = visible.length === 1 ? "template" : "templates";
  const filtered = Boolean(activeCategory || query.trim());
  resultCount.textContent = filtered
    ? `Showing ${visible.length} of ${allProducts.length} ${allProducts.length === 1 ? "template" : "templates"}`
    : `${visible.length} ${noun}`;

  emptyState.hidden = visible.length !== 0;
  grid.hidden = visible.length === 0;
}

function showFailure() {
  status.hidden = false;
  status.textContent =
    "The catalog could not be loaded. You can still shop on Gumroad, Selar, or Nestuge using the links above.";
  resultCount.textContent = "";
}

async function init() {
  try {
    const response = await fetch("data/products.json");
    if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Catalog is not a list");
    allProducts = mergeProducts(rows).products;
    status.hidden = true;
    renderFree(allProducts);
    renderChips(allProducts);
    render();
  } catch {
    showFailure();
  }
}

searchInput.addEventListener("input", () => {
  query = searchInput.value;
  writeUrl();
  render();
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  query = searchInput.value;
  writeUrl();
  render();
});

document.querySelector("#clear-filters").addEventListener("click", () => {
  query = "";
  activeCategory = "";
  searchInput.value = "";
  for (const chip of chips.querySelectorAll(".chip")) {
    chip.setAttribute("aria-pressed", String(chip.dataset.category === ""));
  }
  writeUrl();
  render();
  searchInput.focus();
});

init();
