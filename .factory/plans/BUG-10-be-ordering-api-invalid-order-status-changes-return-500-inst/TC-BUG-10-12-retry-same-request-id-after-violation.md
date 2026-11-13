---
id: TC-BUG-10-12
type: sad
sad-path: conflict
layer: functional
covers: ["Deviations: transaction and idempotency ClientRequest roll back on a rule violation"]
priority: P1
---

# TC-BUG-10-12: Retrying with the same x-requestid after a 409 is evaluated again

## Why

- The deviation makes the ClientRequest row roll back. If it did not, the retry would be treated as a duplicate and return 200, hiding the conflict. This needs real persistence, so functional.

## Preconditions

- Order 5 with status Shipped exists.
- A fixed guid G.

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: G` and body `{"orderNumber": 5}`.
2. Repeat the identical request with `x-requestid: G`.
3. Query the ClientRequest table for id G.

## Expected result

- Both responses are `409` with the same `detail`.
- No ClientRequest row with id G exists.
- Order 5 is still Shipped.
