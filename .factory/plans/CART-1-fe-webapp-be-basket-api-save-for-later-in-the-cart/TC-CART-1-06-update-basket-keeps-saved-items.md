---
id: TC-CART-1-06
type: happy
layer: unit
covers: ["AC8", "Updating the cart items never adds, changes or removes saved products"]
priority: P1
---

# TC-CART-1-06: UpdateBasket never changes saved products

## Why

- AC8: the WebApp's add-to-cart goes through UpdateBasket, which carries no saved items; if the service overwrote the stored basket, adding a product would silently drop everything saved.

## Preconditions

- Layer: MSTest in `tests/Basket.UnitTests/BasketServiceTests.cs`; `BasketService` built with `Substitute.For<IBasketRepository>()` and `NullLogger<BasketService>.Instance`; `CreateContext("user-1")` gives the authenticated caller `user-1`.
- `GetBasketAsync("user-1")` returns a basket with Items [product 2 x 1] and SavedItems [product 1 x 2]. `UpdateBasketAsync` echoes its argument.

## Steps

1. Call `service.UpdateBasket(request, CreateContext("user-1"))` where `request.Items` is [product 2 x 1, product 3 x 1] (no saved items in the request).

## Expected result

- The response `Items` is exactly [product 2 x 1, product 3 x 1] and `SavedItems` is exactly [product 1 x 2].
- `UpdateBasketAsync` was called once with a basket whose SavedItems are [product 1 x 2].
