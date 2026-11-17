---
story: ORDST-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/241"
story-sha: cd9f2ade52cb
plan-sha: a1036c769a20
verified-score: 10
verified-at: "2026-11-17T19:15:59.681Z"
verified-by: test-planner@6ab9e852/council
automation-sha: 4251cec3caab
automation-plan-sha: a1036c769a20
automation-score: 10
automation-verified-at: "2026-11-17T20:07:12.564Z"
---
# Test plan: ORDST-1 [FE - WebApp, BE - Ordering API] - Filter My orders by status

Adds a `status` query parameter to `GET /api/orders` (API version 1.0) and a "Status" filter (All + six status names) to My orders (`/user/orders`) in the WebApp. API rejections that stop before any order is read (unknown, empty and numeric `status`) are functional cases. Every case that needs existing orders runs on the test stack (`e2e` layer), because the Ordering functional host cannot save an order: the API cases call `GET /api/orders` directly with alice's or bob's bearer token, the page cases drive the WebApp signed in as alice or bob.

## Test data: scenario `ordst-1` (`extends: default`)

Statuses that background processing advances (Submitted, AwaitingValidation, StockConfirmed) are not seeded, so the data stays stable; only Paid, Shipped and Cancelled orders exist. Rows go into `orderingdb` (`ordering.buyers`, `ordering.paymentmethods` as the foreign keys require, `ordering.orders` with `OrderStatus` stored as its name, `ordering."orderItems"`):

| Order | Buyer | OrderStatus | OrderDate (UTC) | Item | Units | Unit price |
| --- | --- | --- | --- | --- | --- | --- |
| 101 | alice | Paid | 2026-11-01 10:00 | 99 "Adventurer GPS Watch" | 1 | 10.00 |
| 102 | alice | Paid | 2026-11-02 10:00 | 99 "Adventurer GPS Watch" | 2 | 10.00 |
| 103 | alice | Shipped | 2026-11-03 10:00 | 99 "Adventurer GPS Watch" | 3 | 10.00 |
| 104 | alice | Cancelled | 2026-11-04 10:00 | 99 "Adventurer GPS Watch" | 4 | 10.00 |

- alice: buyer row with `IdentityGuid` `50ddac7e-9b69-4d68-a91b-25100ef2e403`, name `Alice`.
- bob (`bc8b0071-21af-41ab-b1d2-15c4efc368df`) has no orders at all.
- Totals are therefore 10.00, 20.00, 30.00 and 40.00. The order sequence (`orderseq`) must start above 104 so orders created later do not collide.
- TC-ORDST-1-16 ships order 101, so it needs a fresh copy of the scenario (reset before the spec, or run last).

## Cases

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-ORDST-1-01 | GET /api/orders?status=Paid returns only alice's two Paid orders, each as the unfiltered request returns it | happy | e2e | AC5 main; AC5 "each as the unfiltered request returns it" |
| TC-ORDST-1-02 | GET /api/orders without status still returns all four of alice's orders | happy | e2e | AC5 "Without status it returns all … as today" |
| TC-ORDST-1-03 | GET /api/orders?status=sHiPpEd matches the status name ignoring case | happy | e2e | AC5 "The name is matched ignoring case" |
| TC-ORDST-1-04 | GET /api/orders?status=Submitted returns an empty list when alice has no Submitted orders | happy | e2e | AC5 "only that shopper's orders in that status" (none) |
| TC-ORDST-1-05 | bob's GET /api/orders?status=Paid does not return alice's Paid orders | sad | e2e | AC5 "only that shopper's orders" (ownership) |
| TC-ORDST-1-06 | GET /api/orders?status=Delivered answers 400 with a problem detail | sad | functional | AC5 "A status that is not one of the six names answers 400 with a problem detail" |
| TC-ORDST-1-07 | GET /api/orders?status= (empty value) answers 400 with a problem detail | sad | functional | AC5 400 rule (empty value is not one of the six names) |
| TC-ORDST-1-08 | GET /api/orders?status=4 (numeric value of Paid) answers 400 with a problem detail | sad | functional | AC5 400 rule (only the six names) |
| TC-ORDST-1-09 | My orders shows a "Status" filter with All and the six names in order, All selected | happy | e2e | AC1 |
| TC-ORDST-1-10 | Choosing "Paid" shows only the Paid orders, unchanged, and the address becomes /user/orders?status=Paid | happy | e2e | AC2 choose a status; AC6 columns, totals, badges |
| TC-ORDST-1-11 | Choosing "All" after a filter shows every order again at /user/orders | happy | e2e | AC2 choose "All" |
| TC-ORDST-1-12 | Opening /user/orders?status=Cancelled directly selects Cancelled and filters the list | happy | e2e | AC3 direct URL |
| TC-ORDST-1-13 | Opening /user/orders?status=Delivered shows every order with "All" selected | sad | e2e | AC3 unknown status |
| TC-ORDST-1-14 | A status none of alice's orders has shows "No StockConfirmed orders." and a "Show all orders" link | happy | e2e | AC4 filtered empty message and link |
| TC-ORDST-1-15 | A shopper with no orders still sees "No orders yet" and no filter | happy | e2e | AC4 "No orders yet" unchanged, no filter |
| TC-ORDST-1-16 | When a Paid order is shipped, the refreshed list keeps the Paid filter | happy | e2e | AC6 live refresh keeps the selected filter |

## Out of scope

- Unit cases: the story's behaviour is fully observable at the API and page; the existing unit test `Get_orders_success` is kept by the implementation and not re-planned.
- Pages other than My orders, and the order detail flow.
- Statuses Submitted, AwaitingValidation and StockConfirmed as seeded data: background processing moves orders out of them, so they are only used where no order has them (TC-ORDST-1-04, TC-ORDST-1-14).

## Open questions

- AC3 says a `status` "that is not one of the six names" shows every order with "All" selected, while AC5 matches names ignoring case at the API. Whether the page treats `?status=paid` as "Paid" or as unknown is not stated by the acceptance criteria (the Implementation Notes say it selects "Paid"); no case asserts either outcome.
- Requests without a token or with a token lacking the orders scope are existing behaviour the story does not mention; no case asserts them.
- Comma lists (`?status=Paid,Shipped`) and repeated parameters (`?status=Paid&status=Shipped`) are only covered by AC5's general 400 rule; the repeated-parameter outcome is not stated, so no case asserts it.
- Exact problem-detail fields (title, detail text) are not specified; cases assert only status 400 and the `application/problem+json` body with `status: 400`.
