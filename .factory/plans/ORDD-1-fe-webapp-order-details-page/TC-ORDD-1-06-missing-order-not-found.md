---
id: TC-ORDD-1-06
type: sad
sad-path: not-found
layer: e2e
covers: ["Outputs: order number that does not exist shows exactly `Order not found` with HTTP 404", "AC3"]
priority: P1
---

# TC-ORDD-1-06: Order number that does not exist shows Order not found with 404

## Why

- AC3 requires both the exact text and the HTTP status. The implementation sets the status late (`Response.OnStarting`) because an earlier attempt sent an empty body, so the body and the status must be asserted together on the real HTTP response. e2e because the status comes from the WebApp's SSR response.

## Preconditions

- Scenario `ordd-1`: no order `999999` exists.
- Signed in as bob (`bob` / `Pass123$`).

## Steps

1. Navigate to `/user/orders/999999` (`page.goto`) and keep the navigation response.

## Expected result

- The navigation response status is `404`.
- The page shows the text `Order not found` (element `.order-details-notfound`).
- No `.order-details-summary`, `Delivery address` section or `Items` section is rendered.
