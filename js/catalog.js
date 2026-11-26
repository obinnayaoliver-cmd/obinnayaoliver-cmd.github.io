import { CATEGORIES, filterProducts, mergeProducts } from "./merge.js";

const grid = document.querySelector("#catalog");
const resultCount = document.querySelector("#result-count");
const chips = document.querySelector("#category-chips");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#q");
const emptyState = document.querySelector("#empty-state");
const status = document.querySelector("#status");

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

  const body = document.createElement("div");
  body.className = "card-body";

  const category = document.createElement("p");
  category.className = "eyebrow";
  category.textContent = product.categoryLabel;

  const title = document.createElement("h2");
  title.textContent = product.name;

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

  card.append(media, body, buys);
  return card;
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
