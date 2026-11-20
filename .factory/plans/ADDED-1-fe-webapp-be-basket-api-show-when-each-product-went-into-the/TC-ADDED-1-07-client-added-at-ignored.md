---
id: TC-ADDED-1-07
type: sad
sad-path: validation
layer: unit
covers: ["AC2: date does not change", "AC4: API keeps the time a product was first added", "Implementation Notes: the client's own value is never trusted"]
priority: P1
---

# TC-ADDED-1-07: UpdateBasket ignores an added_at sent by the client

## Why

- `added_at` is on the request message too, so a client (or a stale WebApp copy) could overwrite the first-added time, which would break AC2 and AC4. Unit layer because only the gRPC service mapping decides this.

## Preconditions

- Fake `TimeProvider` fixed at `2026-11-20T10:00:00Z`; caller `buyer-1`.
- Stored basket: `[{ProductId 99, Quantity 1, AddedAt 2026-11-01T09:00:00Z}]`.

## Steps

1. Call `UpdateBasket` with items `[{product_id: 99, quantity: 2, added_at: 2020-01-01T00:00:00Z}, {product_id: 12, quantity: 1, added_at: 2030-01-01T00:00:00Z}]`.

## Expected result

- The call succeeds (no `RpcException`).
- Saved and returned product 99: AddedAt `2026-11-01T09:00:00Z` (not 2020-01-01).
- Saved and returned product 12: AddedAt `2026-11-20T10:00:00Z` (not 2030-01-01).
