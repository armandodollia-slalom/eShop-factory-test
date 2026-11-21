---
id: TC-CART-1-03
type: happy
layer: unit
covers: ["AC4", "Move to cart: if the cart already has that product, the quantities are added together"]
priority: P1
---

# TC-CART-1-03: MoveToCart adds the saved quantity to a product already in the cart

## Why

- AC4: merging, not replacing or duplicating the line. Separate from TC-CART-1-02 because it exercises the merge branch.

## Preconditions

- Layer: MSTest in `tests/Basket.UnitTests/BasketServiceTests.cs`; `BasketService` built with `Substitute.For<IBasketRepository>()` and `NullLogger<BasketService>.Instance`; `CreateContext("user-1")` gives the authenticated caller `user-1`.
- `GetBasketAsync("user-1")` returns a basket with Items [product 1 x 1] and SavedItems [product 1 x 2]. `UpdateBasketAsync` echoes its argument.

## Steps

1. Call `service.MoveToCart(new MoveToCartRequest { ProductId = 1 }, CreateContext("user-1"))`.

## Expected result

- The response `Items` is exactly one entry, product 1 x 3, and `SavedItems` is empty.
