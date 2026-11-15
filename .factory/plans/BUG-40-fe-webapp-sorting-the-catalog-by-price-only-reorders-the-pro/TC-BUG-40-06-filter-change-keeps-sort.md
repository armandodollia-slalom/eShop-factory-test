---
id: TC-BUG-40-06
type: happy
layer: e2e
covers: ["Expected: whole catalog with the active type filter in price order", "Expected: the chosen sort stays selected"]
priority: P1
---

# TC-BUG-40-06: Changing a filter keeps the chosen sort and sorts the new result

## Why

- Sort now lives in the URL, so filter links must carry it; if they dropped `sort`, picking a type after choosing a sort would silently return to Name: A to Z. This is the type-filter half of "with the active brand and type filters" and is separate from TC-BUG-40-05, where the filter was chosen before the sort.

## Preconditions

- Scenario `default` loaded: type 3 "Ski/boarding" has 18 items. New browser context.

## Steps

1. Open `BASE_URL` (`/`).
2. Click `#catalog-sort-trigger`, then the option named `Price: High to Low`; wait for the URL query `sort=price-desc`.
3. In the Type group, click the `.catalog-search-tag` link whose text starts with `Ski/boarding`.
4. Read the URL, `.catalog-count`, `.page-status`, `.catalog-sort-value` and the first and ninth cards.
5. Click the link with aria-label `Next page`; read the first, second and last cards.

## Expected result

- After step 3 the URL query contains `type=3` and `sort=price-desc` and no `page`.
- In step 4: `.catalog-count` reads `18 products`, `.page-status` reads `1 / 2`, `.catalog-sort-value` reads `Price: High to Low`, the first card is Gravity 5000 All-Mountain Skis `$699.00` and the ninth card is Shadow Black Snowboard `$379.00`.
- After step 5 the URL query contains `type=3`, `sort=price-desc` and `page=2`; page 2 shows 9 cards, the first is Raven Swift Snowboard `$349.00`, the second is Blizzard Rider Snowboard `$299.99` and the last is Zero Gravity Ski Goggles `$79.99`.
