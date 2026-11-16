---
story: CANC-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/194"
story-sha: 8c9fc3583787
plan-sha: 4b27d9571ef4
verified-score: 9
verified-at: "2026-11-16T18:35:55.556Z"
verified-by: test-planner@d8121b51/67b01306
automation-sha: 494d321715b9
automation-plan-sha: 4b27d9571ef4
automation-score: 9
automation-verified-at: "2026-11-16T22:15:42.016Z"
---
# Test plan: CANC-1 [FE - WebApp] - Cancel an order from My orders

Scope: the "Cancel order" button on My orders (`/user/orders`) — which rows show it, cancelling a Submitted, AwaitingValidation and StockConfirmed order, the "This order can no longer be cancelled." message when the order was paid after the page was opened, and that a cancelled order never becomes Paid — plus the ownership rule of `PUT /api/orders/cancel` and the unchanged order columns and checkout. Orders cannot be saved in the Ordering functional host, so every case that needs an order runs on the `e2e` layer (WebApp UI or Ordering API calls on the test stack); the domain rule "a cancelled order is never paid" also gets one `unit` case.

All e2e cases use one new scenario, `canc-1` (`extends: default`), loaded fresh before each case (cases change order statuses). It adds to `orderingdb`:

- `ordering.buyers`: 9001 (`IdentityGuid` `50ddac7e-9b69-4d68-a91b-25100ef2e403`, Name `alice`), 9002 (`IdentityGuid` `bc8b0071-21af-41ab-b1d2-15c4efc368df`, Name `bob`).
- `ordering.orders` of alice (BuyerId 9001), each with one `ordering.orderItems` row for ProductId 99 "Adventurer GPS Watch", Discount 0, PictureUrl `99.webp`, and an address (Street `15703 NE 61st Ct`, City `Redmond`, State `WA`, Country `U.S.`, ZipCode `98052`):

| Order Id | OrderStatus | OrderDate (UTC) | Units x UnitPrice | Total |
| --- | --- | --- | --- | --- |
| 9101 | Submitted | 2099-01-01 10:00:00 | 1 x 10.00 | 10.00 |
| 9102 | AwaitingValidation | 2026-11-02 10:00:00 | 2 x 15.00 | 30.00 |
| 9103 | StockConfirmed | 2026-11-03 10:00:00 | 1 x 20.00 | 20.00 |
| 9104 | Paid | 2026-11-04 10:00:00 | 1 x 25.00 | 25.00 |
| 9105 | Shipped | 2026-11-05 10:00:00 | 1 x 40.00 | 40.00 |
| 9106 | Cancelled | 2026-11-06 10:00:00 | 1 x 50.00 | 50.00 |
| 9107 | StockConfirmed | 2026-11-07 10:00:00 | 1 x 60.00 | 60.00 |
| 9108 | Submitted | 2099-01-02 10:00:00 | 1 x 70.00 | 70.00 |

The Submitted orders are dated in 2099 so that the OrderProcessor's grace-period job (which moves Submitted orders older than one minute to AwaitingValidation) never picks them up during a test. Seeded AwaitingValidation and StockConfirmed orders do not move on their own: the processors react only to integration events, which seeded rows never publish. Ids start at 9001/9101 to stay clear of the HiLo sequences.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-CANC-1-01 | Submitted, AwaitingValidation and StockConfirmed orders each show a "Cancel order" button | happy | e2e | AC1 (cancellable statuses) |
| TC-CANC-1-02 | Paid, Shipped and Cancelled orders show no "Cancel order" button | happy | e2e | AC1 (non-cancellable statuses) |
| TC-CANC-1-03 | Cancelling a Submitted order shows it as Cancelled without an error | happy | e2e | AC2 |
| TC-CANC-1-04 | A just-placed order cancelled before processing stays Cancelled after the processors have run | happy | e2e | AC2 (never becomes Paid) |
| TC-CANC-1-05 | Setting a cancelled order to Paid leaves it Cancelled | sad | unit | AC2 (never becomes Paid), domain rule |
| TC-CANC-1-06 | Cancelling a StockConfirmed order shows it as Cancelled | happy | e2e | AC1 + story goal (cancellable until paid), boundary |
| TC-CANC-1-07 | Cancelling an AwaitingValidation order shows it as Cancelled | happy | e2e | AC1 + story goal (cancellable until paid) |
| TC-CANC-1-08 | Cancelling an order that was paid after the page loaded shows "This order can no longer be cancelled." and keeps it Paid | sad | e2e | AC3 |
| TC-CANC-1-09 | bob's cancel request for alice's order is refused and the order stays Submitted | sad | e2e | AC4 |
| TC-CANC-1-10 | bob cannot cancel alice's order by putting alice's identity in the request body | sad | e2e | AC4 (ownership cannot be set by the caller) |
| TC-CANC-1-11 | My orders still shows each order's number, date, total and status | happy | e2e | AC5 (columns) |
| TC-CANC-1-12 | Placing an order through checkout still works and the new order is listed as Submitted | happy | e2e | AC5 (placing an order) |

## Out of scope

- The Cancel button's styling and position (`Orders.razor.css`); covered by the PR check's design review, not by tests.
- Messages that only the Implementation Notes describe ("We couldn't cancel your order right now. Please try again." on a 404 or connection failure; "We couldn't load your orders right now. Please reload the page." when the list fails): no acceptance criterion requires them (see Open questions).
- Idempotency of the `x-requestid` header and the double-submit guard (`submit-once.js`): implementation decisions, not acceptance criteria.
- The exact API status for a non-cancellable order (409 problem details): AC3 is stated at the UI; TC-CANC-1-08 checks what the shopper sees and that the order stays Paid.

## Open questions

- AC4 allows "403 or 404"; the Implementation Notes chose 404. TC-CANC-1-09 and -10 expect 404 as the concrete value; a 403 would also satisfy the ticket.
- The story does not say what an anonymous (no token) cancel request returns; no case is written for it.
- The story does not define the UI outcome when the cancel request fails for a reason other than "already paid" (Ordering API down, 404). No case is written; the notes describe a retry message.
- TC-CANC-1-04 relies on the test stack's OrderProcessor settings (`GracePeriodTime` 1 minute, `CheckUpdateTime` 30 seconds) and PaymentProcessor `PaymentSucceeded: true` from the services' `appsettings.json`; if the stack overrides them, the wait in that case must be adjusted.
- The date column's text format is whatever the WebApp renders today; TC-CANC-1-11 checks the date it represents, not a format string.
