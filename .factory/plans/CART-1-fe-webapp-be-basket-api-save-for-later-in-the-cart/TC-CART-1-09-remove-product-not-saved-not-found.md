---
id: TC-CART-1-09
type: sad
sad-path: not-found
layer: unit
covers: ["AC9", "Removing a product that is not saved fails with NOT_FOUND and changes nothing"]
priority: P1
---

# TC-CART-1-09: RemoveSavedItem of a product that is not saved fails with NOT_FOUND

## Why

- AC9, remove branch; the product is in the cart and must not be removed from it by mistake.

## Preconditions

- Layer: MSTest in `tests/Basket.UnitTests/BasketServiceTests.cs`; `BasketService` built with `Substitute.For<IBasketRepository>()` and `NullLogger<BasketService>.Instance`; `CreateContext("user-1")` gives the authenticated caller `user-1`.
- `GetBasketAsync("user-1")` returns a basket with Items [product 2 x 1] and SavedItems [product 1 x 2].

## Steps

1. Call `service.RemoveSavedItem(new RemoveSavedItemRequest { ProductId = 2 }, CreateContext("user-1"))`.

## Expected result

- An `RpcException` with `StatusCode.NotFound` is thrown.
- `UpdateBasketAsync` was not called.
