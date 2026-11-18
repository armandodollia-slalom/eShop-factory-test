---
id: TC-PRB-19-01
type: happy
layer: e2e
covers: ["AC1: summary box has an \"Empty bag\" button below \"Continue shopping\""]
priority: P1
---

# TC-PRB-19-01: Non-empty bag shows "Empty bag" in the summary box below "Continue shopping"

## Why

- AC1 places the new button in a specific spot: inside the summary box and below "Continue shopping". A button rendered elsewhere (or above the link) would still let AC2 pass, so placement gets its own case. Only the rendered page shows placement, hence `e2e`.

## Preconditions

- Test stack running with scenario `default`; `alice`'s bag is empty.

## Steps

1. Sign in through the WebApp as `alice` / `Pass123$`.
2. Open `/item/99` and click "Add to shopping bag" once.
3. Open `/cart`.

## Expected result

- Exactly one button with accessible name "Empty bag" is on the page.
- That button is inside the summary box (`.cart-summary-container`), the same box that contains "Your shopping bag", "Total", "Check out" and "Continue shopping".
- In document order inside the summary box, the "Continue shopping" link comes before the "Empty bag" button (the button's bounding box top is at or below the bottom of the "Continue shopping" link).
- The button is visible and enabled.
