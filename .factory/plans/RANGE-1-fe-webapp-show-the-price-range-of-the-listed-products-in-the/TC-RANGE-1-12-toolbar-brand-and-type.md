---
id: TC-RANGE-1-12
type: happy
layer: e2e
covers: ["AC2: brand Daybird together with type Footwear shows Prices $109.99 – $149.99"]
priority: P1
---

# TC-RANGE-1-12: Choosing brand Daybird and type Footwear shows "Prices $109.99 – $149.99"

## Why

- AC2's combined example checks the range follows both filters at once, as the shopper builds the selection one filter after the other.

## Preconditions

- Test stack up with the `default` scenario; anonymous visitor. Daybird Footwear: 2 products, $109.99 and $149.99.

## Steps

1. Open `/`.
2. Click the "Daybird" link in the Brand filter.
3. Click the "Footwear" link in the Type filter.

## Expected result

- The URL contains both `brand=1` and `type=1`.
- `.catalog-count` contains "2 products".
- `.catalog-price-range` has the text "Prices $109.99 – $149.99".
