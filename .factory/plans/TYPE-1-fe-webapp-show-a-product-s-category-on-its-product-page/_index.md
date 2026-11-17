---
story: TYPE-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/206"
story-sha: 6cb64593d46a
plan-sha: 97952de1338f
verified-score: 10
verified-at: "2026-11-17T04:23:30.741Z"
verified-by: test-planner@6ab9e852/council
automation-sha: 1e7c70740081
automation-plan-sha: 97952de1338f
automation-score: 10
automation-verified-at: "2026-11-17T05:00:15.787Z"
---
# Test plan: TYPE-1 Show a product's category on its product page

The story adds the product's catalog type to the single-item response of the Catalog API (`GET /api/catalog/items/{id}`) and shows it as a "Category" entry next to "Brand" in the details list (`dl.item-meta`) of the WebApp product page. The plan checks the API contract on the functional layer (Catalog.FunctionalTests against the demo catalog), the rendered entry, its consistency with the catalog type filter and the unchanged rest of the page on the e2e layer (Playwright on the test stack, scenario `default`).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-TYPE-1-01 | Single-item response of item 1 includes its type Footwear next to its brand | happy | functional | AC3 |
| TC-TYPE-1-02 | Single-item response of item 99 carries the same type id and name as the catalog types list | happy | functional | AC2, AC3 |
| TC-TYPE-1-03 | Paged item list still returns items without their type | happy | functional | AC3 (other endpoints unchanged) |
| TC-TYPE-1-04 | Items-by-ids and brand-mates endpoints still return items without their type | happy | functional | AC3 (other endpoints unchanged) |
| TC-TYPE-1-05 | Product page of item 1 shows Category Footwear right after Brand, in the same style | happy | e2e | AC1 |
| TC-TYPE-1-06 | Category on the product page is the name the type filter shows for the product | happy | e2e | AC2 |
| TC-TYPE-1-07 | Rest of the product page is unchanged for a signed-in shopper | happy | e2e | AC4 |

## No sad path

- The story adds a field to the single-item response and an entry to the product page. It names no error outcome, adds no input, limit or access rule, and does not state that any existing error is kept. The existing not-found and invalid-id responses of `GET /api/catalog/items/{id}` are not part of any acceptance criterion (see Open questions), so the plan has no sad case.

## Out of scope

- Catalog list, search and brand-mates cards in the WebApp: the story changes only the product page.
- Write endpoints (create, update, delete item): the story does not change them.
- Product page for an unknown id (`/item/{unknown}`): the WebApp page code that handles a missing item is not changed by the story.
- Authentication and ownership sad paths: catalog reads are anonymous and the story adds no access rule.

## Open questions

- The story does not say what the page shows when an item has no catalog type. `CatalogTypeId` is a required column and every seeded item has a type, so no case is written for an empty category.
- AC3 says the other endpoints are "unchanged"; TC-TYPE-1-03 and TC-TYPE-1-04 read this literally as "their items still carry `catalogType: null`", the current behaviour on `main`. If the product owner only means "their response schema is unchanged", those two cases can be relaxed.
- The story does not define the not-found or invalid-id responses of `GET /api/catalog/items/{id}` (status, content type, body). No case is written for an unknown id (for example 102, just past the 101 seeded items) or a non-positive id (0 or negative). If the product owner adopts the endpoint's existing error contract as part of AC3, cases can be added: id 102 → 404 with no item in the body, and id 0 → 400 `application/problem+json` with `detail` "Id is not valid".
