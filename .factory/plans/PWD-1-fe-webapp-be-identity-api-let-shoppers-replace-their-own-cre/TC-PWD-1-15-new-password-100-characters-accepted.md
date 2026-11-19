---
id: TC-PWD-1-15
type: happy
layer: e2e
covers: ["AC4: sign-in service's rules (maximum length 100, just inside)", "AC2: change saved"]
priority: P3
---

# TC-PWD-1-15: New password of exactly 100 characters (maximum) is accepted

## Why

- Just-inside counterpart of TC-PWD-1-11: a maximum set too low (for example 99) would still refuse 101 characters, so only an accepted 100-character value proves the upper limit is not too restrictive. Proving the stored change needs a fresh sign-in, so e2e.

## Preconditions

- Scenario `pwd-1`; user `pwd1-max` with password `Factoryfake1$`.

## Steps

1. Open `<WebAppUrl>/`, sign in as `pwd1-max` with `Factoryfake1$`.
2. Open `<IdentityUrl>/Manage/ChangePassword`, fill current `Factoryfake1$`, and in both new and confirm a 100-character value: `Factoryfake1$` followed by 87 letters `a`. Submit.
3. Open a new browser context with no cookies and sign in as `pwd1-max` with the same 100-character value.

## Expected result

- After step 2 the page shows "Your password has been changed." and no validation error.
- Step 3 succeeds: the shopper is signed in to the WebApp (header shows the user menu with "Log out").
