---
story: BUG-40
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/150"
story-sha: 10e238fe65ad
plan-sha: 1450fb86a0d4
verified-score: 9
verified-at: "2026-11-15T15:38:55.579Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: c4cfb072b703
automation-plan-sha: 1450fb86a0d4
automation-score: 9
automation-verified-at: "2026-11-15T16:46:42.658Z"
---
# Test plan: BUG-40 [FE - WebApp] - Sorting the catalog by price only reorders the products on the current page

Scope: the catalog's Sort control on the WebApp home page (`/`) must order the whole catalog, with the active brand and type filters, across all its pages, not just the nine cards on the current page. "Price: Low to High", "Price: High to Low" and "Name: Z to A" sort the whole result; "Name: A to Z" stays as today. Product count, filter counts, page count and 9 cards per page do not change, and the chosen sort stays selected on every page and after a reload.

The order across all 12 pages is checked exhaustively at the `functional` layer (`tests/Catalog.FunctionalTests`, v2 `GET /api/catalog/items` with the `sort` parameter the fix adds), because walking every page and comparing every price is cheap and exact there. The `e2e` cases (`e2e/teststack/bug-40.spec.ts`, scenario `default`) replay the bug report's steps through the WebApp and check what the user sees: cards, prices, counts, pagination, the selected label, the URL and persistence.

All data is the seeded `default` scenario (101 items, 13 brands, 8 types). Brand 2 is Gravitator (11 items), type 3 is Ski/boarding (18 items). Prices render as `$` + `N2` invariant (`$21.99`, `$699.00`). Each e2e case starts in a new browser context (empty localStorage) unless it says otherwise.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-40-01 | Price: Low to High puts the cheapest products on page 1 and continues on page 2 | happy | e2e | Steps to Reproduce 1-3; Expected bullet 1; Acceptance criterion |
| TC-BUG-40-02 | Price: High to Low orders the whole catalog from the most expensive product | happy | e2e | Expected bullet 2 (Price: High to Low) |
| TC-BUG-40-03 | Name: Z to A orders the whole catalog, ending with Adventurer GPS Watch on the last page | happy | e2e | Expected bullet 2 (Name: Z to A) |
| TC-BUG-40-04 | Name: A to Z stays the default order with no sort in the URL | happy | e2e | Expected bullet 2 (Name: A to Z stays as it is today) |
| TC-BUG-40-05 | Price sort applies to the filtered result across its pages | happy | e2e | Expected bullet 1 (with the active brand filter); Expected bullet 3 (filters) |
| TC-BUG-40-06 | Changing a filter keeps the chosen sort and sorts the new result | happy | e2e | Expected bullet 1 (with the active type filter); Expected bullet 4 (sort stays selected) |
| TC-BUG-40-07 | Sorting does not change the product count, filter counts, page count or cards per page | happy | e2e | Expected bullet 3 |
| TC-BUG-40-08 | The chosen sort stays selected on a later page and after a reload | happy | e2e | Expected bullet 4 (every page, after a reload) |
| TC-BUG-40-09 | Returning to the catalog without a sort restores the stored sort | happy | e2e | Expected bullet 4 ("as it does today": stored preference); Implementation Notes `sync` |
| TC-BUG-40-10 | Choosing a sort on page 3 starts the sorted catalog at page 1 | happy | e2e | Expected bullet 1 (page 1 starts with the cheapest); Implementation Notes (reset to page 1) |
| TC-BUG-40-11 | API: price-asc orders all 101 items across every page | happy | functional | Expected bullet 1; Expected bullet 3 (count, 9 per page) |
| TC-BUG-40-12 | API: price-desc orders all 101 items across every page | happy | functional | Expected bullet 2 (Price: High to Low) |
| TC-BUG-40-13 | API: name-desc orders all 101 items across every page | happy | functional | Expected bullet 2 (Name: Z to A) |
| TC-BUG-40-14 | API: no sort and name-asc return today's default order | happy | functional | Expected bullet 2 (Name: A to Z unchanged); Implementation Notes (default sends no `sort`) |
| TC-BUG-40-15 | API: sort with brand and type filters orders only the filtered items and keeps their count | happy | functional | Expected bullet 1 (with filters); Expected bullet 3 (count) |
| TC-BUG-40-16 | API: an unknown sort value falls back to the default order | sad | functional | Implementation Notes (unknown values fall back without error) |

## Out of scope

- Visual design of the Sort control (unchanged by this bug; the combobox markup and keyboard behaviour shipped earlier).
- The v1 `GET /api/catalog/items` endpoint and other `GetAllItems` callers: the bug and the fix do not change them.
- HybridApp: it implements `ICatalogService`, which is unchanged, and is not built here.
- `data-sort-name` / `data-sort-price` attributes on the cards: left in place, unused, with no observable behaviour.

## Open questions

- Re-choosing the sort that is already active "does nothing" per the Implementation Notes; the ticket does not state it, so no case asserts it.
- The ticket does not say what the WebApp shows for an unknown `?sort=` value in the URL; only the API fallback (TC-BUG-40-16, from the Implementation Notes) is planned.
- Name sorts depend on the database collation for names that differ only in case or punctuation (for example "VelociX 2000 Bike Helmet" and "Velocity Red Bike Helmet"). Name cases therefore assert only positions that are the same under ordinal and linguistic collation; for example, under ordinal (`C`) collation "Venture 2022 Snowboard" sorts after "Venture 2.0 40L Waterproof Duffel Bag" (so it comes first in Z to A), while under a linguistic collation such as `en_US.utf8` the order flips. TC-BUG-40-03 and TC-BUG-40-13 assert those two as a set in the last two places of page 1.
