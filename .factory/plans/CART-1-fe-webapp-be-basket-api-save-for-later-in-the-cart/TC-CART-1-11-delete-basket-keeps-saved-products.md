---
id: TC-CART-1-11
type: happy
layer: functional
covers: ["AC7", "Deleting the basket empties the cart and keeps the saved products"]
priority: P1
---

# TC-CART-1-11: DeleteBasketAsync empties the cart and keeps the saved products in Redis

## Why

- AC7 depends on the order-started handler calling DeleteBasket; if it removed the Redis key, the saved list would be lost at checkout. Needs real Redis serialization, hence functional.

## Preconditions

- `tests/Basket.FunctionalTests/RedisBasketRepositoryTests.cs` style: `RedisFixture`, a `RedisBasketRepository`, buyer id `buyer-<guid>`.
- Stored basket: Items [product 2 x 1], SavedItems [product 1 x 2].

## Steps

1. Call `repository.DeleteBasketAsync(buyerId)`.
2. Call `repository.GetBasketAsync(buyerId)`.

## Expected result

- Step 1 returns `true`.
- Step 2 returns a basket with Items empty and SavedItems exactly [product 1 x 2].
