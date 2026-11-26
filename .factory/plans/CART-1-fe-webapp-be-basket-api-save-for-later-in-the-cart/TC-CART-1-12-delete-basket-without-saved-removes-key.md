---
id: TC-CART-1-12
type: happy
layer: functional
covers: ["Outputs: Deleting the basket empties the cart (nothing saved)"]
priority: P2
---

# TC-CART-1-12: DeleteBasketAsync with nothing saved leaves an empty cart and nothing saved

## Why

- Guards the other branch of the delete: a basket without saved products must behave as before this story (the existing round-trip test does not assert saved products at all).

## Preconditions

- `RedisFixture`, `RedisBasketRepository`, buyer id `buyer-<guid>`. Stored basket: Items [product 2 x 1], SavedItems [].

## Steps

1. Call `repository.DeleteBasketAsync(buyerId)`.
2. Call `repository.GetBasketAsync(buyerId)`.

## Expected result

- Step 1 returns `true`.
- Step 2: `(basket?.Items.Count ?? 0)` is 0 and `(basket?.SavedItems.Count ?? 0)` is 0 (whether the stored value is removed is an implementation decision and is not asserted).
