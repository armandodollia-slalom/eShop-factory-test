---
id: TC-BUG-58-05
type: sad
sad-path: auth
layer: e2e
covers: ["What should happen: a wrong password is still refused as today"]
priority: P1
---

# TC-BUG-58-05: A spaced user name with a wrong password is still refused

## Why

- The ticket keeps the refusal of a wrong password; ignoring spaces must not turn into a looser credential check (for example matching the name and skipping the password). Using a spaced name proves the trimmed name still goes through the password check. Uses `bob` with a single failed attempt so the lockout-on-failure counter never locks `alice`, whom the happy cases use.

## Preconditions

- Test stack up with scenario `default`; user `bob` exists with password `Pass123$` and is not locked out.
- Browser context is signed out (fresh context, no cookies).

## Steps

1. Open the WebApp home page (`/`).
2. Click the "Sign in" button; wait for the Identity sign-in page with the heading "Login".
3. Fill the "Username" field with one space character, then the name `bob`, then one space character (five characters in total).
4. Fill the "Password" field with `factoryfake-wrong-0001`.
5. Click the "Login" button.

## Expected result

- The browser stays on the Identity sign-in page (heading "Login" visible, URL on the Identity host).
- The page shows the error "Invalid username or password".
- Opening the WebApp home page (`/`) afterwards still shows the "Sign in" button and no "Account" button (the shopper is signed out).
