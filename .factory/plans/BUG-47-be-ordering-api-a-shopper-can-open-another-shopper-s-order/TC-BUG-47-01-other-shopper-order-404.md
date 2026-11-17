---
id: TC-BUG-47-01
type: sad
sad-path: ownership
layer: e2e
covers: ["Steps to Reproduce: step 3", "Expected: step 3 answers 404 with no order data", "Actual: 200 with alice's shipping address, items and payment description"]
priority: P1
---

# TC-BUG-47-01: bob requesting alice's order gets 404 with no order data

## Why

- This is the reported defect: a shopper could read another shopper's order (address, items, payment description). If it regresses, any signed-in user can leak every other user's personal data by walking order numbers. It runs on the test stack because the order must really exist and belong to alice, which the functional host cannot save.

## Preconditions

- Scenario `bug-47` (`extends: default`) on the test stack.
- Order `A` placed as alice as described in `_index.md` (street `15703 NE 61st Ct`, item "Adventurer GPS Watch"); its number is read from alice's `GET /api/orders?api-version=1.0` and is present there.
- An access token for `bob` with scope `orders` from client `orderingswaggerui`.

## Steps

1. As bob: `GET /api/orders/<A>?api-version=1.0` with header `Authorization: Bearer <bob's token>`.

## Expected result

- Status is `404`.
- The response body is empty (length 0).
- The response does not contain alice's street `15703 NE 61st Ct`, the product name `Adventurer GPS Watch`, the order number `<A>` as an `orderNumber` field, or a `description` field.
- Order `A` is unchanged: alice's `GET /api/orders/<A>?api-version=1.0` afterwards still answers 200 with `orderNumber` = `<A>`.
