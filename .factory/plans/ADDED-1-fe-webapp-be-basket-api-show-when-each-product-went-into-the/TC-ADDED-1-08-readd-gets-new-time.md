---
id: TC-ADDED-1-08
type: happy
layer: unit
covers: ["AC3: removed and added again later gets the new date"]
priority: P1
---

# TC-ADDED-1-08: A product removed and added again later gets the time of the new add

## Why

- AC3: after a removal the old date must not come back. Two sequential updates on different days against a repository substitute that keeps the last saved basket prove the removed line's time is forgotten.

## Preconditions

- Caller `buyer-1`; repository substitute that stores what `UpdateBasketAsync` saves and passes it to the next update.
- Stored basket: `[{ProductId 99, Quantity 1, AddedAt 2026-11-01T09:00:00Z}, {ProductId 12, Quantity 1, AddedAt 2026-11-01T09:00:00Z}]`.

## Steps

1. With the fake clock at `2026-11-10T12:00:00Z`, call `UpdateBasket` with items `[{product_id: 12, quantity: 1}]` (product 99 removed).
2. With the fake clock at `2026-11-20T10:00:00Z`, call `UpdateBasket` with items `[{product_id: 12, quantity: 1}, {product_id: 99, quantity: 1}]`.

## Expected result

- After step 1 the saved basket contains only product 12 (AddedAt `2026-11-01T09:00:00Z`).
- After step 2 product 99 has AddedAt `2026-11-20T10:00:00Z` in the saved basket and in the response; product 12 keeps `2026-11-01T09:00:00Z`.
