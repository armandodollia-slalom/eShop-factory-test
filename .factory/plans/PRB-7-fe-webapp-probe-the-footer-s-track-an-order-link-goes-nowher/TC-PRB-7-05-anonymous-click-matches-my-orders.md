---
id: TC-PRB-7-05
type: sad
sad-path: auth
layer: e2e
covers: ["Expected: the same page as the footer's \"My orders\" link", "Bug Report: the orders a signed-in shopper can track are on My orders"]
priority: P2
---

# TC-PRB-7-05: Anonymous click on "Track an order" is sent to sign-in, exactly like "My orders", and shows no orders

## Why

- The story says the trackable orders belong to a *signed-in* shopper and that "Track an order" must open the same page as the footer's "My orders" link. For an anonymous visitor that page (`/user/orders`, `[Authorize]`) demands sign-in, so the fixed link must behave exactly like "My orders": challenge for sign-in and never show an orders page without an identity. The risk is a fix that points somewhere unprotected or different from "My orders". The expected outcome is defined by comparison with "My orders" rather than by an invented error body; it is e2e because only the running WebApp and Identity produce the challenge redirect.

## Preconditions

- Test stack running with scenario `default`.
- Fresh browser context with no session (not signed in).

## Steps

1. Open the WebApp home page (`/`) without signing in and scroll to the footer (`footer.eshop-footer`).
2. In the footer navigation named "Shop", click the link with exact text "My orders"; wait for navigation to settle and record the resulting URL's origin and path.
3. Open the WebApp home page (`/`) again in the same anonymous context and scroll to the footer.
4. In the footer navigation named "Support", click the link with exact text "Track an order"; wait for navigation to settle and record the resulting URL's origin and path.

## Expected result

- After step 4 the browser has left the WebApp home page: the URL is no longer the home page URL from step 3.
- The origin and path recorded in step 4 equal those recorded in step 2 (the same sign-in page the "My orders" link leads to), and that page shows a sign-in form (user name and password fields).
- After step 4 the page is not the My orders page: the document title is not `My orders | AdventureWorks` and no orders list is rendered.
