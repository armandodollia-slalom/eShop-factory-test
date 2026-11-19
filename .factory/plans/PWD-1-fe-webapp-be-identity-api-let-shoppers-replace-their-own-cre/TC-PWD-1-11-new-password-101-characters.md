---
id: TC-PWD-1-11
type: sad
sad-path: boundary
layer: e2e
covers: ["AC4: sign-in service's rules (maximum length 100, just outside)", "AC4: nothing changes"]
priority: P3
---

# TC-PWD-1-11: New password of 101 characters (one above maximum) is refused

## Why

- The view model caps the new password at 100 characters; 101 is just outside. The value meets every character rule so only the maximum can reject it.

## Preconditions

- Scenario `pwd-1`; user `pwd1-long` with password `Factoryfake1$`.

## Steps

1. Open `<WebAppUrl>/`, sign in as `pwd1-long` with `Factoryfake1$`.
2. Open `<IdentityUrl>/Manage/ChangePassword`, fill current `Factoryfake1$`, and in both new and confirm a 101-character value: `Factoryfake1$` followed by 88 letters `a`. Submit.
3. Open a new browser context with no cookies and sign in as `pwd1-long` with `Factoryfake1$`.

## Expected result

- After step 2 the browser is still on `/Manage/ChangePassword` and shows the exact text "The New password must be at least 6 and at max 100 characters long."; "Your password has been changed." is not shown.
- Step 3 succeeds: the original password still signs the shopper in.
