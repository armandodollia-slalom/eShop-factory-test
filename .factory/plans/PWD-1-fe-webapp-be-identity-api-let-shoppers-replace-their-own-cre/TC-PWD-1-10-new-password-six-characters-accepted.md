---
id: TC-PWD-1-10
type: happy
layer: e2e
covers: ["AC4: sign-in service's rules (minimum length 6, just inside)", "AC2: change saved"]
priority: P2
---

# TC-PWD-1-10: New password of exactly 6 characters (minimum) is accepted

## Why

- Just-inside counterpart of TC-PWD-1-09: an off-by-one in the length rule would refuse a valid password. Proving the stored change needs a fresh sign-in, so e2e.

## Preconditions

- Scenario `pwd-1`; user `pwd1-min` with password `Factoryfake1$`.

## Steps

1. Open `<WebAppUrl>/`, sign in as `pwd1-min` with `Factoryfake1$`.
2. Open `<IdentityUrl>/Manage/ChangePassword`, fill current `Factoryfake1$`, new `Fk1$ab` (6 characters: upper, lower, digit, symbol), confirm `Fk1$ab` and submit.
3. Open a new browser context with no cookies and sign in as `pwd1-min` with `Fk1$ab`.

## Expected result

- After step 2 the page shows "Your password has been changed." and no validation error.
- Step 3 succeeds: the shopper is signed in to the WebApp with the 6-character password.
