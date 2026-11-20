---
story: BRAND-2
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/361"
story-sha: 08372f7a5eaf
plan-sha: 3cb892757b17
verified-score: 10
verified-at: "2026-11-20T10:24:33.322Z"
verified-by: test-planner@3b45d17c/council
automation-sha: 55f0ef522eb7
automation-plan-sha: 3cb892757b17
automation-score: 10
automation-verified-at: "2026-11-20T11:10:46.942Z"
---
# Test plan: BRAND-2 [FE - WebApp] - From a brand card to that brand's products

Scope: the WebApp journey from the Brands page (`/brands`) to the catalog filtered to one brand, and the catalog header that names a single filtered brand. Every case runs on the e2e layer (Playwright through the WebApp on the test stack). The behaviour is rendered markup and navigation in the WebApp, the catalog page reads the brand filter from the query string, and no Catalog API contract changes. The cases about brands with products use scenario `default`. The case about a brand without products (AC4) uses the existing scenario `brand-1`, which extends `default` with brand 14 "Acme Empty" (no items) and brand 15 "Mono Gear" (one item, 1001 "Mono Compass"), because every demo brand has products.

Demo data used (from `.factory/stack/scenarios/default/catalogdb.sql`): brand 1 "Daybird" has 10 items, brand 2 "Gravitator" has 11 items, 13 demo brands in total, 101 items. Type 1 is the type of item 1 "Wanderer Black Hiking Boots" (Daybird). The usual catalog header is title "Ready for a new adventure?" and subtitle "Start the season with the latest in clothing and equipment.".

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BRAND-2-01 | Selecting a brand's card opens the catalog filtered to that brand | happy | e2e | AC1 |
| TC-BRAND-2-02 | The card applies the same filter as choosing the brand in the catalog's Brand filter | happy | e2e | AC1 ("same filter as the Brand filter") |
| TC-BRAND-2-03 | Every brand card with products links to the catalog filtered to its own brand | happy | e2e | AC1 (every brand); Implementation Notes: `/?brand=<id>` |
| TC-BRAND-2-04 | Catalog filtered to one brand shows "Brand: Daybird" instead of the usual title | happy | e2e | AC2 (title) |
| TC-BRAND-2-05 | "All brands" link under the brand title opens the Brands page | happy | e2e | AC2 ("All brands" link) |
| TC-BRAND-2-06 | Choosing one brand in the catalog's Brand filter also names it in the header | happy | e2e | AC2 (any single-brand filter, not only from a card) |
| TC-BRAND-2-07 | One brand plus a type filter still names the brand in the header | happy | e2e | AC2 ("exactly one brand", other filters irrelevant) |
| TC-BRAND-2-08 | Catalog without a brand filter shows the usual title and no "All brands" link | happy | e2e | AC3 (no brand filter) |
| TC-BRAND-2-09 | Catalog filtered to two brands shows the usual title and no "All brands" link | happy | e2e | AC3 (more than one brand); Implementation Notes: two `brand` query values |
| TC-BRAND-2-10 | Card of a brand without products is not a link and says "No products yet" | happy | e2e | AC4 |

## No sad path

The ticket names no error outcome: AC1 to AC4 describe navigation and header text for valid states only. A brand without products (AC4) and a multi-brand or brand-less filter (AC3) are stated outcomes and are covered as happy cases. The Implementation Notes' decisions about an unknown brand id and a failing `GetBrands()` are the implementer's account, not ticket requirements; they are listed under Open questions.

## Out of scope

- Card link styling (`.brand-card-link`: no underline, link colour, focus outline) and the `catalog-all-brands` class: implementation guidance, not acceptance criteria.
- The empty header while the brand name streams in (no flash of the usual title): an implementer decision about stream rendering, not an acceptance criterion, and timing-dependent in a browser.
- The Brands page content from BRAND-1 (heading, order, card text for brands with products): covered by the BRAND-1 plan.

## Open questions

- `/?brand=999` (exactly one `brand` value that matches no brand): the ticket does not say what the header shows. The Implementation Notes decide "keeps the usual title"; no case asserts it.
- The ticket does not define the header when the Catalog API's brand list cannot be loaded (HTTP error or timeout). The Implementation Notes decide that the catalog renders with the usual title; there is no test stack fault injection for it, and no case asserts it.
- `/?brand=1&brand=1` (the same brand id twice): the ticket's "exactly one brand" could mean one distinct brand or one query value; the Implementation Notes read it as one query value. No case asserts it.
