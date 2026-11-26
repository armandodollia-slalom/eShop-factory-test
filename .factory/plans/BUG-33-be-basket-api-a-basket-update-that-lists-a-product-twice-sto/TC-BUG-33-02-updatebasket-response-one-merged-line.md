---
id: TC-BUG-33-02
type: happy
layer: functional
covers: ["Expected: The basket holds one line for product 1, with quantity 3 (UpdateBasket's returned basket)"]
priority: P2
---

# TC-BUG-33-02: UpdateBasket response for product 1 listed twice (1 + 2) holds one line with quantity 3

## Why

- `UpdateBasket` returns the stored basket, and callers (the WebApp's basket state) can use that response directly. If the merge happened only on read, or the response were built from the raw request, the caller would still see two lines. Separate from TC-BUG-33-01 because it checks a different output; functional so the response comes from the real repository round trip.

## Preconditions

- Same service wiring as TC-BUG-33-01 (`BasketService` over `RedisBasketRepository` on `RedisFixture`).
- Buyer id `bug33-tc02-bob`; no basket stored for it; context user has claim `sub` = `bug33-tc02-bob`.

## Steps

1. Call `UpdateBasket` with `UpdateBasketRequest { items: [ { product_id: 1, quantity: 1 }, { product_id: 1, quantity: 2 } ] }`.

## Expected result

- The returned `CustomerBasketResponse` has exactly 1 item: `product_id` = 1, `quantity` = 3.
