---
id: TC-PWD-1-05
type: sad
sad-path: auth
layer: e2e
covers: ["AC2: the old one is refused"]
priority: P1
---

# TC-PWD-1-05: After a change, the old password is refused at sign-in

## Why

- The point of the story is replacing a password the shopper no longer trusts; if the old password still worked the change would be worthless. Separate from TC-PWD-1-04 because a store that kept both would pass that case.

## Preconditions

- Scenario `pwd-1`; user `pwd1-oldrefused` with password `Factoryfake1$`.

## Steps

1. Open `<WebAppUrl>/`, sign in as `pwd1-oldrefused` with `Factoryfake1$`.
2. Open `<IdentityUrl>/Manage/ChangePassword`, fill current `Factoryfake1$`, new `Factoryfake2$`, confirm `Factoryfake2$` and submit; confirm the page shows "Your password has been changed.".
3. Open a new browser context with no cookies, open `<WebAppUrl>/`, click the sign-in icon and sign in as `pwd1-oldrefused` with `Factoryfake1$`.

## Expected result

- Step 3 stays on the Identity.API login page and shows its invalid-credentials error ("Invalid username or password").
- The shopper is not signed in: navigating to `<WebAppUrl>/` shows the sign-in entry, not the user menu.
