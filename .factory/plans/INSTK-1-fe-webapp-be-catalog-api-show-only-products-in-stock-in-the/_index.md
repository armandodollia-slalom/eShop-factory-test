---
story: INSTK-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/341"
story-sha: 5703a6279c4c
plan-sha: 045e633569bc
verified-score: 9
verified-at: "2026-11-19T16:17:25.374Z"
verified-by: test-planner@3b45d17c/council
---
# Test plan: INSTK-1 Show only products in stock in the catalog

Scope: the optional in-stock filter of the Catalog API's version 2.0 items list (`GET /api/catalog/items?api-version=2.0&inStock=true`), its absence from version 1.0, its OpenAPI description, and the WebApp catalog's "In stock only" filter: default state, filtering, product and page counts, keeping the choice in the address bar, combining it with brand, type, sort and paging, and turning it off with "Clear all filters". API contracts are checked on the `functional` layer (Catalog functional tests); everything a shopper sees or does is checked on the `e2e` layer through the WebApp on the test stack.

## Test data: the INSTK-1 stock set

The default data has every product at `AvailableStock` 100, so every case starts from the demo catalog (101 items, 13 brands, 8 types) with these stock changes:

- `AvailableStock` 0 (out of stock), 11 items: 53 Raven Swift Snowboard (Daybird, Ski/boarding), 92 Blizzard Snowboard (Daybird, Ski/boarding), 13 Trailblaze hiking backpack (Daybird, Bags), 5 Blizzard Rider Snowboard (B&R, Ski/boarding), 32 Cosmic Purple Snowboard (Gravitator, Ski/boarding), 26 Gravity Beam Climbing Rope (Gravitator, Climbing), 4 Expedition Backpack (Quester, Bags), 8 Frostbite Insulated Jacket (Grolltex, Jackets), 9 VenturePro GPS Watch (AirStrider, Navigation), 10 Trailblazer Bike Helmet (Green Equipment, Cycling), 19 EcoTrail Running Shoes (Green Equipment, Footwear).
- `AvailableStock` 1 (the lowest stock that is still in stock): 71 Explorer Frost Boots (Daybird, Footwear).
- Every other item keeps `AvailableStock` 100.

Derived numbers the cases rely on (WebApp page size is 9):

| Selection | All items | In stock | WebApp pages (all / in stock) |
| --- | --- | --- | --- |
| Whole catalog | 101 | 90 | 12 / 10 |
| Ski/boarding (type 3) | 18 | 14 | 2 / 2 |
| Daybird (brand 1) + Ski/boarding (type 3) | 4 (39, 53, 62, 92) | 2 (39 Midnight Blue Goggles, 62 Shadow Black Snowboard) | 1 / 1 |
| Daybird (brand 1) + Bags (type 4) | 1 (13) | 0 | 1 / none (empty state) |

The 14 in-stock Ski/boarding items, by name: Alpine Fusion Goggles (3, 79.99), Blizzard Freestyle Snowboard (83, 379.00), Expedition 2022 Goggles (16, 89.00), Glacier Frost Snowboard (43, 419.99), Gravity 5000 All-Mountain Skis (42, 699.00), GravityZone All-Mountain Skis (72, 699.00), Maverick Pro Ski Goggles (82, 139.99), Midnight Blue Goggles (39, 89.99), Omni-Snow Dual Snowboard (73, 289.99) on the first page of 9; Powder Pro Snowboard (12, 399.00), Shadow Black Snowboard (62, 379.00), SummitRider Snowboard Boots (60, 249.00), Venture 2022 Snowboard (22, 499.00), Zero Gravity Ski Goggles (30, 79.99) on the second.

