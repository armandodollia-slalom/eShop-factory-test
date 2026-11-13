---
id: TC-BUG-10-17
type: sad
sad-path: conflict
layer: unit
covers: ["Deviations: POST /api/orders must not change (BUG-9)"]
priority: P1
---

# TC-BUG-10-17: CreateOrderAsync still returns Ok when a domain exception is thrown

## Why

- Rethrowing in the shared handler could leak into create order, which BUG-9 owns; it must keep returning 200.

## Preconditions

- `IMediator.Send` for the identified create command throws `OrderingDomainException`; valid request with non-empty `x-requestid` and a card number of at least 4 digits.

## Steps

1. Call `OrdersApi.CreateOrderAsync(<guid>, <request>, services)`.

## Expected result

- Result is `Ok`; no exception escapes.
