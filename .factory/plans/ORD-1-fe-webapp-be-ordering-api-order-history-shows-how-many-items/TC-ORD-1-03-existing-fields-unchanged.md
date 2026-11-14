---
id: TC-ORD-1-03
type: happy
layer: functional
covers: ["Outputs: existing fields unchanged", "AC3"]
priority: P1
---

# TC-ORD-1-03: Order summaries keep orderNumber, date, status and total

## Why

- AC3: the new field must not alter or drop `orderNumber`, `date`, `status` or `total`. The summary projection was edited, so a regression in `total` (computed in the same projection) is the main risk.

## Preconditions

- Orders 101 and 102 of alice as in `_index.md` (101 dated 2026-01-10, total 25.00; 102 dated 2026-01-11, total 12.50, both Submitted).
- The caller is authenticated as alice.

## Steps

1. `GET /api/orders?api-version=1.0` as alice.

## Expected result

- Status 200 and exactly two elements.
- Element `orderNumber` 101: `status` `Submitted`, `total` 25.0, `date` equal to the stored order date 2026-01-10.
- Element `orderNumber` 102: `status` `Submitted`, `total` 12.5, `date` equal to the stored order date 2026-01-11.
- Each element has the properties `orderNumber`, `date`, `status`, `total` and `itemCount`.
