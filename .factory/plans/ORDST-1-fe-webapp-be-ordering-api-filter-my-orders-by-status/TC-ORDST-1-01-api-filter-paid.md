---
id: TC-ORDST-1-01
type: happy
layer: e2e
covers: ["AC5: returns only that shopper's orders in that status", "AC5: each as the unfiltered request returns it"]
priority: P1
---

# TC-ORDST-1-01: GET /api/orders?status=Paid returns only alice's two Paid orders, each as the unfiltered request returns it

## Why

- AC5 is the API contract the page depends on: a status filter must drop the orders in other statuses and must not change how the remaining ones are represented. It runs on the test stack because the Ordering functional host cannot hold saved orders; alice has orders in three statuses so a filter that ignores `status` would fail.

## Preconditions

- Test stack running with scenario `ordst-1` (alice: orders 101 and 102 Paid, 103 Shipped, 104 Cancelled).
- A bearer token for `alice` / `Pass123$` from Identity with the orders scope.

## Steps

1. `GET /api/orders?api-version=1.0` with alice's token; keep the body as `all`.
2. `GET /api/orders?api-version=1.0&status=Paid` with alice's token.

## Expected result

- Step 2 answers `200 OK` with a JSON array of exactly 2 elements.
- Their `ordernumber` values are exactly `{101, 102}` and both have `status` `"Paid"`.
- Each element is deep-equal (every field: `ordernumber`, `date`, `status`, `total`) to the element with the same `ordernumber` in `all`.
- Orders 103 and 104 are not in the step 2 body.
