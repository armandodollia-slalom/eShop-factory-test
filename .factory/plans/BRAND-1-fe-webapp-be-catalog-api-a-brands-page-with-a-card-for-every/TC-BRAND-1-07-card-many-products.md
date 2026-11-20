---
id: TC-BRAND-1-07
type: happy
layer: e2e
covers: ["AC3: brand name", "AC3: number of products (plural)", "AC3: from $ price with two decimals"]
priority: P1
---

# TC-BRAND-1-07: Card of a brand with several products shows name, "N products" and "from $X.XX"

## Why

- AC3 fixes the card text for brands with products. Solstix's lowest price is 89.00, which proves two decimals are kept for a whole amount ("$89.00", not "$89"); Legend checks a second count and price so a hard-coded value fails. e2e because the formatting happens in the WebApp page.

## Preconditions

- Test stack running with scenario `brand-1`. Solstix (id 7) has 9 products, lowest price 89.00; Legend (id 12) has 8 products, lowest price 21.99. Anonymous visitor.

## Steps

1. Open `/brands`.
2. Read the card whose heading is "Solstix", then the card whose heading is "Legend".

## Expected result

- The "Solstix" card shows "9 products" and "from $89.00".
- The "Legend" card shows "8 products" and "from $21.99".
- Neither card shows "No products yet".
