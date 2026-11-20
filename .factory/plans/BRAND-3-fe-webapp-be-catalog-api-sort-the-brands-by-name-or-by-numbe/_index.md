---
story: BRAND-3
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/362"
story-sha: e584afde9809
plan-sha: aaf9dcf673a0
verified-score: 10
verified-at: "2026-11-20T11:43:43.203Z"
verified-by: test-planner@3b45d17c/council
automation-sha: 7d3fa0de5fd7
automation-plan-sha: aaf9dcf673a0
automation-score: 10
automation-verified-at: "2026-11-20T12:03:17.207Z"
---
# Test plan: BRAND-3 [FE - WebApp, BE - Catalog API] - Sort the brands by name or by number of products

Scope: the new optional `sort` query parameter of `GET /api/catalog/catalogbrands/summary` (AC4: `name` default, `count` = item count descending then name, any other value 400 with a problem naming the allowed values) is checked at the functional layer in the existing `BrandSummaryTests` class (its own `CatalogApiFixture` database with the unchanged demo catalog). The Brands page's Sort control (AC1–AC3: initial state, choosing "Most products", reload, direct link, unknown value, switching back) is checked at the e2e layer on the test stack with scenario `default`; no extra data is needed because the demo catalog already has brands with equal counts whose ids are not in name order.

Demo catalog in count order (count descending, ties by name), from `.factory/stack/scenarios/default`: Gravitator (2) 11, Raptor Elite (6) 11, WildRunner (3) 11, B&R (5) 10, Daybird (1) 10, Solstix (7) 9, Legend (12) 8, Green Equipment (10) 7, AirStrider (9) 6, Zephyr (11) 6, Grolltex (8) 5, Quester (4) 4, XE (13) 3. Name order: AirStrider, B&R, Daybird, Gravitator, Green Equipment, Grolltex, Legend, Quester, Raptor Elite, Solstix, WildRunner, XE, Zephyr.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BRAND-3-01 | Summary with sort=count orders brands by item count descending, ties by name | happy | functional | AC4 (count), AC2 (ties) |
| TC-BRAND-3-02 | Summary with sort=name orders brands alphabetically | happy | functional | AC4 (name) |
| TC-BRAND-3-03 | Summary without sort keeps the alphabetical order | happy | functional | AC4 (default) |
| TC-BRAND-3-04 | Summary with an unknown sort value answers 400 with a problem naming name and count | sad | functional | AC4 (400, allowed values) |
| TC-BRAND-3-05 | Summary with an empty sort value answers 400 | sad | functional | AC4 (any other value: empty) |
| TC-BRAND-3-06 | Summary with sort=COUNT (different case) answers 400 | sad | functional | AC4 (any other value: case) |
| TC-BRAND-3-07 | Brands page shows a Sort control with Name selected and cards in alphabetical order | happy | e2e | AC1 |
| TC-BRAND-3-08 | Choosing "Most products" reorders the cards by count and adds ?sort=count to the address | happy | e2e | AC2 |
| TC-BRAND-3-09 | Reloading after choosing "Most products" keeps the count order | happy | e2e | AC2 (reload) |
| TC-BRAND-3-10 | Opening /brands?sort=count directly shows "Most products" selected and the count order | happy | e2e | AC3, AC2 (shared link) |
| TC-BRAND-3-11 | Opening /brands with an unknown sort value shows the alphabetical order with "Name" selected | sad | e2e | AC3 (other value) |
| TC-BRAND-3-12 | Opening /brands?sort=COUNT shows the alphabetical order with "Name" selected | sad | e2e | AC3 (other value: case) |
| TC-BRAND-3-13 | Choosing "Name" after "Most products" restores the alphabetical order | happy | e2e | AC1, AC2 |

## Out of scope

- The control working without script, its styling, and two links vs. a segmented control: Implementation Notes guidance, not acceptance criteria.
- API version 2.0 of the endpoint: AC4 names the endpoint, not a version; v1 is exercised as in BRAND-1.
- Tie-breaking by brand id for equal names: an implementer decision; no data has two brands with the same name.
- Card content (counts text, prices, "No products yet"): covered by BRAND-1; only TC-BRAND-3-08 checks two cards' text to confirm the reordered cards still carry their own data.

## Open questions

- AC4 and AC3 do not say whether `sort` is case-sensitive. The plan takes the literal reading ("any other value") and the as-built decision: `COUNT` is another value (TC-BRAND-3-06, TC-BRAND-3-12).
- Behaviour when `sort` is given twice (for example `sort=name&sort=count`) is not defined by the story.
- Behaviour when the Catalog API is unreachable while the Brands page loads is not defined (unchanged from BRAND-1).
- The exact wording of the 400 problem's `title`/`detail` is not defined; cases assert only that the detail names `name` and `count`.
