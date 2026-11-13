---
id: TC-BUG-10-05
type: sad
sad-path: not-found
layer: functional
covers: ["Decisions: nonexistent order returns 404", "Suggested fix: 404 when the order does not exist"]
priority: P1
---

# TC-BUG-10-05: Cancelling a nonexistent order returns 404

## Why

- Command returns false for a missing order; the endpoint must tell this apart from a server fault. Functional because it uses the real IOrderQueries lookup.

## Preconditions

- No order with number 999999 exists.

## Steps

1. `PUT /api/orders/cancel` with a new `x-requestid` guid and body `{"orderNumber": 999999}`.

## Expected result

- HTTP status `404`, not 500 and not 409.
