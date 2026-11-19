---
id: TC-PWD-1-08
type: sad
sad-path: validation
layer: e2e
covers: ["AC4: new one does not meet the sign-in service's rules", "AC4: the sign-in service's own messages", "AC4: nothing changes"]
priority: P1
---

# TC-PWD-1-08: New password breaking Identity's character rules shows Identity's own messages and changes nothing

## Why

- AC4 requires Identity.API's own rule messages to be shown, not a generic error. The value is long enough to pass the view model, so only ASP.NET Core Identity's password validator can reject it; this is the path where "any other Identity error is shown as it comes".

## Preconditions

- Scenario `pwd-1`; user `pwd1-rules` with password `Factoryfake1$`. Identity.API keeps the default password options (digit, uppercase and non-alphanumeric required).

## Steps

1. Open `<WebAppUrl>/`, sign in as `pwd1-rules` with `Factoryfake1$`.
2. Open `<IdentityUrl>/Manage/ChangePassword`, fill current `Factoryfake1$`, new `factoryfakenodigits`, confirm `factoryfakenodigits` and submit.
3. Open a new browser context with no cookies and sign in as `pwd1-rules` with `Factoryfake1$`.

## Expected result

- After step 2 the browser is still on `/Manage/ChangePassword` and shows each of these exact texts:
  - "Passwords must have at least one non alphanumeric character."
  - "Passwords must have at least one digit ('0'-'9')."
  - "Passwords must have at least one uppercase ('A'-'Z')."
- "Your password has been changed." and "The current password is incorrect." are not shown.
- Step 3 succeeds: the original password still signs the shopper in.
