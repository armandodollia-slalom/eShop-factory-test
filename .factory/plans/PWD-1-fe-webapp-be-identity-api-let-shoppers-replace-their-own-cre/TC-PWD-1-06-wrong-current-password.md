---
id: TC-PWD-1-06
type: sad
sad-path: validation
layer: e2e
covers: ["AC3: The current password is incorrect.", "AC3: nothing changes"]
priority: P1
---

# TC-PWD-1-06: Wrong current password shows "The current password is incorrect." and changes nothing

## Why

- AC3 protects a signed-in session left unattended from being used to take over the account, and fixes the exact message (mapped from Identity's `PasswordMismatch`). The check that nothing changed needs a fresh sign-in, so e2e.

## Preconditions

- Scenario `pwd-1`; user `pwd1-wrongcurrent` with password `Factoryfake1$`.

## Steps

1. Open `<WebAppUrl>/`, sign in as `pwd1-wrongcurrent` with `Factoryfake1$`.
2. Open `<IdentityUrl>/Manage/ChangePassword`, fill current `Factoryfake9$`, new `Factoryfake2$`, confirm `Factoryfake2$` and submit.
3. Open a new browser context with no cookies and sign in as `pwd1-wrongcurrent` with `Factoryfake1$`.
4. In another new browser context sign in as `pwd1-wrongcurrent` with `Factoryfake2$`.

## Expected result

- After step 2 the browser is still on `/Manage/ChangePassword`, the page shows the exact text "The current password is incorrect." and does not show "Your password has been changed." nor Identity's raw text "Incorrect password.".
- Step 3 succeeds (shopper signed in to the WebApp).
- Step 4 is refused with the login page's invalid-credentials error.
