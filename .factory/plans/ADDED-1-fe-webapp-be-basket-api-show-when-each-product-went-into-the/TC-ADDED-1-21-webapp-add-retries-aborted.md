---
id: TC-ADDED-1-21
type: sad
sad-path: concurrency
layer: unit
covers: ["FLOW-1-2", "AC2: adding more of a product keeps the date", "Basket API Aborted on concurrent change (sol-3)"]
priority: P1
---

# TC-ADDED-1-21: Adding a product in the WebApp re-reads the basket and retries once when the Basket API answers Aborted

## Why

- Upheld gap FLOW-1-2 for the add path: "Add to shopping bag" must survive one `Aborted` from the Basket API by recomputing the new quantity from a fresh read and sending it again. Without the re-read, the retry would resend the stale quantity and drop the concurrent change. Separate from TC-ADDED-1-20 because `AddAsync` computes the line differently (increment, not set). Unit layer for the same reason: the `Aborted` sequence is injected through the gRPC client substitute.

## Preconditions

- `BasketState` built as in TC-ADDED-1-20 (real `BasketService` over a substitute `Basket.BasketClient`, real `CatalogService` with a fake handler answering for item 99, authenticated user `buyer-1`, one counting change subscriber).
- `GetBasketAsync` on the gRPC substitute returns, in order:
  1. `[{product_id: 99, quantity: 1}]`,
  2. `[{product_id: 99, quantity: 2}]` (a concurrent add of the same product from another tab).
- `UpdateBasketAsync` throws `RpcException(new Status(StatusCode.Aborted, "factoryfake concurrent change"))` on the first call and completes on the second.

## Steps

1. Call `basketState.AddAsync(new CatalogItem(99, "Adventurer GPS Watch", "", 199.99m, "", 1, new CatalogBrand(1, "factoryfake brand"), 1, new CatalogItemType(1, "factoryfake type")))`.

## Expected result

- The call completes without throwing.
- `GetBasketAsync` was called exactly 2 times and `UpdateBasketAsync` exactly 2 times.
- The first `UpdateBasketRequest` has exactly one item `{product_id: 99, quantity: 2}`; the second has exactly one item `{product_id: 99, quantity: 3}` (incremented from the fresh read, not a resend of 2).
- No item in either request has `added_at` set.
- The change subscriber was invoked exactly once.
