---
id: TC-CART-1-08
type: sad
sad-path: not-found
layer: unit
covers: ["AC9", "Moving a product that is not saved fails with NOT_FOUND and changes nothing"]
priority: P1
---

# TC-CART-1-08: MoveToCart of a product that is not saved fails with NOT_FOUND

## Why

- AC9, move branch. Separate from TC-CART-1-07 because it is a different operation with its own lookup; the product is in the cart, so a wrong implementation that looks at the cart would succeed.

## Preconditions

- Layer: MSTest in `tests/Basket.UnitTests/BasketServiceTests.cs`; `BasketService` built with `Substitute.For<IBasketRepository>()` and `NullLogger<BasketService>.Instance`; `CreateContext("user-1")` gives the authenticated caller `user-1`.
- `GetBasketAsync("user-1")` returns a basket with Items [product 2 x 1] and SavedItems [product 1 x 2].

## Steps

1. Call `service.MoveToCart(new MoveToCartRequest { ProductId = 2 }, CreateContext("user-1"))`.

## Expected result

- An `RpcException` with `StatusCode.NotFound` is thrown.
- `UpdateBasketAsync` was not called.
