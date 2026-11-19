---
id: TC-PWD-1-14
type: sad
sad-path: validation
layer: e2e
covers: ["AC4: new one does not meet the sign-in service's rules (lowercase required)", "AC4: the sign-in service's own messages", "AC4: nothing changes"]
priority: P2
---

# TC-PWD-1-14: New password without a lowercase letter shows Identity's lowercase message and changes nothing

## Why

- Identity.API's default rules require a lowercase letter, but TC-PWD-1-08's value contains lowercase, so no other case proves that rule is enforced and its own message shown. The value satisfies every other rule and the view model's length, so only the lowercase rule can reject it; checking the unchanged credential needs a fresh sign-in, so e2e.

## Preconditions

- Scenario `pwd-1`; user `pwd1-nolower` with password `Factoryfake1$`. Identity.API keeps the default password options.

## Steps

1. Open `<WebAppUrl>/`, sign in as `pwd1-nolower` with `Factoryfake1$`.
2. Open `<IdentityUrl>/Manage/ChangePassword`, fill current `Factoryfake1$`, and in both new and confirm the value `factoryfake1$` converted to upper case (13 characters: 11 uppercase letters, the digit `1` and `$`, no lowercase letter). Submit.
3. Open a new browser context with no cookies and sign in as `pwd1-nolower` with `Factoryfake1$`.

## Expected result

- After step 2 the browser is still on `/Manage/ChangePassword` and shows the exact text "Passwords must have at least one lowercase ('a'-'z').".
- None of these texts is shown: "Passwords must have at least one digit ('0'-'9').", "Passwords must have at least one uppercase ('A'-'Z').", "Passwords must have at least one non alphanumeric character.", "Your password has been changed.", "The current password is incorrect.".
- Step 3 succeeds: the original password still signs the shopper in to the WebApp (header shows the user menu with "Log out").
