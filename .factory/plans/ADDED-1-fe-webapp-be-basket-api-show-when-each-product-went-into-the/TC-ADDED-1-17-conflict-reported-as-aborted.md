---
id: TC-ADDED-1-17
type: sad
sad-path: concurrency
layer: unit
covers: ["AC3: a stale timestamp is never written", "Implementation Notes: retries exhausted after concurrent writes"]
kept-for: sol-3
priority: P1
---

# TC-ADDED-1-17: UpdateBasket reports repeated concurrent-write conflicts as Aborted, not NotFound

## Why

- Upheld findings sol-3 and opus-r2-1: when the repository gives up after repeated conflicts, the service must tell the client the update was aborted and can be retried; reporting `NotFound` ("basket does not exist") is false and hides the conflict. Only the gRPC service decides the status, so the unit layer with a throwing substitute pins it exactly.

## Preconditions

- `BasketService` with a fake `TimeProvider` fixed at `2026-11-20T10:00:00Z`; caller `buyer-1`.
- Repository substitute whose `UpdateBasketAsync("buyer-1", Arg.Any<Func<CustomerBasket, CustomerBasket>>())` throws `new BasketConcurrencyException("buyer-1", 10)`.

## Steps

1. Call `UpdateBasket` with items `[{product_id: 99, quantity: 2}]`.

## Expected result

- The call throws `RpcException` with `StatusCode.Aborted`.
- The status code is not `StatusCode.NotFound` and the message does not contain "does not exist".
- `BasketConcurrencyException` itself does not escape the service (the caller sees only the `RpcException`).
- The repository's `UpdateBasketAsync(CustomerBasket)` overload (unconditional write) is never called.
