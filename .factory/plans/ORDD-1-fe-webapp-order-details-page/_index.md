---
story: ORDD-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/117"
story-sha: be63b89001b6
plan-sha: fe44b8a25c3d
verified-score: 9
verified-at: "2026-11-15T07:01:51.190Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: 888ebf0ea921
automation-plan-sha: fe44b8a25c3d
automation-score: 10
automation-verified-at: "2026-11-15T14:15:24.254Z"
---
# Test plan: ORDD-1 [FE - WebApp] - Order details page

Scope: the WebApp order details page `/user/orders/{orderNumber}` and the order-number links on My orders (`/user/orders`), backed by `GET /api/orders/{orderId}` in Ordering.API scoped to the signed-in buyer. UI behaviour is tested end to end in Playwright on the test stack (`e2e/teststack/ordd-1.spec.ts`); the ownership rule is also pinned at the API (`tests/Ordering.FunctionalTests`) because a leak there would bypass the page.

## Test data: scenario `ordd-1`

New scenario `.factory/stack/scenarios/ordd-1` that `extends: default` and adds to `orderingdb` (schema `ordering`):

- Buyers: one buyer for bob (`IdentityGuid` `bc8b0071-21af-41ab-b1d2-15c4efc368df`, name `Bob`) and one for alice (`IdentityGuid` `50ddac7e-9b69-4d68-a91b-25100ef2e403`, name `Alice`), each with one payment method of card type 1 from `_base`.
- Order **1**, bob's: status `Shipped`, order date `2026-11-01 10:00:00 UTC`, address Street `15703 NE 61st Ct`, City `Redmond`, State `WA`, Country `U.S.`, ZipCode `98052`; items:
  - product 1 `Wanderer Black Hiking Boots`, unit price `109.99`, units `2`, discount `0`
  - product 2 `Summit Pro Harness`, unit price `89.99`, units `1`, discount `0`
  - order total `309.97`.
- Order **2**, alice's: status `Cancelled`, order date `2026-11-02 09:00:00 UTC`, address Street `100 Alice Lane`, City `Seattle`, State `WA`, Country `U.S.`, ZipCode `98101`; one item: product 3 `Alpine Fusion Goggles`, unit price `79.99`, units `3`, discount `0`; order total `239.97`.
- No order with number `999999` or `0`.

Statuses `Shipped` and `Cancelled` are used because OrderProcessor's grace-period job moves `Submitted` orders on by itself, which would make the status assertion flaky. Order id sequences must be advanced past 2 so orders created later do not collide.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-ORDD-1-01 | Order number on My orders links to its details page | happy | e2e | Outputs: My orders link; AC1 (follow the link) |
| TC-ORDD-1-02 | Details page shows the order number, date, status and total | happy | e2e | Outputs: number, date, status, total; AC1 |
| TC-ORDD-1-03 | Details page shows the delivery address | happy | e2e | Outputs: delivery address; AC1 |
| TC-ORDD-1-04 | Details page lists each item with name, unit price, units and line total | happy | e2e | Outputs: item rows, line total = unit price × units; AC1 |
| TC-ORDD-1-05 | Back to my orders returns to the My orders page | happy | e2e | Outputs: `Back to my orders` link; AC2 |
| TC-ORDD-1-06 | Order number that does not exist shows Order not found with 404 | sad | e2e | Outputs: not found, 404; AC3 |
| TC-ORDD-1-07 | Another shopper's order shows Order not found with 404 and none of its content | sad | e2e | Outputs: foreign order 404, nothing shown; AC4 |
| TC-ORDD-1-08 | Visitor not signed in is sent to the sign-in page | sad | e2e | Outputs: sign-in redirect; AC5 |
| TC-ORDD-1-09 | Ordering API refuses another buyer's order with 404 | sad | functional | AC4 (no data from the API for a foreign order); Implementation: query scoped to buyer |
| TC-ORDD-1-10 | Order number 0 (just outside the positive range) shows Order not found with 404 | sad | e2e | Inputs: order number is a positive whole number (boundary) |

## Out of scope

- Visual styling and layout of the details page beyond the content the story lists (the PR check's design critic covers it).
- Changing an order (cancel, ship) from the details page: the story only reads.
- My orders list behaviour other than the order-number link (existing feature).

## Open questions

- Non-integer order numbers (`/user/orders/abc`, `/user/orders/1.5`): the story says the number is a whole number but does not say what the page shows for one that is not; the route constraint `{orderNumber:int}` makes these fall through to the app's generic not-found handling. No case asserts their content or status.
- Negative order numbers (`/user/orders/-1`): read literally as "does not exist" like 0, but not planned separately; TC-ORDD-1-10 covers the lower boundary.
- Date format: the story requires the date but not its format. TC-ORDD-1-02 asserts the details page shows the same date text as My orders for that order, not a specific format.
- Behaviour when Ordering.API is unreachable or errors (5xx): undefined by the story.
