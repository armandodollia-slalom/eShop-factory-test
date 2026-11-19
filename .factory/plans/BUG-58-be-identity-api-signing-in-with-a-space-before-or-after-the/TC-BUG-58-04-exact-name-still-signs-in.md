---
id: TC-BUG-58-04
type: happy
layer: e2e
covers: ["What happens: with `alice` and the same password, signing in works", "What should happen: exactly as `alice` does"]
priority: P1
---

# TC-BUG-58-04: The exact user name still signs in as alice

## Why

- The ticket states that `alice` signs in today and is the reference behaviour the spaced names must match; the change touches the user name on every sign-in, so the unspaced path must not regress. e2e because it is the same round trip as TC-BUG-58-01 and is the baseline the spaced cases are compared with.

## Preconditions

- Test stack up with scenario `default`; user `alice` exists with password `Pass123$` and is not locked out.
- Browser context is signed out (fresh context, no cookies).

## Steps

1. Open the WebApp home page (`/`).
2. Click the "Sign in" button; wait for the Identity sign-in page with the heading "Login".
3. Fill the "Username" field with `alice`.
4. Fill the "Password" field with `Pass123$`.
5. Click the "Login" button.
6. On the WebApp, open the Account menu (hover or focus the "Account" button) and read the text of the signed-in user name, `.user-menu-name`.

## Expected result

- The browser is redirected back to the WebApp (the URL is on the WebApp's host).
- The WebApp header shows the "Account" button and no longer shows the "Sign in" button.
- The text "Invalid username or password" is not shown.
- The signed-in user is alice: the `.user-menu-name` text (the WebApp's `User.Identity.Name`, from alice's seeded account) contains `alice` ignoring case and does not contain `bob`. This text is the baseline that TC-BUG-58-01, -02 and -03 compare their own `.user-menu-name` text with.
