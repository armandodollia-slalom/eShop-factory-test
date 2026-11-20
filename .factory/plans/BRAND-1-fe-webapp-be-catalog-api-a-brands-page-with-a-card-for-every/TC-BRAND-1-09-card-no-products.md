---
id: TC-BRAND-1-09
type: happy
layer: e2e
covers: ["AC4: brand name and \"No products yet\"", "AC4: no price"]
priority: P1
---

# TC-BRAND-1-09: Card of a brand without products shows "No products yet" and no price

## Why

- AC4 fixes the empty state; the API returns `itemCount` 0 and `lowestPrice` null for it, and a page that formats null would show "0 products", "from $" or "from $0.00". Scenario `brand-1` adds the only brand without products. e2e because the empty-state text is rendered by the page.

## Preconditions

- Test stack running with scenario `brand-1`: brand 14 "Acme Empty" has no items. Anonymous visitor.

## Steps

1. Open `/brands`.
2. Read the card whose heading is "Acme Empty".

## Expected result

- The card shows the heading "Acme Empty" and the text "No products yet".
- The card contains no "$", no "from" and no product count (no digit followed by " product", so neither "0 products" nor "0 product").
