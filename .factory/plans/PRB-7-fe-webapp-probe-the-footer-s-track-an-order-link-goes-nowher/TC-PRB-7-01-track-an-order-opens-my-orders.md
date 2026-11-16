---
id: TC-PRB-7-01
type: happy
layer: e2e
covers: ["Steps to Reproduce 1-3", "Expected: Track an order opens the My orders page (/user/orders)", "Acceptance Criteria"]
priority: P1
---

# TC-PRB-7-01: Signed-in shopper clicking footer "Track an order" lands on My orders

## Why

- This is the bug's reproduction and the acceptance criterion verbatim: the link had no destination, so a click did nothing. It must be e2e because the defect is a rendered anchor in the WebApp footer and the outcome is browser navigation to an authorized page; no cheaper layer renders the footer and follows the link.

## Preconditions

- Test stack running with scenario `default`.
- User `alice` / `Pass123$` exists; she has no orders (none seeded).

## Steps

1. Open the WebApp home page (`/`) and sign in as `alice` with password `Pass123$`; wait until the header shows the signed-in user menu.
2. Scroll to the footer (`footer.eshop-footer`).
3. In the footer navigation with accessible name "Support", click the link with exact text "Track an order".

## Expected result

- The browser navigates: the URL path becomes `/user/orders` (it no longer equals the home page URL from before the click).
- The document title is `My orders | AdventureWorks`.
- No sign-in prompt is shown (alice stays signed in) and no error page is rendered.
