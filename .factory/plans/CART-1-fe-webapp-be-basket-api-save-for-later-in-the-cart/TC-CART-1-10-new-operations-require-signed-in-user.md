---
id: TC-CART-1-10
type: sad
sad-path: auth
layer: unit
covers: ["Outputs: every operation still requires a signed-in user (UNAUTHENTICATED otherwise)"]
priority: P1
---

# TC-CART-1-10: SaveForLater, MoveToCart and RemoveSavedItem reject an anonymous caller

## Why

- The story requires the new operations to keep the auth rule; one case with the three calls because they share the behavior and the same assertion, mirroring the existing `UpdateBasketRejectsAnonymousUser`.

## Preconditions

- Layer: MSTest in `tests/Basket.UnitTests/BasketServiceTests.cs`; `BasketService` built with `Substitute.For<IBasketRepository>()` and `NullLogger<BasketService>.Instance`; `CreateContext("user-1")` gives the authenticated caller `user-1`.
- `CreateContext(null!)` gives an anonymous caller (no user id).

## Steps

1. Call `service.SaveForLater(new SaveForLaterRequest { ProductId = 1 }, CreateContext(null!))`.
2. Call `service.MoveToCart(new MoveToCartRequest { ProductId = 1 }, CreateContext(null!))`.
3. Call `service.RemoveSavedItem(new RemoveSavedItemRequest { ProductId = 1 }, CreateContext(null!))`.

## Expected result

- Each call throws an `RpcException` with `StatusCode.Unauthenticated`.
- `UpdateBasketAsync` was never called.
