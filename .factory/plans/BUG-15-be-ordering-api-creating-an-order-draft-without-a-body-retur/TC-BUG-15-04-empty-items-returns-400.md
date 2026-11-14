---
id: TC-BUG-15-04
type: sad
sad-path: boundary
layer: functional
covers: ["Suggested fix: validate empty Items", "Decisions: empty Items returns 400"]
priority: P1
---

# TC-BUG-15-04: Body with empty Items is rejected with 400

## Why

- Boundary of the item-count rule: zero items is rejected, one item (case 05) is accepted.

## Preconditions

- The Ordering functional-test fixture is running (OrderingApiFixture, auto-authorized caller, api-version 1.0).

## Steps

1. `POST api/orders/draft` with `Content-Type: application/json`, body `{"buyerId":"b1","items":[]}`.

## Expected result

- Status code is 400.
- `Content-Type` is `application/problem+json`.
- Problem details `detail` is `An order draft requires at least one item.`
