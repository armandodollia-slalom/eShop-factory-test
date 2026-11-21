---
id: TC-CART-1-04
type: happy
layer: unit
covers: ["AC5", "Remove button: deletes the saved product, the cart is unchanged"]
priority: P1
---

# TC-CART-1-04: RemoveSavedItem deletes the saved product and leaves the cart unchanged

## Why

- AC5: Remove must not touch cart lines or other saved products. Unit layer, mocked repository.

## Preconditions

- Layer: MSTest in `tests/Basket.UnitTests/BasketServiceTests.cs`; `BasketService` built with `Substitute.For<IBasketRepository>()` and `NullLogger<BasketService>.Instance`; `CreateContext("user-1")` gives the authenticated caller `user-1`.
- `GetBasketAsync("user-1")` returns a basket with Items [product 2 x 1] and SavedItems [product 1 x 2, product 3 x 1]. `UpdateBasketAsync` echoes its argument.

## Steps

1. Call `service.RemoveSavedItem(new RemoveSavedItemRequest { ProductId = 1 }, CreateContext("user-1"))`.

## Expected result

- The response `Items` is exactly [product 2 x 1] and `SavedItems` is exactly [product 3 x 1].
