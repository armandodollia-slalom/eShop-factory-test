---
id: TC-BUG-15-02
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: a JSON null body returns 400"]
priority: P2
---

# TC-BUG-15-02: JSON null body is rejected with 400

## Why

- A body of literal null is a distinct binding path from an absent body; the story decision names it explicitly.

## Preconditions

- The Ordering functional-test fixture is running (OrderingApiFixture, auto-authorized caller, api-version 1.0).

## Steps

1. `POST api/orders/draft` with header `Content-Type: application/json`, body `null`.

## Expected result

- Status code is 400.
- `Content-Type` is `application/problem+json`.
- Problem details `detail` is `An order draft requires at least one item.`
