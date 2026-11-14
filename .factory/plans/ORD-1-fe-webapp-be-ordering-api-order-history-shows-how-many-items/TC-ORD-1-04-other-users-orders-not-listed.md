---
id: TC-ORD-1-04
type: sad
sad-path: ownership
layer: functional
covers: ["Inputs: only the signed-in user's orders", "AC7"]
priority: P1
---

# TC-ORD-1-04: GET /api/orders returns only the caller's orders

## Why

- AC7 at API level: the user filter must be unchanged after the projection change. Two buyers with orders are needed to prove another user's order (with its itemCount) never leaks.

## Preconditions

- Orders as in `_index.md`: alice has 101 and 102, bob has 103 (4 units).

## Steps

1. `GET /api/orders?api-version=1.0` authenticated as alice.
2. `GET /api/orders?api-version=1.0` authenticated as bob.

## Expected result

- Step 1: status 200, `orderNumber` values exactly 101 and 102; no element has `orderNumber` 103.
- Step 2: status 200, `orderNumber` values exactly 103, with `itemCount` 4; no element has `orderNumber` 101 or 102.
