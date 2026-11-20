---
id: TC-ADDED-1-20
type: sad
sad-path: concurrency
layer: unit
covers: ["FLOW-1-2", "AC2: changing a quantity keeps the date", "Basket API Aborted on concurrent change (sol-3)"]
priority: P1
---

# TC-ADDED-1-20: Changing a quantity in the WebApp re-reads the basket and retries once when the Basket API answers Aborted

## Why

- Upheld gap FLOW-1-2: the Basket API now answers `Aborted` when a concurrent change to the same basket wins (TC-ADDED-1-17/18). The WebApp quantity-change path must not let the first `Aborted` fail the shopper's change: it re-fetches the basket (so the change is applied to the current basket, not the stale one) and sends the update again. `BasketState` alone decides this, so the unit layer with a substituted gRPC client drives the exact `Aborted` sequence that is impractical to provoke on the test stack.

## Preconditions

- `eShop.WebApp.Services.BasketState` built with a real `BasketService` over a substitute `Basket.BasketClient` (gRPC), a real `CatalogService` over an `HttpClient` whose fake handler answers `GET .../items/by?ids=...` with catalog items 99 ("Adventurer GPS Watch", price 199.99) and 12 (any name and price), a substitute `OrderingService`, an `AuthenticationStateProvider` returning an authenticated user with claim `sub` = `buyer-1`, and a `NullLogger<BasketState>`. The test project needs a reference to `src/WebApp`.
- `GetBasketAsync` on the gRPC substitute returns, in order:
  1. `[{product_id: 99, quantity: 1}]` (the basket the page loaded),
  2. `[{product_id: 99, quantity: 1}, {product_id: 12, quantity: 1}]` (the basket after a concurrent add of product 12).
- `UpdateBasketAsync` on the gRPC substitute throws `RpcException(new Status(StatusCode.Aborted, "factoryfake concurrent change"))` on the first call and completes successfully on the second.
- One change subscriber registered with `NotifyOnChange`, counting its invocations.

## Steps

1. Call `basketState.SetQuantityAsync(99, 3)`.

## Expected result

- The call completes without throwing.
- `GetBasketAsync` on the gRPC client was called exactly 2 times (the basket is fetched again after the `Aborted`, not reused from the cache).
- `UpdateBasketAsync` on the gRPC client was called exactly 2 times.
- The second `UpdateBasketRequest` contains exactly the items `{product_id: 99, quantity: 3}` and `{product_id: 12, quantity: 1}` (the concurrent add is kept), and no item in it has `added_at` set.
- The change subscriber was invoked exactly once, after the successful second update.
