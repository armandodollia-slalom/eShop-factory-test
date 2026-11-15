---
id: TC-ORDD-1-07
type: sad
sad-path: ownership
layer: e2e
covers: ["Outputs: order of another shopper shows exactly `Order not found` with 404 and nothing of that order", "AC4"]
priority: P1
---

# TC-ORDD-1-07: Another shopper's order shows Order not found with 404 and none of its content

## Why

- AC4 is a data-privacy rule: bob must not see alice's items, address or total by guessing her order number. A page that showed the order or leaked parts of it would expose personal data. e2e because the rule is about what the WebApp renders; TC-ORDD-1-09 pins the API underneath.

## Preconditions

- Scenario `ordd-1`: order 2 belongs to alice (item `Alpine Fusion Goggles`, Street `100 Alice Lane`, City `Seattle`, ZipCode `98101`, total `239.97`).
- Signed in as bob (`bob` / `Pass123$`).

## Steps

1. Navigate to `/user/orders/2` (`page.goto`) and keep the navigation response.

## Expected result

- The navigation response status is `404`.
- The page shows the text `Order not found`.
- The page content does not contain `Alpine Fusion Goggles`, `100 Alice Lane`, `Seattle`, `98101`, `$239.97` or `$79.99`.
- No `.order-details-summary` element is rendered.
