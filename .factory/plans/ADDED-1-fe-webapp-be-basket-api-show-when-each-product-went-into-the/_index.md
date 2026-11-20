---
story: ADDED-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/353"
story-sha: 49bb63b32caf
plan-sha: 0a79d43a6f8d
verified-score: 9
verified-at: "2026-11-20T05:04:45.121Z"
verified-by: test-planner@3b45d17c/council
automation-sha: 85a250f8e741
automation-plan-sha: 0a79d43a6f8d
automation-score: 10
automation-verified-at: "2026-11-20T05:36:41.606Z"
---
# Test plan: ADDED-1 Show when each product went into the shopping bag

Scope: the Basket API stores the UTC time each product was first added to a basket line (`BasketItem.added_at`, field 7 in `basket.proto`), keeps it across quantity changes and re-sends of the whole basket, gives a new time to a product that was removed and added again, returns it from `GetBasket`, and still loads baskets stored before the change (no date for their lines). The WebApp shopping bag shows "Added on {d MMM yyyy}" under the product name. Server-side timing rules are checked at the `unit` layer with a fake `TimeProvider` (dates on different days are only distinguishable there); Redis persistence and legacy JSON at the `functional` layer through the Basket gRPC service; the visible line, the user journeys and an undated legacy line (seeded straight into Redis) at the `e2e` layer on the test stack as `alice`. Regression cases for the upheld review findings sol-1 (a concurrent remove + re-add or competing first add must not be overwritten with a stale time) and sol-3 (exhausted retries are reported as `Aborted`, not `NotFound`) are interleaved deterministically at the `unit` layer and checked against real Redis at the `functional` layer through the hosted gRPC service, with conflicts injected by a test wrapper around the host's repository.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-ADDED-1-01 | Shopping bag line shows "Added on" with today's date after adding a product | happy | e2e | AC1 |
| TC-ADDED-1-02 | Changing a line's quantity in the shopping bag keeps its "Added on" date | happy | e2e | AC2 (change quantity) |
| TC-ADDED-1-03 | Adding more of a product already in the bag keeps its "Added on" date | happy | e2e | AC2 (add more) |
| TC-ADDED-1-04 | Removing a product and adding it again shows it with today's date | happy | e2e | AC3 |
| TC-ADDED-1-05 | UpdateBasket stamps a newly added product with the current UTC time | happy | unit | AC4, AC1 |
| TC-ADDED-1-06 | UpdateBasket keeps the stored added_at when the quantity changes days later | happy | unit | AC2 |
| TC-ADDED-1-07 | UpdateBasket ignores an added_at sent by the client | sad (validation) | unit | AC2, AC4 |
| TC-ADDED-1-08 | A product removed and added again later gets the time of the new add | happy | unit | AC3 |
| TC-ADDED-1-10 | GetBasket returns a line stored without a date with no added_at, next to a dated line | happy | unit | AC4 (old baskets load; returns it with the basket) |
| TC-ADDED-1-11 | A line stored without a date stays without one when its quantity changes | sad (boundary) | unit | AC4 (no date until added again) |
| TC-ADDED-1-12 | GetBasket over gRPC loads a basket JSON stored before the change and returns no added_at | happy | functional | AC4 (old baskets load) |
| TC-ADDED-1-13 | UpdateBasket over gRPC persists the server-assigned added_at and GetBasket returns it exactly | happy | functional | AC4 (API keeps the time) |
| TC-ADDED-1-14 | A quantity update that read the basket before a concurrent remove and re-add does not write back the old date | sad (concurrency) | unit | AC3; kept-for sol-1 |
| TC-ADDED-1-15 | Of two competing first adds of a product, the first committed time is kept | sad (concurrency) | unit | AC4, AC2; kept-for sol-1 |
| TC-ADDED-1-16 | UpdateBasket over gRPC retries against a basket written between its read and its write and keeps the new date | sad (concurrency) | functional | AC3; kept-for sol-1 |
| TC-ADDED-1-17 | UpdateBasket reports repeated concurrent-write conflicts as Aborted, not NotFound | sad (concurrency) | unit | AC3; kept-for sol-3 |
| TC-ADDED-1-18 | UpdateBasket over gRPC returns Aborted after 10 conflicting attempts and leaves the concurrent basket in place | sad (concurrency) | functional | AC3; kept-for sol-3 |
| TC-ADDED-1-19 | A shopping bag line stored before the change shows no "Added on" text | happy | e2e | AC4 (lines show no date) |

## Out of scope

- Ordering: the WebApp's create-order request does not carry `added_at`; the story does not change checkout.
- Basket API authentication: `UpdateBasket` without a user is the existing `Unauthenticated` error, unchanged by this story.

## Open questions

- Time zone of the shown date: AC1 says "the date" without a zone; the implementation shows the UTC date. Cases use the UTC date, so a run near midnight in a non-UTC browser zone is not covered.
- Same-day limitation: e2e cases run within one day, so they cannot show that a date did not move to a later day; the unit cases with a fake clock cover that.
