---
id: TC-ORDD-1-10
type: sad
sad-path: boundary
layer: e2e
covers: ["Inputs: order number is a positive whole number (lower boundary)", "Outputs: order number that does not exist shows `Order not found` with 404"]
priority: P3
---

# TC-ORDD-1-10: Order number 0 (just outside the positive range) shows Order not found with 404

## Why

- The input rule says the order number is a positive whole number; `0` is the value just outside it and is accepted by the `{orderNumber:int}` route. No order 0 can exist, so the story's literal outcome is the not-found response. Order 1 (TC-ORDD-1-02) is the value just inside. e2e because the status and text come from the WebApp page.

## Preconditions

- Scenario `ordd-1`: no order `0` exists.
- Signed in as bob (`bob` / `Pass123$`).

## Steps

1. Navigate to `/user/orders/0` (`page.goto`) and keep the navigation response.

## Expected result

- The navigation response status is `404`.
- The page shows the text `Order not found`.
