---
id: TC-CANC-1-12
type: happy
layer: e2e
covers: ["AC5: placing an order works as today", "AC1: a new Submitted order shows the Cancel order button"]
priority: P2
---

# TC-CANC-1-12: Placing an order through checkout still works and the new order is listed as Submitted

## Why

- AC5 requires checkout to be unaffected; the story changed the Ordering API's command handling and the My orders page that checkout lands on. The full checkout flow only runs end to end through the WebApp on the test stack.

## Preconditions

- Scenario `canc-1` freshly loaded; alice's basket is empty; item 99 "Adventurer GPS Watch" costs 199.99.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Open `/item/99` and click "Add to shopping bag".
3. Open the shopping bag and click "Check out".
4. Enter address `15703 NE 61st Ct`, city `Redmond`, state `WA`, zip `98052`, country `U.S.` and click "Place order".

## Expected result

- After step 4 the browser is on `/user/orders`; no error page and no `role="alert"` message is shown.
- Exactly 9 order rows are listed: the 8 seeded orders and one new order whose number is not between 9101 and 9108, with Total `$199.99`, Status `Submitted` and a "Cancel order" button.
- The shopping bag is empty afterwards.
