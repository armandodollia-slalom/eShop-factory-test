---
id: TC-PWD-1-12
type: sad
sad-path: auth
layer: e2e
covers: ["AC5: asked to sign in first", "AC5: come back to the change page afterwards"]
priority: P1
---

# TC-PWD-1-12: Opening the change page without an Identity session asks to sign in and returns to the change page

## Why

- AC5 protects the page from anonymous use and keeps the shopper's intent after sign-in. It depends on the Identity cookie redirect and the login `ReturnUrl`, which only run in the real host, so e2e.

## Preconditions

- Scenario `pwd-1`; user `pwd1-menu` with password `Factoryfake1$`; a fresh browser context with no cookies.

## Steps

1. Open `<IdentityUrl>/Manage/ChangePassword` directly.
2. On the page that opens, sign in as `pwd1-menu` with `Factoryfake1$`.

## Expected result

- After step 1 the browser is on the Identity.API login page (`<IdentityUrl>/Account/Login`) whose URL has a `ReturnUrl` query parameter pointing at `/Manage/ChangePassword`; the change form is not shown.
- After step 2 the browser is on `<IdentityUrl>/Manage/ChangePassword` and shows the "Current password", "New password" and "Confirm new password" inputs.
- The password of `pwd1-menu` is unchanged (no form was submitted).
