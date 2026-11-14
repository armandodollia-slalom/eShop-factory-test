---
id: TC-BUG-8-04
type: happy
layer: unit
covers: ["Outputs: valid quantities still saved", "BasketItem.Validate Quantity < 1"]
priority: P1
---

# TC-BUG-8-04: A line with quantity 1 is still accepted and saved

## Why

- Lower valid boundary; guards against the fix over-rejecting and breaking add-to-cart.

## Preconditions

- Authenticated caller alice.
- IBasketRepository mock: `UpdateBasketAsync` returns the basket it receives.

## Steps

1. Call `BasketService.UpdateBasket` with the single item `{productId: 7, quantity: 1}`.

## Expected result

- No exception is thrown.
- `UpdateBasketAsync` is called once with BuyerId "alice" and one item `{ProductId: 7, Quantity: 1}`.
- The response contains one item `{productId: 7, quantity: 1}`.
