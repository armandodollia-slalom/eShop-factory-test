---
id: TC-BUG-33-08
type: sad
sad-path: auth
layer: functional
covers: ["Steps to Reproduce: step 1 (an access token for the caller is required)", "Expected: Updates behave as they do today (anonymous UpdateBasket is refused)"]
priority: P2
---

# TC-BUG-33-08: UpdateBasket with product 1 listed twice and no authenticated user is refused with Unauthenticated and stores nothing

## Why

- The reproduction starts from a token for `bob`, and the fix moves work into the mapping step that runs inside `UpdateBasket`. If the merge ran before the identity check, or a refactor dropped the check, an anonymous call could write a merged basket under an empty buyer id. Functional so the "stores nothing" half is checked against real Redis, not a mock.

## Preconditions

- Same service wiring as TC-BUG-33-01 (`BasketService` over `RedisBasketRepository` on `RedisFixture`).
- The `ServerCallContext` carries an `HttpContext` (user state `__HttpContext`) whose user has no claims (no `sub`).
- No basket is stored under buyer id `""` (call `DeleteBasketAsync("")` first).

## Steps

1. Call `UpdateBasket` with `UpdateBasketRequest { items: [ { product_id: 1, quantity: 1 }, { product_id: 1, quantity: 2 } ] }` and the context above.

## Expected result

- Step 1 throws an `RpcException` with `StatusCode` = `Unauthenticated` and `Status.Detail` = `The caller is not authenticated.`
- `RedisBasketRepository.GetBasketAsync("")` returns `null` after step 1.
