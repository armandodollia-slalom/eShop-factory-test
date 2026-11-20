---
id: TC-ADDED-1-06
type: happy
layer: unit
covers: ["AC2: change quantity, date does not change", "Implementation Notes: keep each product's existing added_at"]
priority: P1
---

# TC-ADDED-1-06: UpdateBasket keeps the stored added_at when the quantity changes days later

## Why

- AC2's core rule. `UpdateBasket` replaces the whole basket, so without reading the stored value the date would reset to "now". The fake clock lets the update happen on a later day, which an e2e run cannot.

## Preconditions

- Fake `TimeProvider` fixed at `2026-11-20T10:00:00Z`; caller `buyer-1`.
- Stored basket for `buyer-1`: items `[{ProductId 99, Quantity 1, AddedAt 2026-11-01T09:00:00Z}, {ProductId 12, Quantity 2, AddedAt 2026-11-05T08:00:00Z}]`.

## Steps

1. Call `UpdateBasket` with items `[{product_id: 99, quantity: 3}, {product_id: 12, quantity: 2}]`.

## Expected result

- Saved basket: product 99 Quantity 3 AddedAt `2026-11-01T09:00:00Z`; product 12 Quantity 2 AddedAt `2026-11-05T08:00:00Z`.
- Response: product 99 `added_at` `2026-11-01T09:00:00Z`, product 12 `added_at` `2026-11-05T08:00:00Z`.
- No item has AddedAt `2026-11-20T10:00:00Z`.
