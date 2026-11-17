---
story: PRB-13
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/232"
story-sha: f1347c618344
plan-sha: 6d8005831774
verified-score: 10
verified-at: "2026-11-17T15:33:03.245Z"
verified-by: test-planner@6ab9e852/council
automation-sha: 259e2abb9c53
automation-plan-sha: 6d8005831774
automation-score: 10
automation-verified-at: "2026-11-17T17:20:01.064Z"
---
# Test plan: PRB-13 [FE - WebApp] - [PROBE] A "Surprise me" link on the catalog page opens a random product

Scope: the WebApp catalog page (`/`) gains a "Surprise me" link in the filter panel that opens the product page (`/item/{id}`) of a random product among those the current brand/type filters list, and is hidden when the filters list no product. Everything is user-visible behaviour of the WebApp, so every case runs on the `e2e` layer (Playwright, `e2e/teststack/`) against the seeded `default` scenario (101 products, 13 brands, 8 types). Filter combinations used, from the seed: brand XE = 3 products (Survivor 2-Person Tent, Pathfinder GPS Watch, Nomad 2-Person Tent); XE + Navigation = 1 product (Pathfinder GPS Watch); XE + Climbing = 0 products; type Cycling = 9 products (exactly one catalog page). No extra scenario data is needed.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-PRB-13-01 | "Surprise me" link is shown in the filter panel of the unfiltered catalog | happy | e2e | AC1 |
| TC-PRB-13-02 | Without filters, "Surprise me" opens the product page of a catalog product | happy | e2e | AC2 (opens a product page) |
| TC-PRB-13-03 | Repeated "Surprise me" clicks open different products | happy | e2e | AC2 (random each time) |
| TC-PRB-13-04 | With a brand selected, every surprise product belongs to that brand | happy | e2e | AC3 (brand filter) |
| TC-PRB-13-05 | With a type selected, every surprise product is one the filtered list shows | happy | e2e | AC3 (type filter) |
| TC-PRB-13-06 | With brand and type selected that list one product, "Surprise me" always opens that product | happy | e2e | AC3 (brand and type), AC4 boundary just inside (1 product) |
| TC-PRB-13-07 | Filters that list no product hide the "Surprise me" link | sad | e2e | AC4 |
| TC-PRB-13-08 | The rest of the catalog page is unchanged | happy | e2e | AC5 |

## Out of scope

- The HybridApp catalog (it shares `CatalogSearch` but passes no link; the story is about the WebApp catalog page only).
- Visual styling of the link (`button button-secondary`, `.catalog-search-extra` spacing) beyond its presence and position in the filter panel; that is the design review's job.
- Opening `/surprise` directly by URL (not through the link): the redirect to the filtered catalog on an empty list is an implementation detail, not an acceptance criterion (see Open questions).

## Open questions

- AC4 only says the link is hidden when the filters list no product. What a shopper sees when `/surprise?brand=..&type=..` is opened directly for an empty filter set (the notes say it redirects to the catalog with the same filters) is not part of the acceptance criteria, so no case asserts it.
- AC2 says "chosen at random each time" without a statistical bar. TC-PRB-13-03 reads it literally as "not always the same product": 10 clicks over 101 products must open at least two distinct products (the chance a uniform pick repeats 10 times is 101^-9).
- AC3 with several brands or types selected at once (the filters are multi-select) is not named explicitly; the cases use one brand and/or one type.
