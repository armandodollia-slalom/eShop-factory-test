---
story: CAT-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/23"
story-sha: b7dbdcb4ab01
plan-sha: 4a547299f454
verified-score: 9
verified-at: "2026-11-13T16:17:44.201Z"
verified-by: test-planner@a978a288/27d172f2
---
# Test plan: CAT-1 [FE - WebApp, BE - Catalog.API] More from this brand on the product page

Scope: the `GET /api/catalog/items/{id}/brand-mates` endpoint (ordering, self exclusion, count default and limits, 404, 400, API versions, item shape) at the functional layer, and the "More from {brand}" section of the product page (shown with up to four cards, card links, hidden for a single-item brand) end to end in the browser. All cases use the new scenario `brand-mates` (extends `default`) described below.

## Scenario `brand-mates`

- Brand 14 "Brand Alpha": 1001 "Aardvark Target", 1002 "Bravo Pack", 1003 "Charlie Pack" (stock 0), 1004 "Delta Pack", 1005 "Echo Pack", 1006 "Foxtrot Pack", 1007 "alpha lowercase pack".
- Brand 15 "Brand Beta": 1011 "Aardvark Beta", 1012 "Bravo Beta", 1013 "Charlie Beta".
- Brand 16 "Brand Solo": 1020 "Lonely Lantern" (only item).

## Cases

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-CAT-1-01 | Default call returns the four first other items, ordered by name, without the item itself | happy | functional | AC1 |
| TC-CAT-1-02 | count=12 returns all six other items in ordinal name order | happy | functional | AC2 |
| TC-CAT-1-03 | count=1 returns only the first other item | sad (boundary) | functional | count lower bound |
| TC-CAT-1-04 | The only item of its brand gets 200 with an empty array | happy | functional | AC3 |
| TC-CAT-1-05 | Unknown item id returns 404 | sad (not-found) | functional | AC4 |
| TC-CAT-1-06 | count=0 returns 400 problem details | sad (boundary) | functional | AC5 |
| TC-CAT-1-07 | count=13 returns 400 problem details | sad (boundary) | functional | AC5 |
| TC-CAT-1-08 | The endpoint also answers on API version 2.0 | happy | functional | API versions |
| TC-CAT-1-09 | Out-of-stock brand-mates are included | happy | functional | Open Questions |
| TC-CAT-1-10 | Returned items have the same shape as GET /items/{id} | happy | functional | Outputs |
| TC-CAT-1-11 | A visitor sees "More from Brand Alpha" with four cards | happy | e2e | AC6 |
| TC-CAT-1-12 | A signed-in shopper sees the same section | happy | e2e | AC6 |
| TC-CAT-1-13 | Following a card opens that item's product page | happy | e2e | AC6 |
| TC-CAT-1-14 | The only item of its brand shows no section | sad (boundary) | e2e | AC7 |

## Out of scope

- Stock-based filtering (stock is not part of the story).
- Unit-level tests of `CatalogService` and the Razor component (Test scope puts the page at e2e).

## Open questions

- Non-integer or missing-value `count` (for example `count=abc`): the story only defines 1 to 12; the expected status is not stated, so no case.
- Whether an out-of-range `count` on an unknown id returns 400 or 404: not stated by the story, so no case.
- How the product page behaves when the brand-mates call fails (outage): not stated by the story, so no case.
- Whether 12 of 12 distinct cards or the default four cap applies to the page when more than four others exist beyond ordering ties: names are unique in the scenario, so ties are not tested.
