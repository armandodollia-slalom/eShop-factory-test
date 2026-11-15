---
id: TC-SUMM-1-04
type: sad
sad-path: boundary
layer: e2e
covers: ["AC2: formatted like the shopping bag's prices"]
priority: P2
---

# TC-SUMM-1-04: Line total and order total above $1,000 use the bag's thousands format

## Why

- AC2 says amounts are "formatted like the shopping bag's prices". Below $1,000 almost any two-decimal format matches, so the boundary that tells formats apart is the thousands separator: the bag shows `$1,099.90`, formatted with N2 in the invariant culture. A summary using a different format, such as F2 or a culture-specific one, would drop the comma and show the digits 1099.90 instead. Comparing against the bag page's own text on the same bag pins "like the shopping bag".

## Preconditions

- Scenario `default`; alice's basket is empty.
- Signed in as alice (`alice` / `Pass123$`).
- On `/item/1` alice presses **Add to shopping bag** once; on `/cart` she sets the quantity of "Wanderer Black Hiking Boots" to 10 by pressing **Increase quantity of Wanderer Black Hiking Boots** 9 times, waiting for each update. On `/item/2` she presses **Add to shopping bag** once.
- Her bag holds 10 × "Wanderer Black Hiking Boots" ($109.99) and 1 × "Summit Pro Harness" ($89.99).

## Steps

1. As alice, navigate to `/cart` and read the `.catalog-item-total` text of the "Wanderer Black Hiking Boots" line.
2. Navigate to `/checkout`.

## Expected result

- Step 1 reads `$1,099.90`.
- On `/checkout`, the "Wanderer Black Hiking Boots" `li.order-summary-item` shows `Qty 10` and `.order-summary-item-total` = `$1,099.90`.
- `.order-summary-count` value = `11`.
- `.order-summary-total` value = `$1,189.89`.
