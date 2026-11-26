# O Square

Static storefront for Obinna Odimba’s digital templates. GitHub Pages serves this repository from the root of `main`. There is no build step.

The homepage groups the same pack on Gumroad, Selar, and Nestuge into one card. Each card has one buy button per store, with the price and currency from `data/products.json`.

## Preview locally

From the repository root:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Fetching the catalog needs a local server; opening `index.html` as a file will not load the product list.

Check the merge rules:

```bash
node --test tests/merge.test.mjs
```

## Add or edit a product

Edit `data/products.json`. It is a JSON array. Each object is one live buy page, not one card.

| Field | What to put |
| --- | --- |
| `name` | Product title, matching the other stores as closely as you can |
| `platform` | `Gumroad`, `Selar`, or `Nestuge` |
| `url` | Public `https` checkout link for that listing |
| `price` | Number charged on that store. Do not convert currency |
| `currency` | `USD`, `NGN`, or `GBP` |
| `description` | Short text from the listing |
| `image_url` | Cover image URL, or `""` if there is none |
| `category` | Category id. See the list below |

The page merges rows into one card when the titles match after it ignores punctuation and the format words `Editable`, `Canva`, `Template` / `Templates`, and `A4`. Parentheses that only say Canva or A4 are ignored too.

Keep real qualifiers in the title so different products stay separate:

- `Freelance Weekly Planner Pack (Print)` is not the Canva planner
- `Daily Freelancer Invoice Pack (NGN + USD)` stays intact
- `WhatsApp Business Status Pack (7 Days)` stays intact

Use the same category id on every store for that pack. Current ids:

- `canva-smb-templates` — Business templates
- `freelancer-kits` — Freelancer kits
- `saas-email-templates` — SaaS emails
- `notion-systems` — Notion systems
- `personal-finance` — Personal finance
- `ebook-and-planner` — Ebooks & planners
- `free-lead-magnet` — Free

A new id still appears as a filter. To give it a proper label, add it to `CATEGORIES` in `js/merge.js`.

A price of `0` is shown as Free.

## Prices and links that should not be shown

Do not invent a URL or a price. If a listing is an obvious typo or a dead link, leave it out of `data/products.json` or add its exact URL to `EXCLUDED_URLS` in `js/merge.js`, and write the reason in `DATA_ISSUES.md`.

Known cases are already recorded there, including the Nestuge Content Kit priced at ₦500 and the Selar POS pack that returns 404.

## Deploy

Push to `main`. GitHub Pages serves the files as they are. `.nojekyll` is present so Pages does not run Jekyll.
