---
id: TC-BUG-58-03
type: happy
layer: e2e
covers: ["What should happen: spaces before or after the user name are ignored"]
priority: P2
---

# TC-BUG-58-03: User name with spaces on both sides signs in as alice

## Why

- The rule is "spaces before or after the user name are ignored", plural; a name with several spaces on both sides is the literal combination of both reported variants and guards against a fix that strips only a single character or only one side. e2e for the same reason as TC-BUG-58-01.

## Preconditions

- Test stack up with scenario `default`; user `alice` exists with password `Pass123$` and is not locked out.
- Browser context is signed out (fresh context, no cookies).

## Steps

1. Open the WebApp home page (`/`).
2. Click the "Sign in" button; wait for the Identity sign-in page with the heading "Login".
3. Fill the "Username" field with two space characters, then the name `alice`, then two space characters (nine characters in total).
4. Fill the "Password" field with `Pass123$`.
5. Click the "Login" button.
6. On the WebApp, open the Account menu (hover or focus the "Account" button) and read the text of the signed-in user name, `.user-menu-name`.

## Expected result

- The browser is redirected back to the WebApp (the URL is on the WebApp's host).
- The WebApp header shows the "Account" button and no longer shows the "Sign in" button.
- The text "Invalid username or password" is not shown.
- The signed-in user is alice: the `.user-menu-name` text (the WebApp's `User.Identity.Name`, from alice's seeded account) contains `alice` ignoring case, does not contain `bob`, and is exactly the same text that TC-BUG-58-04's plain `alice` sign-in shows there (record it in the same test run by signing in as `alice` in a fresh, signed-out context).
