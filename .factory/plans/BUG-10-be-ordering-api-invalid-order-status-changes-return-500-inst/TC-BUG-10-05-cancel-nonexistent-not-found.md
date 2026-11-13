---
id: TC-BUG-10-05
type: sad
sad-path: not-found
layer: functional
covers: ["Suggested fix: return 404 when the order does not exist"]
priority: P1
---

# TC-BUG-10-05: Cancelling a nonexistent order returns 404

## Why

- The story requires 404 for a missing order; the existing test CancelNonExistentOrderFails currently asserts 500 and must change.

## Preconditions

- Scenario `ordering-statuses` (new, `extends: default`) with orders owned by `alice`:
  - order 1: Submitted
  - order 2: Paid
  - order 3: Shipped
  - order 4: Cancelled
- No order 9999.
- Bearer token for alice.

## Steps

1. `PUT /api/orders/cancel`, new `x-requestid`, bearer alice, body `{"orderNumber": 9999}`.

## Expected result

- Status `404`, not 500.
