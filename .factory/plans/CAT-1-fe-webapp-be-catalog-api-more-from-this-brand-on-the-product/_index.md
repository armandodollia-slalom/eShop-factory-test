---
story: CAT-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/23"
story-sha: d74a3f6c8055
plan-sha: 31fff72b8fd4
verified-score: 10
verified-at: "2026-11-13T18:04:45.120Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: ac760b27feb9
automation-plan-sha: 31fff72b8fd4
automation-score: 9
automation-verified-at: "2026-11-13T18:35:29.505Z"
---
# Test plan: CAT-1 [FE - WebApp, BE - Catalog.API] More from this brand on the product page

Scope: the endpoint `GET /api/catalog/items/{id}/brand-mates` (ordering, self-exclusion, `count` limits, 404, 400, item shape, API versions, anonymous access) at the functional layer, and the "More from {brand}" section of `/item/{id}` end to end in the browser. All cases use one new scenario, `brand-mates`, which `extends: default` (the demo catalog has no brand with a single item). The scenario adds brand 14 "Peak Gear" with items 1001 to 1007 (including the lowercase name "alpha Tent" for ordinal ordering and the out-of-stock item 1004), brand 15 "Solo Gear" with the single item 1008, brand 16 "Trail Co" with items 1009 to 1011 and brand 17 "Twin Gear" with items 1012 to 1014 (1013 and 1014 share the name "Twin Mug"); the full table is in each case's Preconditions.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-CAT-1-01 | Default count returns the first four other items by name, without the item itself | happy | functional | AC1, default count, anonymous |
| TC-CAT-1-02 | count=12 returns all six other items in ordinal name order | happy | functional | AC2, upper bound, ordinal order |
| TC-CAT-1-03 | count=1 returns only the first other item by name | happy | functional | lower bound |
| TC-CAT-1-04 | The only item of its brand gets 200 with an empty array | happy | functional | AC3 |
| TC-CAT-1-05 | Unknown item id returns 404 | sad | functional | AC4 |
| TC-CAT-1-06 | count=0 is rejected with 400 problem details | sad | functional | AC5 |
| TC-CAT-1-07 | count=13 is rejected with 400 problem details | sad | functional | AC5 |
| TC-CAT-1-08 | Each returned item has the same fields and values as GET items/{id} | happy | functional | item shape |
| TC-CAT-1-09 | The endpoint answers the same on API version 2.0 as on 1.0 | happy | functional | API versions |
| TC-CAT-1-10 | An out-of-stock item of the same brand is returned | happy | functional | Open Questions answer |
| TC-CAT-1-11 | A visitor sees "More from Peak Gear" with four product cards | happy | e2e | AC6 |
| TC-CAT-1-12 | Following a brand-mate card opens that item's product page | happy | e2e | AC6 |
| TC-CAT-1-13 | A signed-in shopper sees the same section | happy | e2e | AC6 |
| TC-CAT-1-14 | A single-item brand shows no "More from" section | happy | e2e | AC7 |
| TC-CAT-1-15 | Out-of-range count on an unknown id is 400, not 404 | sad | functional | count validated before lookup |
| TC-CAT-1-16 | A brand with two other items shows the heading and exactly two cards | happy | e2e | AC6, up to four |
| TC-CAT-1-17 | Items with identical names are ordered by id | happy | functional | Id tie-breaker |
| TC-CAT-1-18 | CatalogService.GetBrandMates surfaces HTTP errors and bad JSON as the exceptions the page handles | sad | unit | failed call handling |

## Out of scope

- Unit-level tests of the endpoint and the page rules (the Test scope puts them at API level and in the browser); the only unit case is TC-CAT-1-18.
- Page-level rendering when the brand-mates call fails: the call is server-to-server, so no browser intercept can fail it; TC-CAT-1-18 covers the service contract the page's catch relies on.

## Open questions

- `count` that is not an integer (for example `count=abc`): the story only defines 400 for values below 1 or above 12. No case written.
