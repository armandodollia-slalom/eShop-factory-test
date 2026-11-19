---
id: TC-PWD-1-03
type: happy
layer: e2e
covers: ["AC2: change saved with all three entries right", "AC2: message Your password has been changed.", "AC2: Back to the shop link to the shop home"]
priority: P1
---

# TC-PWD-1-03: Valid change shows the confirmation and a "Back to the shop" link to the shop home

## Why

- This is the main success path of AC2: the change is saved, the shopper is told so, and can return to the shop. It spans the WebApp menu, the Identity form post and the link back to the WebApp, so it is e2e.

## Preconditions

- Scenario `pwd-1`; user `pwd1-change` with password `Factoryfake1$`.

## Steps

1. Open `<WebAppUrl>/`, sign in as `pwd1-change` with `Factoryfake1$`.
2. Open the user menu and click "Change password".
3. Fill "Current password" = `Factoryfake1$`, "New password" = `Factoryfake2$`, "Confirm new password" = `Factoryfake2$` and submit.
4. Click "Back to the shop".

## Expected result

- After step 3 the page shows the exact text "Your password has been changed." and no validation error.
- The page has a link with the exact text "Back to the shop" whose `href` is `<WebAppUrl>` (the shop's home page, the WebApp client's redirect base address).
- After step 4 the browser is on the WebApp home page (`<WebAppUrl>/`) showing the catalog, and the shopper is still signed in (the header shows the user menu, not the sign-in entry).
