---
id: TC-PWD-1-09
type: sad
sad-path: boundary
layer: e2e
covers: ["AC4: sign-in service's rules (minimum length 6, just outside)", "AC4: nothing changes"]
priority: P2
---

# TC-PWD-1-09: New password of 5 characters (one below minimum) is refused

## Why

- The sign-in service's minimum length is 6 (view model `StringLength` and Identity's `RequiredLength`); 5 characters is the value just outside. The value otherwise satisfies every character rule so only length can reject it.

## Preconditions

- Scenario `pwd-1`; user `pwd1-short` with password `Factoryfake1$`.

## Steps

1. Open `<WebAppUrl>/`, sign in as `pwd1-short` with `Factoryfake1$`.
2. Open `<IdentityUrl>/Manage/ChangePassword`, fill current `Factoryfake1$`, new `Fk1$a` (5 characters: upper, lower, digit, symbol), confirm `Fk1$a` and submit.
3. Open a new browser context with no cookies and sign in as `pwd1-short` with `Factoryfake1$`.

## Expected result

- After step 2 the browser is still on `/Manage/ChangePassword` and shows the exact text "The New password must be at least 6 and at max 100 characters long."; "Your password has been changed." is not shown.
- Step 3 succeeds: the original password still signs the shopper in.
