---
id: TC-ADDED-1-11
type: sad
sad-path: boundary
layer: unit
covers: ["AC4: its lines show no date until they are added again", "AC2: date does not change"]
priority: P2
---

# TC-ADDED-1-11: A line stored without a date stays without one when its quantity changes

## Why

- AC4 says an old line shows no date "until added again"; a quantity change is not an add (AC2), so stamping it with "now" would show a wrong date. This is the edge between the "existing product" and "new product" rules.

## Preconditions

- Fake clock at `2026-11-20T10:00:00Z`; caller `buyer-1`.
- Stored basket: `[{ProductId 99, Quantity 1, AddedAt null}]`.

## Steps

1. Call `UpdateBasket` with items `[{product_id: 99, quantity: 4}]`.

## Expected result

- Saved basket: product 99 Quantity 4, AddedAt `null`.
- Response: product 99 `quantity` 4, `added_at` not set.
