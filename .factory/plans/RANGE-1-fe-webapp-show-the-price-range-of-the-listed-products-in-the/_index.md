---
story: RANGE-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/223"
story-sha: 23f5fe64a847
plan-sha: 5d6c1f427549
verified-score: 10
verified-at: "2026-11-17T11:49:29.114Z"
verified-by: test-planner@6ab9e852/council
automation-sha: 7c2dff8afaf6
automation-plan-sha: 5d6c1f427549
automation-score: 10
automation-verified-at: "2026-11-17T12:15:37.634Z"
---
# Test plan: RANGE-1 [FE - WebApp] - Show the price range of the listed products in the catalog

Scope: the new `minPrice` and `maxPrice` fields of `GET /api/catalog/items/facets` (no filter, brand, type, brand and type, repeated brand and repeated type filters, equal bounds, no match, other fields unchanged) at the functional layer against the seeded demo catalog, and the price range shown in the catalog toolbar of the WebApp (`/`) end to end on the test stack: unfiltered, each filter of AC2 chosen through the filter links, a single-price selection, an empty selection, and the range staying put across page and sort changes. Every case uses the `default` scenario as is; the demo catalog already holds every selection the story names plus a two-item selection with one price (Raptor Elite + Cycling: items 58 and 86, both $79.99) and an empty one (Daybird + Navigation). The catalog lists 9 products per page ordered by name; page 1 of the unfiltered catalog spans only $79.99 to $249.99, so the unfiltered cases prove the range covers every page.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-RANGE-1-01 | Facets without filters return minPrice 21.99 and maxPrice 699.00 | happy | functional | AC6, AC1 data |
| TC-RANGE-1-02 | Facets for brand Daybird return 49.99 and 449.99 | happy | functional | AC6, AC2 brand |
| TC-RANGE-1-03 | Facets for type Navigation return 59.99 and 299.00 | happy | functional | AC6, AC2 type |
| TC-RANGE-1-04 | Facets for brand Daybird and type Footwear return 109.99 and 149.99 | happy | functional | AC6, AC2 brand and type |
| TC-RANGE-1-05 | Repeated brand parameters return the range of the union of those brands | happy | functional | AC6 repeated `brand` |
| TC-RANGE-1-06 | A selection whose items share one price returns equal minPrice and maxPrice | happy | functional | AC6, AC3 data |
| TC-RANGE-1-07 | A selection with no items returns null for minPrice and maxPrice | happy | functional | AC6 null when none match, AC4 data |
| TC-RANGE-1-08 | The facets' existing fields are unchanged by the new price fields | happy | functional | AC6 other fields unchanged |
| TC-RANGE-1-09 | Unfiltered catalog toolbar shows "101 products" and "Prices $21.99 – $699.00" in the count's style | happy | e2e | AC1 |
| TC-RANGE-1-10 | Choosing brand Daybird shows "Prices $49.99 – $449.99" | happy | e2e | AC2 brand Daybird |
| TC-RANGE-1-11 | Choosing type Navigation shows "Prices $59.99 – $299.00" | happy | e2e | AC2 type Navigation |
| TC-RANGE-1-12 | Choosing brand Daybird and type Footwear shows "Prices $109.99 – $149.99" | happy | e2e | AC2 brand and type |
| TC-RANGE-1-13 | A selection whose products share one price shows "Price $79.99" | happy | e2e | AC3 |
| TC-RANGE-1-14 | A selection with no products shows no price range | happy | e2e | AC4 |
| TC-RANGE-1-15 | Moving to page 2 keeps the range of the whole selection | happy | e2e | AC5 page change |
| TC-RANGE-1-16 | Changing the sort order keeps the range of the whole selection | happy | e2e | AC5 sort change |
| TC-RANGE-1-17 | Repeated type parameters return the range of the union of those types | happy | functional | AC6 repeated `type` |

## Out of scope

- API version 2.0 of the facets endpoint: the story does not mention API versions; the endpoint is mapped on both and its contract is the same.
- The behaviour when the facets call fails (range left out, filters without counts): it is an Implementation Notes decision, not an acceptance criterion (see Open questions).
- The filter badge counts themselves beyond checking they are unchanged (TC-RANGE-1-08): they belong to an earlier story.

## No sad path

The story adds two read-only fields to an anonymous GET endpoint and a line of text to the catalog toolbar. It names no error outcome and changes no existing one: the "no products" outcome (AC4, AC6 `null`) is specified behaviour and is covered by the happy cases TC-RANGE-1-07 and TC-RANGE-1-14, and the facets endpoint has no authentication, ownership or state to violate.

## Open questions

- When the facets call fails, the Implementation Notes leave the range out and log the failure. The acceptance criteria say nothing about it, so no case asserts it.
- AC1 says "in the toolbar's existing style" without naming the properties; TC-RANGE-1-09 reads it literally as the range sitting inside the count paragraph with the same computed font size, font weight and colour.
- Invalid filter values (for example `brand=abc`) keep whatever the endpoint did before; the story does not define them, so no case covers them.
