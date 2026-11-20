---
story: EPIC-359
story-sha: aa15da99e106
plan-sha: ab0dffd840bb
verified-score: 10
verified-at: "2026-11-20T12:09:49.235Z"
verified-by: test-planner@3b45d17c/council
automation-sha: ea3bfac5bae1
automation-plan-sha: ab0dffd840bb
automation-score: 10
automation-verified-at: "2026-11-20T14:58:14.932Z"
---
# Test plan: EPIC-359 Epic: Shop by brand (cross-story journeys)

Scope: the two end-to-end journeys that cross the stories of epic epic-brands (BRAND-1 Brands page and summary endpoint, BRAND-2 brand card to filtered catalog and back, BRAND-3 sort by name or product count). Each story's own behaviour is covered by its verified plan; this plan only checks that the pieces work together in one browser session. Every case runs on the e2e layer (Playwright through the WebApp on the test stack) with scenario `default` and an anonymous visitor, because the journeys are navigation between Blazor pages fed by the Catalog API.

Demo data used (scenario `default`, from the BRAND-1 and BRAND-3 plans): 13 brands, 101 items. Brand 1 "Daybird": 10 products (two catalog pages of 9 and 1), lowest price 49.99. Brand 2 "Gravitator": 11 products, lowest price 59.99; under "Most products" it is first (11, tied with "Raptor Elite" and "WildRunner", ahead of them by name). The header navigation marks the current link with class `is-current` (`HeaderBar.razor`).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-EPIC-359-01 | Header Brands link → Daybird card → filtered catalog → "All brands" back to /brands | happy | e2e | AC1 (BRAND-1, BRAND-2) |
| TC-EPIC-359-03 | Sort by "Most products", reload, then open the top brand's products | happy | e2e | AC2 (BRAND-1, BRAND-2, BRAND-3) |

## No sad path

The epic's acceptance criteria describe two successful journeys and name no error outcome. Every error case of the parts (invalid `sort` values returning 400 or falling back on the page, brands without products not being links) is already a case in the BRAND-1, BRAND-2 and BRAND-3 plans, and the epic changes none of them.

## Out of scope

- Single-story behaviour already covered by the story plans: summary endpoint contract (BRAND-1), header title rules for zero or several brands (BRAND-2), sort API validation and page fallback for unknown values (BRAND-3).
- Card styling and layout details.

## Open questions

- After choosing "Most products", opening a brand and selecting "All brands", the epic does not say whether the Brands page keeps `?sort=count`; the "All brands" link from BRAND-2 points to `/brands`. No case asserts the sort after returning.
- AC1 says the 'Brands' nav link "is marked current" without naming the mark; the plan uses the header's existing `is-current` class. The epic does not say whether the link is also marked current on `/brands?sort=count`; no case asserts it.
