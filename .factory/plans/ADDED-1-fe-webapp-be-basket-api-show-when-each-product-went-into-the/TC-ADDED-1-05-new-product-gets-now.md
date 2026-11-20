---
id: TC-ADDED-1-05
type: happy
layer: unit
covers: ["AC4: API keeps the time a product was first added", "Implementation Notes: product id not in the stored basket gets the current UTC time"]
priority: P1
---

# TC-ADDED-1-05: UpdateBasket stamps a newly added product with the current UTC time

## Why

- The first-added time must come from the server clock at the moment of the first add; a wrong or missing stamp breaks AC1. Unit layer with a fake `TimeProvider` gives an exact, deterministic time.

## Preconditions

- `BasketService` built with a substituted `IBasketRepository` and a fake `TimeProvider` fixed at `2026-11-20T10:15:30Z`.
- Caller identity: user id `buyer-1`.
- Stored basket for `buyer-1`: `null` (no basket yet).
- The repository's `UpdateBasketAsync(buyerId, update)` applies `update` to the stored basket and returns its result.

## Steps

1. Call `UpdateBasket` with items `[{product_id: 99, quantity: 1}]` (no `added_at`).

## Expected result

- The basket passed to the repository has one item: ProductId 99, Quantity 1, AddedAt `2026-11-20T10:15:30Z` (Kind Utc).
- The response has one item with `product_id` 99, `quantity` 1 and `added_at` equal to `Timestamp` `2026-11-20T10:15:30Z`.
