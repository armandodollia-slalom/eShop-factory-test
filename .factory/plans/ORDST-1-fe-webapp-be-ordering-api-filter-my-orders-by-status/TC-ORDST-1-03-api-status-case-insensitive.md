---
id: TC-ORDST-1-03
type: happy
layer: e2e
covers: ["AC5: The name is matched ignoring case"]
priority: P2
---

# TC-ORDST-1-03: GET /api/orders?status=sHiPpEd matches the status name ignoring case

## Why

- AC5 explicitly requires case-insensitive matching; a strict comparison would answer 400 for a valid status. Mixed case (not just lower case) proves the comparison ignores case rather than special-casing one form. Runs on the test stack so the match has a real order to return.

## Preconditions

- Test stack running with scenario `ordst-1` (alice's only Shipped order is 103).
- A bearer token for `alice` / `Pass123$`.

## Steps

1. `GET /api/orders?api-version=1.0&status=sHiPpEd` with alice's token.

## Expected result

- `200 OK` (not 400) with a JSON array of exactly 1 element.
- That element has `ordernumber` `103`, `status` `"Shipped"` and `total` `30.00`.
