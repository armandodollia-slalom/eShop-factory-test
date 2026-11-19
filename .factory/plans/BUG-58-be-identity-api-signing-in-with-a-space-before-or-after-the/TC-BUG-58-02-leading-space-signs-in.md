---
id: TC-BUG-58-02
type: happy
layer: e2e
covers: ["What should happen: a space followed by alice with the right password signs in as alice", "What happens: the same happens with a space before the name"]
priority: P1
---

# TC-BUG-58-02: User name with a leading space signs in as alice

## Why

- The ticket names the leading-space variant separately as a failing input; a fix that only strips the end (`TrimEnd`) would pass TC-BUG-58-01 and still fail here, so it needs its own case. Same e2e reasoning as TC-BUG-58-01.

## Preconditions

- Test stack up with scenario `default`; user `alice` exists with password `Pass123$` and is not locked out.
- Browser context is signed out (fresh context, no cookies).

## Steps

1. Open the WebApp home page (`/`).
2. Click the "Sign in" button; wait for the Identity sign-in page with the heading "Login".
3. Fill the "Username" field with one space character followed by the name `alice` (six characters in total, nothing else).
4. Fill the "Password" field with `Pass123$`.
5. Click the "Login" button.
6. On the WebApp, open the Account menu (hover or focus the "Account" button) and read the text of the signed-in user name, `.user-menu-name`.

## Expected result

- The browser is redirected back to the WebApp (the URL is on the WebApp's host).
- The WebApp header shows the "Account" button and no longer shows the "Sign in" button.
- The text "Invalid username or password" is not shown.
- The signed-in user is alice: the `.user-menu-name` text (the WebApp's `User.Identity.Name`, from alice's seeded account) contains `alice` ignoring case, does not contain `bob`, and is exactly the same text that TC-BUG-58-04's plain `alice` sign-in shows there (record it in the same test run by signing in as `alice` in a fresh, signed-out context).
