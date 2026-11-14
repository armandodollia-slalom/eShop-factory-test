---
id: TC-ORD-1-06
type: happy
layer: e2e
covers: ["Outputs: 1 item singular rendering", "AC5"]
priority: P1
---

# TC-ORD-1-06: One-unit order shows 1 item

## Why

- AC5: the singular form is a separate rendering branch (`1 item`, not `1 items`).

## Preconditions

- Scenario `ord-1` loaded; test stack up.
- Signed in as alice.

## Steps

1. Open `/user/orders`.

## Expected result

- The row of order 102 has the cell text `1 item` (exact text, no trailing `s`).
