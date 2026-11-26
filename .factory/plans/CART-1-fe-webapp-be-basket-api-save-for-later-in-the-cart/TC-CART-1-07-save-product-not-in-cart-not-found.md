---
id: TC-CART-1-07
type: sad
sad-path: not-found
layer: unit
covers: ["AC9", "Saving a product that is not in the cart fails with NOT_FOUND and changes nothing"]
priority: P1
---

# TC-CART-1-07: SaveForLater of a product that is not in the cart fails with NOT_FOUND

## Why

- AC9: the story names NOT_FOUND and "changes nothing"; the risk is a phantom saved item or a partial write. Unit layer asserts the repository is never written.

## Preconditions

- Layer: MSTest in `tests/Basket.UnitTests/BasketServiceTests.cs`; `BasketService` built with `Substitute.For<IBasketRepository>()` and `NullLogger<BasketService>.Instance`; `CreateContext("user-1")` gives the authenticated caller `user-1`.
- `GetBasketAsync("user-1")` returns a basket with Items [product 2 x 1] and SavedItems [].

## Steps

1. Call `service.SaveForLater(new SaveForLaterRequest { ProductId = 99 }, CreateContext("user-1"))`.

## Expected result

- An `RpcException` with `StatusCode.NotFound` is thrown.
- `UpdateBasketAsync` and `DeleteBasketAsync` were not called.
