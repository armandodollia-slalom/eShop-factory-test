---
id: TC-EPIC-359-03
type: happy
layer: e2e
covers: ["AC2: choosing 'Most products' adds ?sort=count and orders by count descending, then by name", "AC2: reload keeps the order and the selected option", "AC2: first card opens /?brand=<id of top brand> with header 'Brand: <that brand>' and that many items"]
priority: P1
---

# TC-EPIC-359-03: Sort by "Most products", reload, then open the top brand's products

## Why

- AC2 crosses all three stories: BRAND-3's sort control and URL state must survive a reload, and the cards it reorders must still carry BRAND-2's links to the right brand (a reorder that kept links in name order would open AirStrider from the Gravitator card). The top brand is decided by a tie (three brands at 11), so the case also proves the name tie-break reaches the link. e2e because it involves a browser reload and navigation.

## Preconditions

- Test stack running with scenario `default`. Anonymous visitor.

## Steps

1. Open `/brands`.
2. Click the "Most products" option of the Sort control.
3. Reload the page.
4. Click the first brand card.

## Expected result

- After step 2: the address is `/brands?sort=count`; "Most products" has `aria-current` set and "Name" does not; the 13 card headings in page order are "Gravitator", "Raptor Elite", "WildRunner", "B&R", "Daybird", "Solstix", "Legend", "Green Equipment", "AirStrider", "Zephyr", "Grolltex", "Quester", "XE".
- After step 3: the address is still `/brands?sort=count`; "Most products" still has `aria-current` and "Name" does not; the card order is the same as after step 2; the first card's text is "11 products · from $59.99".
- After step 4: the path is `/` with query `brand=2` (one `brand` value); the page header title reads "Brand: Gravitator"; the catalog toolbar reads "11 products".
