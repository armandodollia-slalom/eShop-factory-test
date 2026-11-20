---
id: TC-BRAND-1-08
type: happy
layer: e2e
covers: ["AC3: \"1 product\" (singular)", "AC3: example \"from $8.50\""]
priority: P1
---

# TC-BRAND-1-08: Card of a brand with one product shows "1 product" and "from $8.50"

## Why

- AC3 names the singular form "1 product" and the example "from $8.50"; a naive pluralisation would show "1 products", and a price formatter that drops trailing zeros would show "$8.5". No demo brand has one product, so scenario `brand-1` adds one priced 8.50. e2e because the text is produced by the page.

## Preconditions

- Test stack running with scenario `brand-1`: brand 15 "Mono Gear" has exactly one item, 1001 "Mono Compass", price 8.50. Anonymous visitor.

## Steps

1. Open `/brands`.
2. Read the card whose heading is "Mono Gear".

## Expected result

- The card shows "1 product" and "from $8.50".
- The card does not contain the text "1 products" and does not contain "$8.5" followed by anything other than "0".
- The card does not show "No products yet".
