# Data issues

Checked against the 26 Nov 2026 catalog notes. `data/products.json` is the verified list of 169 live buy pages. The storefront copies prices and URLs from that file. It does not invent either.

Rows below the “Excluded” heading are omitted in `EXCLUDED_URLS` inside `js/merge.js`. Everything else in the file is shown.

## Excluded from the storefront

### Nestuge: 7-Day Small Business Content Kit at ₦500

- URL: https://obinnadigital.nestuge.com/7-day-small-business-content-kit
- Price in the data: 500 NGN
- Same pack on the other stores: Gumroad $15, Selar ₦25,000
- Why it is excluded: ₦500 is an obvious bad price, the same kind of stray ₦500 that was later corrected on the Invoice pack (Nestuge Invoice is ₦28,000). The Gumroad and Selar listings still appear on the Content Kit card.

### Selar: POS Agent Float & Commission Tracker Pack (dead link)

- URL: https://selar.com/56m17c1215
- This URL returns 404. Selar did not reactivate it after a Canva-template takedown.
- It is not a row in `products.json`, and the site does not link to it.
- The pack is still on the page through the live Gumroad listing ($14) and the live Nestuge listing (₦21,000).

## Shown as listed

These are known gaps. The page keeps the recorded price and only the recorded URLs.

### Nestuge prices that are still in US dollars

Later Nestuge packs are in naira. These two early listings are still in dollars, and those dollar amounts match Gumroad, so they are shown as USD rather than converted:

- WhatsApp Business Status Pack — $12 — https://obinnadigital.nestuge.com/whatsapp-business-status-pack
- Freelance Weekly Planner Pack (Canva) — $15 — https://obinnadigital.nestuge.com/freelance-weekly-planner-pack

### Packs with no Nestuge URL in the source

No Nestuge slug was recorded, so none was added. The cards show Gumroad and Selar only:

- Market Vendor Daily Cash Sheet Pack
- Delivery Dispatch & COD Log Pack
- Customer Complaint & Refund Log Pack

### Other notes

- Selar is at its free-plan cap (39 live listings after the POS pack was removed). Packs added after the Tailor pack are Gumroad and Nestuge only.
- Quiet Wealth Systems is £49 GBP on Gumroad. The card shows £49.
- Two Gumroad products are priced at 0 and are labeled Free: the freelancer invoice template, and 10 email subject-line formulas.
- Four older Selar listings that are not Canva packs are included with their shop prices: AI-Powered Side Hustles (₦23,000), How to Get Pregnant in 30 Days Cover (₦21,000), MONTHLY PLANNER (₦3,000), and HOW TO GET A HUSBAND IN 30 DAYS (₦19,000).
- Three Gumroad descriptions begin with the words “Short description”. That label is hidden on the card. The rest of the sentence is unchanged.
- No public WhatsApp number was found, so the footer has no WhatsApp link. The Selar support chat (https://selar.com/support/odimba-obinna1) is included because it is published on the shop.

## How cards are merged

A card is one product. A row is one store. Rows share a card when the titles match after lowercasing, turning punctuation into spaces, and dropping the words Editable, Canva, Template(s), and A4, plus parentheses that only say Canva or A4.

`(Print)`, `(7 Days)`, and `(NGN + USD)` are kept, so the print weekly planner stays separate from the Canva weekly planner.
