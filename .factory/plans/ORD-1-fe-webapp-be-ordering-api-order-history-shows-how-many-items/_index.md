---
story: ORD-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/65"
story-sha: 2eb417005a89
plan-sha: c98801520247
verified-score: 9
verified-at: "2026-11-14T07:03:16.250Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: a4c297d3555e
automation-plan-sha: c98801520247
automation-score: 9
automation-verified-at: "2026-11-14T07:53:34.520Z"
---
# Test plan: ORD-1 Order history shows how many items each order holds

Covers `itemCount` on `GET /api/orders` (Ordering.API, API version 1.0) and the `Items` column of the WebApp order history (`/user/orders`). API cases run as functional tests; UI cases run as e2e on the test stack with scenario `ord-1`.

Shared data (scenario `ord-1`, `extends: default`; the functional fixture seeds the same orders for the same buyers):

- alice (Id `50ddac7e-9b69-4d68-a91b-25100ef2e403`): order 101 (Submitted, 2026-01-10) with line A of 2 units at 10.00 and line B of 1 unit at 5.00, total 25.00, so itemCount 3; order 102 (Submitted, 2026-01-11) with one line of 1 unit at 12.50, total 12.50, so itemCount 1.
- bob (Id `bc8b0071-21af-41ab-b1d2-15c4efc368df`): order 103 (Submitted, 2026-01-12) with one line of 4 units at 8.00, total 32.00, so itemCount 4.
- carol: a new identity user with the same stored password hash as alice (password `Pass123$`), no orders.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-ORD-1-01 | Two-line order of 2 and 1 units has itemCount 3 | happy | functional | AC1 |
| TC-ORD-1-02 | One-line order of 1 unit has itemCount 1 | happy | functional | AC2 |
| TC-ORD-1-03 | Existing summary fields are unchanged | happy | functional | AC3 |
| TC-ORD-1-04 | Another user's orders are not listed | sad | functional | AC7 (API) |
| TC-ORD-1-05 | Items column sits between Date and Total and shows 3 items | happy | e2e | AC4 |
| TC-ORD-1-06 | One-unit order shows 1 item | happy | e2e | AC5 |
| TC-ORD-1-07 | User with no orders sees the unchanged empty state | happy | e2e | AC6 |
| TC-ORD-1-08 | Order history lists only the signed-in user's orders | sad | e2e | AC7 (UI) |

## Open questions

- Order status is asserted as `Submitted` (the `OrderStatus.ToString()` value the endpoint returns today); the story only says "same values as before".
- The functional fixture authenticates every request as one fixed user (`AutoAuthorizeMiddleware`); TC-ORD-1-04 needs the caller's identity to be settable per test.
- The format of `date` in the JSON is not specified; TC-ORD-1-03 compares it with the value the endpoint returned before the change, not with a literal string.
- A user whose order has zero lines (itemCount 0, rendering `0 items`) is not stated by the story; no case written.

## Out of scope

- Order details, order creation and status changes (per Test scope).
- Unauthenticated calls to `GET /api/orders` (behavior unchanged and not part of this story).
