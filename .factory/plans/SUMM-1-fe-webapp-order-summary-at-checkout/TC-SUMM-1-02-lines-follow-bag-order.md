---
id: TC-SUMM-1-02
type: happy
layer: e2e
covers: ["AC1: lines in the same order as the shopping bag"]
priority: P2
---

# TC-SUMM-1-02: Summary lines follow the shopping bag's order

## Why

- AC1 requires the summary to list lines "in the same order as the shopping bag". In TC-SUMM-1-01 the bag order coincides with catalog id order, so a summary sorted by product id or name would still pass; this case adds the harness first so only true bag order passes. It needs the real bag and both pages, hence e2e.

## Preconditions

- Scenario `default`; alice's basket is empty.
- Signed in as alice (`alice` / `Pass123$`).
- On `/item/2` alice presses **Add to shopping bag** once; then on `/item/1` she presses it twice. Her bag holds "Summit Pro Harness" × 1 added first and "Wanderer Black Hiking Boots" × 2 added second.

## Steps

1. As alice, navigate to `/cart` and read the `.cart-item .name` texts in document order.
2. Navigate to `/checkout` and read the `li.order-summary-item .order-summary-item-name` texts in document order.

## Expected result

- Step 1 yields `["Summit Pro Harness", "Wanderer Black Hiking Boots"]`.
- Step 2 yields `["Summit Pro Harness", "Wanderer Black Hiking Boots"]`, identical to step 1.
