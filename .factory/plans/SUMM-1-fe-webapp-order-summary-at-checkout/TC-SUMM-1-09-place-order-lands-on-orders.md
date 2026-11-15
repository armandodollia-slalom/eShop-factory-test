---
id: TC-SUMM-1-09
type: happy
layer: e2e
covers: ["AC5: the order is placed and she lands on her orders"]
priority: P1
---

# TC-SUMM-1-09: Placing the order from checkout lands on the orders page with the new order

## Why

- AC5 requires that adding the summary (and loading the bag in `OnInitializedAsync`) does not break placing an order. The risk is the submit postback failing or not navigating. The order travels WebApp → Basket → event bus → Ordering, so only the full test stack proves it.

## Preconditions

- Scenario `default`; alice's basket is empty and she has no orders.
- Signed in as alice (`alice` / `Pass123$`).
- On `/item/1` alice presses **Add to shopping bag** twice; on `/item/2` she presses it once.

## Steps

1. As alice, navigate to `/checkout`.
2. Leave the pre-filled shipping address (Street `15703 NE 61st Ct`, City `Redmond`, State `WA`, Zip code `98052`, Country `U.S.`) as it is and press **Place order**.
3. On `/user/orders`, wait up to 30 seconds (reloading the page) for an order row to appear.

## Expected result

- After step 2 the URL path is `/user/orders`.
- After step 3 the orders list contains exactly 1 order row (`li.orders-item` with an `.order-number`), and its `.order-total` reads `$309.97`.
- No validation message is shown on `/checkout` before the navigation.
