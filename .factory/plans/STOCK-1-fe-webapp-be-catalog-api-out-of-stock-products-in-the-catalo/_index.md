---
story: STOCK-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/97"
story-sha: 48d311c93b3d
plan-sha: 5c677a8d6708
verified-score: 9
verified-at: "2026-11-14T22:41:20.831Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: 8e48560056ff
automation-plan-sha: 5c677a8d6708
automation-score: 10
automation-verified-at: "2026-11-14T23:27:00.609Z"
---
# Test plan: STOCK-1 Out-of-stock products in the catalog

Scope: the new `onlyAvailable` query parameter of `GET /api/catalog/items` (API version 2.0) — filtering, counting, paging, combination with brand and type, validation and the unchanged v1.0 — as functional tests against the Catalog API fixture (criteria 1-4), and the WebApp's `In stock only` checkbox, `Out of stock` labels and the disabled `Add to shopping bag` button as e2e tests on the test stack (criteria 5-7).

Test data: functional cases set items 1 and 2 to `AvailableStock` 0 in the fixture database (items 3 to 101 at 100). TC-01 to TC-10 run in one xUnit test collection, so they run one at a time against the shared `CatalogApiFixture` database. TC-07 and TC-08 each set their own extra value (item 3 to 1, item 4 to -1) as their first step and restore it to 100 in a `finally` block, so the counts in TC-01 (99) and TC-06 (99) hold whatever order the cases run in. E2E cases use a new scenario `stock-1` (`extends: default`) that sets items 1 "Wanderer Black Hiking Boots" and 2 "Summit Pro Harness" to `AvailableStock` 0.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-STOCK-1-01 | onlyAvailable=true returns only in-stock products and counts them | happy | functional | AC1 |
| TC-STOCK-1-02 | Without onlyAvailable every product is returned | happy | functional | AC2 (absent) |
| TC-STOCK-1-03 | onlyAvailable=false returns every product | happy | functional | AC2 (false) |
| TC-STOCK-1-04 | onlyAvailable=true combined with a brand | happy | functional | AC3 |
| TC-STOCK-1-05 | onlyAvailable=true combined with a type | happy | functional | Outputs: all filters apply |
| TC-STOCK-1-06 | Paging pages over in-stock products only | happy | functional | Outputs: paging |
| TC-STOCK-1-07 | availableStock 1 is returned | sad (boundary) | functional | Inputs: > 0 |
| TC-STOCK-1-08 | Negative availableStock is excluded | sad (boundary) | functional | Open question 1 answer |
| TC-STOCK-1-09 | onlyAvailable=maybe returns 400 validation problem | sad (validation) | functional | AC4 |
| TC-STOCK-1-10 | API version 1.0 ignores onlyAvailable | happy | functional | Outputs: v1.0 unchanged |
| TC-STOCK-1-11 | Unchecked "In stock only" checkbox with the filters | happy | e2e | Inputs default, Outputs label |
| TC-STOCK-1-12 | Checking the box sets onlyAvailable=true, 11 pages | happy | e2e | AC5 |
| TC-STOCK-1-13 | Brand Daybird + filter hides product 1, keeps brand | happy | e2e | AC5, Inputs URL |
| TC-STOCK-1-14 | Filter hides product 2 among Gravitator products | happy | e2e | AC5 |
| TC-STOCK-1-15 | Reload keeps the filter checked | happy | e2e | AC5 |
| TC-STOCK-1-16 | Checking the box on page 12 returns to page 1 | happy | e2e | Open question 2 answer |
| TC-STOCK-1-17 | Card of product 1 shows "Out of stock" | happy | e2e | AC6 |
| TC-STOCK-1-18 | In-stock cards show no label | happy | e2e | AC6 |
| TC-STOCK-1-19 | Product page of product 1 shows "Out of stock" | happy | e2e | AC7 |
| TC-STOCK-1-20 | "Add to shopping bag" disabled for product 1 | sad (conflict) | e2e | AC7 |
| TC-STOCK-1-21 | In-stock product page: no label, button adds to bag | happy | e2e | AC7 |
| TC-STOCK-1-22 | Pager link 2 keeps onlyAvailable=true and the box checked | happy | e2e | Inputs: URL with page parameter |
| TC-STOCK-1-23 | Type then brand links keep the filter; all three apply | happy | e2e | Inputs: URL with brand and type, Outputs: all filters apply |

## Out of scope

- Back-in-stock notifications, stock counts shown to shoppers, reserving stock when a product is in a bag (Test scope).
- Brand and type facet counts in `CatalogSearch` taking `onlyAvailable` into account (not in the ACs; the implementation notes list it as a follow-up).
- The server-side guard in `ItemPage.AddToCartAsync` against a crafted post for an out-of-stock item (an implementation decision, not a story requirement).
- Authentication and ownership paths: catalog reads are anonymous and the story adds no protected data.

## Open questions

- Casing and spacing of the boolean: the story says "any other value is rejected" but does not say whether `True`, `TRUE` or `1` count as booleans (the implementation uses `bool.TryParse`, which accepts `True`/`TRUE` and rejects `1`). No case asserts these.
- An empty value (`onlyAvailable=`) is not defined by the story: treated as absent or rejected with 400?
- Exact wording of the validation message is not specified; TC-09 asserts only that `errors.onlyAvailable` is present and non-empty.
- Whether the brand and type filter badges should count only in-stock products when the filter is on.
