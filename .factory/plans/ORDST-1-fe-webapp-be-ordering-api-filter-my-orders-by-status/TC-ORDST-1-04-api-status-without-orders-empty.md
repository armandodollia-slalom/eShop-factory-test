---
id: TC-ORDST-1-04
type: happy
layer: e2e
covers: ["AC5: returns only that shopper's orders in that status (none in that status)"]
priority: P2
---

# TC-ORDST-1-04: GET /api/orders?status=Submitted returns an empty list when alice has no Submitted orders

## Why

- A valid status that matches nothing must answer an empty list, not 400 and not the unfiltered list; the page's `No <name> orders.` message (AC4) depends on that. Separate from the 400 cases because "valid name, no match" and "invalid name" must be told apart.

## Preconditions

- Test stack running with scenario `ordst-1` (alice has no Submitted orders).
- A bearer token for `alice` / `Pass123$`.

## Steps

1. `GET /api/orders?api-version=1.0&status=Submitted` with alice's token.

## Expected result

- `200 OK` with body `[]` (an empty JSON array).
