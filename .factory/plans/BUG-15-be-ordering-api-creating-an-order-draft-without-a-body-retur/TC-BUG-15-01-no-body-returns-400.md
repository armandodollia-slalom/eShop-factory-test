---
id: TC-BUG-15-01
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 BadRequest", "Decisions: missing body returns 400 problem details"]
priority: P1
---

# TC-BUG-15-01: Draft request with no body is rejected with 400

## Why

- This is the reported bug: a missing body used to produce 500. A functional test against the in-process API proves the real model-binding path, which a unit test with mocks would skip.

## Preconditions

- The Ordering functional-test fixture is running (OrderingApiFixture, auto-authorized caller, api-version 1.0).

## Steps

1. `POST api/orders/draft` with no body and no Content-Type header, header `x-requestid: 7c9e6679-7425-40de-944b-e07fc1f90ae7`.

## Expected result

- Status code is 400, not 500.
- `Content-Type` is `application/problem+json`.
- Problem details `detail` is `An order draft requires at least one item.` and `status` is 400.
- No draft is computed (the handler is not invoked).
