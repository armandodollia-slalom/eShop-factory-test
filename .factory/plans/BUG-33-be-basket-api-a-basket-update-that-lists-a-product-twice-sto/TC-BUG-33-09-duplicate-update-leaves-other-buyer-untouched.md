---
id: TC-BUG-33-09
type: sad
sad-path: ownership
layer: functional
covers: ["Expected: The basket holds one line for product 1 (the caller's basket only)", "Expected: Updates behave as they do today (an update writes only the caller's basket)"]
priority: P2
---

# TC-BUG-33-09: Bob's update listing product 1 twice does not change another buyer's stored basket

## Why

- The merge must apply to the caller's basket only. A fix that merged into, or keyed lines across, stored baskets (for example by reading an existing basket by product instead of by buyer) would change alice's quantities when bob updates. Functional because the risk only shows with two baskets stored in the same real Redis.

## Preconditions

- Same service wiring as TC-BUG-33-01.
- Buyer id `bug33-tc09-alice` has a stored basket with exactly 1 item `{ ProductId: 1, Quantity: 1 }` (written with `RedisBasketRepository.UpdateBasketAsync`).
- Buyer id `bug33-tc09-bob` has no stored basket (call `DeleteBasketAsync("bug33-tc09-bob")` first).
- The `ServerCallContext` user has the claim `sub` = `bug33-tc09-bob`.

## Steps

1. Call `UpdateBasket` with `UpdateBasketRequest { items: [ { product_id: 1, quantity: 1 }, { product_id: 1, quantity: 2 } ] }` and the context above.
2. Call `RedisBasketRepository.GetBasketAsync("bug33-tc09-alice")`.
3. Call `RedisBasketRepository.GetBasketAsync("bug33-tc09-bob")`.

## Expected result

- Step 2 returns a basket with `BuyerId` = `bug33-tc09-alice` and exactly 1 item: `ProductId` = 1, `Quantity` = 1.
- Step 3 returns a basket with `BuyerId` = `bug33-tc09-bob` and exactly 1 item: `ProductId` = 1, `Quantity` = 3.
