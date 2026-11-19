---
id: TC-PWD-1-01
type: happy
layer: e2e
covers: ["AC1: Change password entry beside Log out", "AC1: opens the change page on Identity.API"]
priority: P1
---

# TC-PWD-1-01: Signed-in shopper's user menu has "Change password" beside "Log out", linking to the Identity change page

## Why

- AC1 is the only way into the feature from the shop; if the entry is missing or points at the wrong address the shopper cannot change a password at all. The menu is rendered by the WebApp and the link crosses to Identity.API, so only the e2e layer exercises both.

## Preconditions

- Scenario `pwd-1`; user `pwd1-menu` with password `Factoryfake1$`.

## Steps

1. Open `<WebAppUrl>/`, click the user/sign-in icon in the header and sign in as `pwd1-menu` with `Factoryfake1$`.
2. Back on the shop, open the user menu in the header.
3. Click "Change password".

## Expected result

- After step 2 the menu contains an item with the exact text "Change password" and an item "Log out", and "Change password" is listed directly before "Log out" (no other item between them).
- The "Change password" item's `href` is `<IdentityUrl>/Manage/ChangePassword`.
- After step 3 the browser is on `<IdentityUrl>/Manage/ChangePassword` (no sign-in prompt, because the shopper already has an Identity session) and the page shows three password inputs labelled "Current password", "New password" and "Confirm new password" and a submit button.
