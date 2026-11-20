---
id: TC-BUG-44-07
type: happy
layer: e2e
covers: ["Expected: with every field filled in, the order is placed as today", "Implementation Notes: property names Street and ZipCode stay for the order flow"]
priority: P1
---

# TC-BUG-44-07: With every address field filled, Place order places the order

## Why

- The fix touches the form model the order is built from; the story requires checkout to still succeed. A regression (for example renaming the properties instead of adding display names) would break the payload to Basket/Ordering. Creating an order needs the full test stack, so e2e.

## Preconditions

- Test stack running with scenario `default`; user `bob` has an empty basket and no orders.

## Steps

1. Sign in as `bob`.
2. Add "Explorer 45L Backpack" to the shopping bag.
3. Navigate to `/checkout`.
4. Set Address to "15703 NE 61st Ct", City to "Redmond", State to "WA", Zip code to "98052" and Country to "U.S.".
5. Click **Place order**.

## Expected result

- No validation message and no validation summary item is shown.
- The browser navigates to `/user/orders`.
- The orders page lists exactly one order for `bob`, with a total of the "Explorer 45L Backpack" price.
- The shopping bag is empty afterwards.
