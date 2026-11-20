---
id: TC-ADDED-1-22
type: sad
sad-path: concurrency
layer: unit
covers: ["FLOW-1-2", "Basket API Aborted on concurrent change (sol-3)"]
priority: P1
---

# TC-ADDED-1-22: When the retried basket update is aborted again, BasketState stops after two attempts and reports Aborted to the page

## Why

- Upheld gap FLOW-1-2: the retry is bounded ("at least once"), and when it still fails the page must be able to tell the shopper to try again. `BasketState` must therefore stop after its second attempt and let exactly the `Aborted` `RpcException` reach the page (which catches only that status), without notifying subscribers of a change that was not saved. Unit layer: only a substitute can make every attempt abort.

## Preconditions

- `BasketState` built as in TC-ADDED-1-20 (authenticated user `buyer-1`, one counting change subscriber).
- `GetBasketAsync` on the gRPC substitute always returns `[{product_id: 99, quantity: 1}]`.
- `UpdateBasketAsync` on the gRPC substitute throws `RpcException(new Status(StatusCode.Aborted, "factoryfake concurrent change"))` on every call.

## Steps

1. Call `basketState.SetQuantityAsync(99, 3)` and capture the exception.
2. Call `basketState.AddAsync(new CatalogItem(99, "Adventurer GPS Watch", "", 199.99m, "", 1, new CatalogBrand(1, "factoryfake brand"), 1, new CatalogItemType(1, "factoryfake type")))` and capture the exception.

## Expected result

- Step 1 throws `RpcException` with `StatusCode.Aborted`; step 2 throws `RpcException` with `StatusCode.Aborted`. Neither throws any other exception type.
- `UpdateBasketAsync` was called exactly 2 times during step 1 and exactly 2 times during step 2 (4 in total): no third attempt, no endless loop.
- The change subscriber was never invoked.
