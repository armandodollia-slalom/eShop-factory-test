---
story: CAT-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/23"
story-sha: 1477684e79c9
plan-sha: ed2d60d18456
verified-score: 9
verified-at: "2026-11-13T13:12:47.325Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: 8b4465a5d6e0
automation-plan-sha: ed2d60d18456
automation-score: 10
automation-verified-at: "2026-11-13T13:18:55.000Z"
---
# Test plan: CAT-1 [FE - WebApp, BE - Catalog.API] More from this brand on the product page

Scope: the `GET /api/catalog/items/{id}/brand-mates` endpoint (rules, count limits, 404/400, API versions 1.0 and 2.0) at the functional layer, and the "More from {brand}" section of the product page `/item/{id}` end to end in the browser. The demo catalog has no single-item brand, so all cases use a new scenario.

## Test data

New scenario `brand-mates` (`extends: default`), adding catalog rows only. Type 1, price 10.00 and AvailableStock 50 unless stated.

- Brand 20 "Mates Co" with seven items: 201 "Alpha Tent", 202 "Bravo Tent" (AvailableStock 0), 203 "Charlie Tent", 204 "Delta Tent", 205 "Echo Tent", 206 "Foxtrot Tent", 207 "zulu tent" (lowercase first letter, last in ordinal order).
- Brand 21 "Solo Brand" with exactly one item: 210 "Lone Lantern".
- Brand 22 "Duo Brand" with exactly two items: 220 "Duo One" and 221 "Duo Two".
- No item has id 999999.

## Cases

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-CAT-1-01 | Default count returns the four first other items by name, excluding the item itself | happy | functional | AC1 |
| TC-CAT-1-02 | count=12 returns all six other items in ordinal name order | happy | functional | AC2, count upper bound |
| TC-CAT-1-03 | count=1 returns only the first other item by name | happy | functional | count lower bound |
| TC-CAT-1-04 | Only item of its brand returns 200 with an empty array | happy | functional | AC3 |
| TC-CAT-1-05 | Fewer mates than the default count returns all of them | happy | functional | at most count items |
| TC-CAT-1-06 | Out-of-stock brand-mates are included | happy | functional | answered open question |
| TC-CAT-1-07 | Returned items have the same shape as the single-item endpoint | happy | functional | output item shape |
| TC-CAT-1-08 | The endpoint is available and equivalent in API version 2.0 | happy | functional | API versions 1.0 and 2.0 |
| TC-CAT-1-09 | Unknown item id returns 404 | sad (not-found) | functional | AC4 |
| TC-CAT-1-10 | count=0 is rejected with 400 problem details | sad (boundary) | functional | AC5 |
| TC-CAT-1-11 | count=13 is rejected with 400 problem details | sad (boundary) | functional | AC5 |
| TC-CAT-1-12 | Negative count is rejected with 400 | sad (validation) | functional | count below 1 |
| TC-CAT-1-13 | Anonymous shopper sees "More from Mates Co" with four cards of other items | happy | e2e | AC6 |
| TC-CAT-1-14 | Following a brand-mate card opens that item's product page | happy | e2e | AC6 navigation |
| TC-CAT-1-15 | Signed-in shopper sees the same section | happy | e2e | AC6 signed in |
| TC-CAT-1-16 | Brand with fewer than four other items shows only those cards | happy | e2e | up to four cards |
| TC-CAT-1-17 | Single-item brand shows no "More from" section and the rest of the page is intact | sad (boundary) | e2e | AC7 |

## Out of scope

- Out-of-stock filtering (answered: included; only checked in TC-CAT-1-06).
- HybridApp and `ICatalogService` (not part of the story).
- Visual styling of the section beyond the heading and card content.

## Open questions

- Behavior for a non-integer `count` (for example `count=abc`) is not defined; no case written.
- Behavior when both an unknown id and an invalid `count` are given is not specified by the story; no case written.
- Behavior of the product page when Catalog.API fails while loading brand-mates is not defined; no case written.
- Exact problem details fields are not specified beyond "a problem details body"; cases check only `status` and `title`.
