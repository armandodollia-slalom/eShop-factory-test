---
story: BUG-33
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/115"
story-sha: 349369d8fdd0
plan-sha: 7578813b02b6
verified-score: 10
verified-at: "2026-11-15T06:46:08.120Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: 836decf06765
automation-plan-sha: 7578813b02b6
automation-score: 10
automation-verified-at: "2026-11-15T07:11:07.200Z"
---
# Test plan: BUG-33 [BE - Basket.API] - A basket update that lists a product twice stores two lines for it

Scope: gRPC `Basket.UpdateBasket` and `Basket.GetBasket` on Basket.API when an update lists the same product more than once, and the shopping bag page (`/cart`) of the WebApp that shows the stored basket. A product listed more than once must be stored as one line whose quantity is the sum of its entries; updates that list each product once must behave as before (one line per entry, the update replaces the stored basket). The gRPC behaviour is planned at the functional layer (`tests/Basket.FunctionalTests`): `BasketService` wired to the real `RedisBasketRepository` over `RedisFixture`'s Redis, with a `ServerCallContext` whose user carries a `sub` claim. This exercises the mapping plus real persistence without the test stack. The bug's full reproduction, including the shopping bag rendering, is one e2e case on the test stack as `bob`.

Catalog data used (scenario `default`): product 1 is "Wanderer Black Hiking Boots" at 109.99; product 2 is "Summit Pro Harness" at 89.99.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-33-01 | GetBasket after an update listing product 1 twice (1 + 2) returns one line with quantity 3 | happy | functional | Expected: one line for product 1 with quantity 3; GetBasket returns that one line; Steps to Reproduce 2-3 |
| TC-BUG-33-02 | UpdateBasket response for product 1 listed twice (1 + 2) holds one line with quantity 3 | happy | functional | Expected: "The basket holds one line for product 1, with quantity 3" (UpdateBasket's returned basket) |
| TC-BUG-33-03 | Product listed three times (1 + 1 + 1) is stored as one line with quantity 3 | happy | functional | Expected: "quantities of its entries added up" for any number of entries ("more than once") |
| TC-BUG-33-04 | Duplicated product merges while another product listed once keeps its own line | happy | functional | Expected: one line per product, quantities summed; Updates that list each product once behave as today |
| TC-BUG-33-05 | Update listing each product once stores one line per entry with the given quantities | happy | functional | Expected: "Updates that list each product once behave as they do today" |
| TC-BUG-33-06 | A later update replaces the merged basket instead of adding to it | happy | functional | Expected: summing applies to entries of one update; existing replace behaviour unchanged |
| TC-BUG-33-07 | Shopping bag shows product 1 once with quantity 3 and total $329.97 after a duplicate-entry update as bob | happy | e2e | Acceptance criteria; Steps to Reproduce 1-3; Expected: shopping bag shows product 1 once, quantity 3, matching total |
| TC-BUG-33-08 | UpdateBasket with product 1 listed twice and no authenticated user is refused with Unauthenticated and stores nothing | sad | functional | Steps to Reproduce step 1 (token required); Expected: updates behave as today |
| TC-BUG-33-09 | Bob's update listing product 1 twice does not change another buyer's stored basket | sad | functional | Expected: the caller's basket holds one line; updates behave as today |

## Out of scope

- Authentication of `GetBasket` (anonymous callers get an empty basket): the story does not change it; existing unit tests in `tests/Basket.UnitTests/BasketServiceTests.cs` cover it.
- Validation of quantities (zero, negative, overflowing sums) and product ids that do not exist in the catalog: the story states no rule for them (see Open questions).
- Changing quantities or removing items from the shopping bag page: the story does not touch those flows.

## Open questions

- Order of lines after a merge: the Implementation Notes say the merged line keeps the position where the product first appears, but the ticket's Expected does not state an order. Cases assert the set of lines (product id and quantity) and the line count, not their order.
- Entries with quantity 0 or negative quantities for a duplicated product, and sums that overflow `int`: the story does not define the outcome.
- Concurrent updates for the same buyer: undefined by the story.
