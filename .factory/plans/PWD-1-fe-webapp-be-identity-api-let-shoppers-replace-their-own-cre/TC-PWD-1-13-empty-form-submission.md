---
id: TC-PWD-1-13
type: sad
sad-path: validation
layer: e2e
covers: ["AC2: page asks for current, new and confirmation", "AC4: page shows what is wrong", "AC4: nothing changes"]
priority: P2
---

# TC-PWD-1-13: Submitting the change form empty shows the required-field messages and changes nothing

## Why

- AC2 makes the current and new entries required inputs; an empty submit must be explained and must not reach Identity with an empty current password. Uses the view model's `[Required]` messages from the sign-in service.

## Preconditions

- Scenario `pwd-1`; user `pwd1-empty` with password `Factoryfake1$`.

## Steps

1. Open `<WebAppUrl>/`, sign in as `pwd1-empty` with `Factoryfake1$`.
2. Open `<IdentityUrl>/Manage/ChangePassword`, leave all three inputs empty and click the submit button.
3. Open a new browser context with no cookies and sign in as `pwd1-empty` with `Factoryfake1$`.

## Expected result

- After step 2 the browser is still on `/Manage/ChangePassword` and shows the exact texts "The Current password field is required." and "The New password field is required."; "Your password has been changed." is not shown.
- Step 3 succeeds: the original password still signs the shopper in.
