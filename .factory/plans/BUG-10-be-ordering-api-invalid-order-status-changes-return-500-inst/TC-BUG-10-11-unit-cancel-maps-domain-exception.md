---
id: TC-BUG-10-11
type: sad
sad-path: conflict
layer: unit
covers: ["Implementation Notes: OrdersApi.InvalidStatusChange"]
priority: P1
---

# TC-BUG-10-11: CancelOrderAsync maps OrderingDomainException to Conflict

## Why

- Cheapest layer to pin the mapping and the detail text: `OrdersWebApiTest` already calls endpoint methods with a substituted `IMediator`.

## Preconditions

- `IOrderQueries.GetOrderAsync(5)` returns an order; `IMediator.Send` for the identified cancel command throws `OrderingDomainException("Is not possible to change the order status from Shipped to Cancelled.")`.

## Steps

1. Call `OrdersApi.CancelOrderAsync(<non-empty guid>, new CancelOrderCommand(5), services)`.

## Expected result

- Result is `Conflict<ProblemDetails>` with `StatusCode` 409, `Title` "Invalid order status change" and `Detail` equal to the exception message.
