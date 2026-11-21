---
id: TC-BUG-10-16
type: sad
sad-path: conflict
layer: unit
covers: ["Implementation Notes: 409 vs 400 mapping in OrderRuleViolation"]
priority: P2
---

# TC-BUG-10-16: OrdersApi maps OrderingDomainException to 409 and a validation-wrapped one to 400

## Why

- Cheap in-process check of both branches of the mapping using NSubstitute mocks of the mediator, in `OrdersWebApiTest`.

## Preconditions

- Mediator mock throws `OrderingDomainException("rule")` for one case and `OrderingDomainException("x", new ValidationException("bad input"))` for another.

## Steps

1. Call `OrdersApi.CancelOrderAsync` with a fresh request id and the mocked services, once per exception.
2. Repeat for `ShipOrderAsync`.

## Expected result

- Rule exception: ProblemHttpResult with status 409 and detail `rule`.
- Validation-wrapped exception: status 400 and detail `bad input`.
- Same for both endpoints.
