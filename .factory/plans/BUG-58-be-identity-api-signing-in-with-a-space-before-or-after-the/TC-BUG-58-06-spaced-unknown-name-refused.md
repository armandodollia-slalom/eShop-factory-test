---
id: TC-BUG-58-06
type: sad
sad-path: auth
layer: e2e
covers: ["What should happen: a wrong user name is still refused as today"]
priority: P1
---

# TC-BUG-58-06: A spaced unknown user name with a valid password is still refused

## Why

- The ticket keeps the refusal of a wrong user name; trimming must not make an unknown name match an existing account. The password is a real one (`bob`'s) so the only wrong thing is the user name. No account is touched, so the lockout counter is not involved.

## Preconditions

- Test stack up with scenario `default`; no user named `nosuchuser` exists.
- Browser context is signed out (fresh context, no cookies).

## Steps

1. Open the WebApp home page (`/`).
2. Click the "Sign in" button; wait for the Identity sign-in page with the heading "Login".
3. Fill the "Username" field with one space character, then the name `nosuchuser`, then one space character (twelve characters in total).
4. Fill the "Password" field with `Pass123$`.
5. Click the "Login" button.

## Expected result

- The browser stays on the Identity sign-in page (heading "Login" visible, URL on the Identity host).
- The page shows the error "Invalid username or password".
- Opening the WebApp home page (`/`) afterwards still shows the "Sign in" button and no "Account" button.
