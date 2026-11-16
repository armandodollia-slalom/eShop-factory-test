---
story: BUG-41
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/172"
story-sha: 1bd098c7f5c2
plan-sha: 8f68cd449558
verified-score: 10
verified-at: "2026-11-15T23:46:20.099Z"
verified-by: test-planner@d8121b51/67b01306
automation-sha: fb1049049137
automation-plan-sha: 8f68cd449558
automation-score: 9
automation-verified-at: "2026-11-16T00:19:53.518Z"
---
# Test plan: BUG-41 [FE - WebApp] - Double-clicking "Place order" places the order twice

Scope: the WebApp checkout page (`/checkout`) on the test stack. A double-click on **Place order** must create exactly one order with the bag's total, the shopper must still land on My orders (`/user/orders`) and the shopping bag must be empty afterwards. A single click keeps today's behaviour. Because the fix lives in the browser (submit-once form, a stable `x-requestid` per rendered form) and in Ordering's duplicate-request handling, and because an order that passes validation cannot be saved in the Ordering functional host, every case runs on the `e2e` layer against the test stack as the seeded user `alice` (scenario `default`: empty bag, no orders). The jacket is catalog item 28 "Alpine Peak Down Jacket", price 249.99.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-41-01 | Double-clicking Place order creates exactly one order with the bag's total | sad | e2e | Repro steps 1-4; Expected: double-click places exactly one order with the bag's total; Acceptance Criteria |
| TC-BUG-41-02 | After a double-click on Place order the shopping bag is empty | sad | e2e | Expected: bag emptied after the order |
| TC-BUG-41-03 | A single click on Place order creates one order and lands on My orders | happy | e2e | Expected: single click places one order and lands on My orders, as today |
| TC-BUG-41-04 | After a single click on Place order the shopping bag is empty | happy | e2e | Expected: bag emptied after the order, as today |
| TC-BUG-41-05 | Two separate checkouts, one click each, create two orders | happy | e2e | Expected: single click places one order as today (a new checkout is not swallowed as a duplicate) |
| TC-BUG-41-06 | Place order still works after the form was rejected by a validation error | sad | e2e | Expected: single click places one order as today (the once-only submit does not lock the form after a validation error) |
| TC-BUG-41-07 | Two concurrent order requests with the same request id create one order | sad | e2e | Expected: double-click (second click before the page moves on) places exactly one order, server side |

## Out of scope

- Unit and functional layers: the double-click can only be reproduced through the browser, and an accepted order cannot be saved in the Ordering functional host (see Project context); the duplicate-request case (TC-BUG-41-07) therefore uses the Ordering API on the test stack.
- Checkout with an empty bag ("Your cart is empty"), order details pages, cancelling or shipping orders: not changed by this bug.
- Triple or more clicks and keyboard (Enter) double submits: the story names only a double-click / second click; TC-BUG-41-01 covers the behaviour, more clicks are the same mechanism.
- The exact visual state of the Place order button while the submit is in flight (disabled, spinner): the story defines none.

## Open questions

- The HTTP status and body the Ordering API returns for the second request with an already-used `x-requestid`: the story does not define it, so TC-BUG-41-07 asserts only the number of orders created and that at least one request answers `200 OK`.
- Where a double-click leaves the shopper: the story requires landing on My orders only for a single click ("as today"). TC-BUG-41-01 opens My orders explicitly (repro step 4) rather than asserting the redirect.
