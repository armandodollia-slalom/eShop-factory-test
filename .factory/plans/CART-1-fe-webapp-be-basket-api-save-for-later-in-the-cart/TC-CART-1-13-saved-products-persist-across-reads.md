---
id: TC-CART-1-13
type: happy
layer: functional
covers: ["AC6", "Saved products live with the basket in Redis"]
priority: P2
---

# TC-CART-1-13: Saved products round-trip through Redis and are still there when read by a new repository instance

## Why

- AC6 (sign out and in) is storage persistence, not session state. The service tests mock the repository, so only a real Redis case proves the `SavedItems` JSON property is written and read with product id and quantity intact; a second repository instance on the same connection proves it is stored, not cached in memory. This one case replaces the former separate round-trip case (a plain repository round-trip says nothing about AC1 or AC8, so it claims only AC6).

## Preconditions

- `RedisFixture`; buyer id `buyer-<guid>`.

## Steps

1. With a first `RedisBasketRepository`, call `UpdateBasketAsync` with Items [product 2 x 1] and SavedItems [product 1 x 2, product 3 x 5].
2. With a second `RedisBasketRepository` on the same connection, call `GetBasketAsync(buyerId)`.

## Expected result

- The returned basket has Items exactly [product 2 x 1].
- SavedItems contains exactly two entries: product 1 x 2 and product 3 x 5 (the set is asserted, not the order).
