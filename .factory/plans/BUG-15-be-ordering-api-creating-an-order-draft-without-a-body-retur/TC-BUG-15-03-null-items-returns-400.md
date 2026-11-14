---
id: TC-BUG-15-03
type: sad
sad-path: validation
layer: functional
covers: ["Suggested fix: validate null Items", "Decisions: null Items returns 400"]
priority: P1
---

# TC-BUG-15-03: Body with null Items is rejected with 400

## Why

- Body is present but Items is null; the old code would have thrown downstream. Separate from the missing-body case.

## Preconditions

- The Ordering functional-test fixture is running (OrderingApiFixture, auto-authorized caller, api-version 1.0).

## Steps

1. `POST api/orders/draft` with `Content-Type: application/json`, body `{"buyerId":"b1","items":null}`.

## Expected result

- Status code is 400.
- `Content-Type` is `application/problem+json`.
- Problem details `detail` is `An order draft requires at least one item.`
