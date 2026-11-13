---
id: TC-BUG-10-01
type: sad
sad-path: conflict
layer: functional
covers: ["Acceptance: cancel Shipped order returns client error", "Technical Notes: OrderingDomainException maps to 409"]
priority: P1
---

# TC-BUG-10-01: Cancelling a Shipped order returns 409 with the domain message

## Why

- This is the reported bug (500 instead of a client error); a domain rule violation must surface as 409 Conflict. Functional layer because the status mapping lives in OrdersApi against the real database.

## Preconditions

- Scenario `ordering-statuses` (new, `extends: default`) with orders owned by `alice`:
  - order 1: Submitted
  - order 2: Paid
  - order 3: Shipped
  - order 4: Cancelled
- Bearer token for alice.

## Steps

1. `PUT /api/orders/cancel` with header `x-requestid: <new guid>`, bearer alice, body `{"orderNumber": 3}`.

## Expected result

- Status `409` (not 500).
- `ProblemDetails` body: `status` 409, `detail` = "Is not possible to change the order status from Shipped to Cancelled.".
- Order 3 is still Shipped.
