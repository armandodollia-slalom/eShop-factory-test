---
id: TC-ORDST-1-02
type: happy
layer: e2e
covers: ["AC5: Without status it returns all of the shopper's orders, as today"]
priority: P1
---

# TC-ORDST-1-02: GET /api/orders without status still returns all four of alice's orders

## Why

- The new optional parameter must not change the existing unfiltered contract that the WebApp's "All" view and other clients use. A separate case because a regression here (for example defaulting to one status) would break every existing caller while filtered cases still pass.

## Preconditions

- Test stack running with scenario `ordst-1`.
- A bearer token for `alice` / `Pass123$`.

## Steps

1. `GET /api/orders?api-version=1.0` with alice's token, no `status` parameter.

## Expected result

- `200 OK` with a JSON array of exactly 4 elements.
- `ordernumber` values are exactly `{101, 102, 103, 104}`.
- Their `status` values are `Paid` (101), `Paid` (102), `Shipped` (103), `Cancelled` (104).
- Their `total` values are `10.00`, `20.00`, `30.00`, `40.00` respectively.
