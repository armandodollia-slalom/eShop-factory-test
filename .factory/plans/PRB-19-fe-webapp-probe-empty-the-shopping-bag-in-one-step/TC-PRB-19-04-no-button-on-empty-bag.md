---
id: TC-PRB-19-04
type: happy
layer: e2e
covers: ["AC4: empty bag has no \"Empty bag\" button"]
priority: P2
---

# TC-PRB-19-04: Empty bag shows no "Empty bag" button

## Why

- AC4 forbids the button on an empty bag. This case uses a bag that was never filled, so it checks the empty-state markup on its own, separately from the state reached by emptying (TC-PRB-19-02 and -03). The rendered page is the only place to see it, hence `e2e`.

## Preconditions

- Test stack running with scenario `default`; `alice` has never added a product (empty basket).

## Steps

1. Sign in through the WebApp as `alice` / `Pass123$`.
2. Open `/cart`.

## Expected result

- The heading "Your shopping bag is empty" is visible.
- The page has no element with the text or accessible name "Empty bag" (count 0).
- No summary box (`.cart-summary`) is on the page.
