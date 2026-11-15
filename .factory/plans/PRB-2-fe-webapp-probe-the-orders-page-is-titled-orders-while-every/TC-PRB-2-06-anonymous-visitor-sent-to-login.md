---
id: TC-PRB-2-06
type: sad
sad-path: auth
layer: e2e
covers: ["Expected: everything else on the page is unchanged (sign-in requirement of /user/orders)"]
priority: P2
---

# TC-PRB-2-06: An anonymous visitor opening /user/orders is sent to the Login page and does not see the "My orders" page

## Why

- The ticket requires that everything on the orders page other than the heading and tab title is unchanged, and the page is only reachable signed in (the story's own steps start with "Sign in as alice"). Editing the page's top lines (`PageTitle` and the header section) sits right next to the page's `[Authorize]` attribute; if the sign-in requirement were lost, anyone could open another shopper's orders page. e2e because the redirect to the Identity login page only happens through the WebApp in a browser.

## Preconditions

- Test stack running with scenario `default`.
- A fresh browser context with no cookies (not signed in).

## Steps

1. Navigate to `/user/orders`.

## Expected result

- A heading with the exact text `Login` is visible (the Identity sign-in page).
- The fields with placeholders `Username` and `Password` are visible.
- The page has no `h1` with the exact text `My orders`.
- No `h2` with the exact text `No orders yet` and no `.orders-list` element is on the page.
