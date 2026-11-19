---
id: TC-PWD-1-07
type: sad
sad-path: validation
layer: e2e
covers: ["AC4: the two new entries differ", "AC4: nothing changes"]
priority: P1
---

# TC-PWD-1-07: New and confirmation entries that differ are reported and change nothing

## Why

- AC4 guards against a typo locking the shopper out with a password they did not intend. The message comes from the view model's `[Compare]` rule on Identity.API.

## Preconditions

- Scenario `pwd-1`; user `pwd1-mismatch` with password `Factoryfake1$`.

## Steps

1. Open `<WebAppUrl>/`, sign in as `pwd1-mismatch` with `Factoryfake1$`.
2. Open `<IdentityUrl>/Manage/ChangePassword`, fill current `Factoryfake1$`, new `Factoryfake2$`, confirm `Factoryfake3$` and submit.
3. Open a new browser context with no cookies and sign in as `pwd1-mismatch` with `Factoryfake1$`.

## Expected result

- After step 2 the browser is still on `/Manage/ChangePassword` and shows the exact text "The new password and confirmation password do not match."; "Your password has been changed." is not shown.
- Step 3 succeeds: the original password still signs the shopper in.