- `e2e`: a new test stack scenario `instk-1` that `extends: default` and sets the stock values above on the existing rows (no new rows, so all totals stay 101).
- `e2e`, TC-INSTK-1-18 only: a second scenario `instk-1-brand-paging` that `extends: instk-1` and also sets item 70 GripTrek Hiking Poles (WildRunner, brand 3, Trekking) to `AvailableStock` 0. WildRunner then has 11 products, 10 in stock (2 WebApp pages: 9 + 1). It is separate so the numbers above stay true for every other case.
- `functional`: the INSTK-1 cases run in their own test class with its own `CatalogApiFixture` instance (a fresh database seeded with the demo catalog through the application's own seeder), never inside `CatalogApiTests`: that class shares one database across its tests and deletes items 5 and 6, adds items 10015 and 10016 and updates items 1 and 2, which would change the counts below depending on test order. The cases set the stock values above in their fixture's database (for example through `CatalogContext`) before they run.

## Cases

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-INSTK-1-01 | v2 items list with inStock=true returns only in-stock items and counts only them | happy | functional | AC2, AC5, Impl notes: AvailableStock > 0 before counting |
| TC-INSTK-1-02 | Stock boundary: 1 unit is listed, 0 units is not | sad (boundary) | functional | AC2 "at least one unit in stock" |
| TC-INSTK-1-03 | inStock=true filters before paging (type filter, second page) | happy | functional | AC2 counts, AC3 paging, Impl notes: before paging |
| TC-INSTK-1-04 | inStock=true combines with brand and type filters | happy | functional | AC3 |
| TC-INSTK-1-05 | v2 items list without inStock is unchanged | happy | functional | AC5 "without it the list is exactly as today" |
| TC-INSTK-1-06 | v2 items list with inStock=false lists every item | happy | functional | AC5, Impl notes: "when true" filters |
| TC-INSTK-1-07 | v1 items list ignores inStock | happy | functional | Impl notes: version 1.0 does not change |
| TC-INSTK-1-08 | OpenAPI v2 document describes inStock; v1 document does not | happy | functional | Impl notes: OpenAPI v2 description |
| TC-INSTK-1-09 | Catalog shows an "In stock only" option, off by default | happy | e2e | AC1 |
| TC-INSTK-1-10 | Turning "In stock only" on lists only in-stock products and recounts products and pages | happy | e2e | AC2 |
| TC-INSTK-1-11 | A reload or a shared link with inStock=true shows the same filtered list | happy | e2e | AC2 address bar |
| TC-INSTK-1-12 | "In stock only" with a brand and a type applies all three | happy | e2e | AC3 brand + type |
| TC-INSTK-1-13 | Paging keeps the type and "In stock only" filters | happy | e2e | AC3 paging |
| TC-INSTK-1-14 | Sort order applies together with "In stock only" and survives paging | happy | e2e | AC3 sort |
| TC-INSTK-1-15 | "Clear all filters" in the filter panel turns "In stock only" off | happy | e2e | AC4 |
| TC-INSTK-1-16 | "Clear all filters" in the empty state turns "In stock only" off | happy | e2e | AC2 empty result, AC4 |
| TC-INSTK-1-17 | Turning "In stock only" off again lists every product | happy | e2e | AC1, AC2 |
| TC-INSTK-1-18 | Paging keeps the brand and "In stock only" filters | happy | e2e | AC3 brand + paging, AC2 counts |

## Out of scope

- The HybridApp and the mobile ClientApp catalogs (the story names only the WebApp; `ICatalogService` is unchanged).
- Brand and type facet counts with "In stock only" on (the story does not ask for them to change; the implementer kept them unfiltered).
- Other Catalog endpoints that call `GetAllItems` internally (by name, by type and brand, by brand): the story changes only `GET /api/catalog/items` v2.

## Open questions

- An `inStock` value that is not a boolean (for example `inStock=abc`): the story does not say whether the API answers 400 or ignores it, and whether the WebApp shows everything. The implementer's note says "any other value ... lists everything", but ASP.NET minimal API binding of `bool?` normally answers 400 for an unparsable value. No case until the product owner decides.
- Whether turning "In stock only" on or off should reset the page to 1 (the implementer's decision, not stated by the story); no case asserts the page number after toggling.
- Whether the "In stock only" option should show a count of in-stock products like the brand and type tags do; the story does not ask for it.
