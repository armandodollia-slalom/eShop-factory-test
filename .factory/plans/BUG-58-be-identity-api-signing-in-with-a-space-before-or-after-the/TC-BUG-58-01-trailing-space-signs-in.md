---
id: TC-BUG-58-01
type: happy
layer: e2e
covers: ["What should happen: alice followed by a space with the right password signs in as alice", "What happens step 2 (the reported reproduction)"]
priority: P1
---

# TC-BUG-58-01: User name with a trailing space signs in as alice

## Why

- This is the exact reproduction in the ticket (a pasted name with a space after it) and the core of the fix; if it regresses the shopper is told their credentials are wrong. It needs the e2e layer because Identity.API has no in-process test project and the result is only visible as a completed sign-in round trip back to the WebApp.

## Preconditions

- Test stack up with scenario `default`; user `alice` exists with password `Pass123$` and is not locked out.
- Browser context is signed out (fresh context, no cookies).

## Steps

1. Open the WebApp home page (`/`).
2. Click the "Sign in" button; wait for the Identity sign-in page with the heading "Login".
3. Fill the "Username" field with the name `alice` followed by one space character (six characters in total, nothing else).
4. Fill the "Password" field with `Pass123$`.
5. Click the "Login" button.
6. On the WebApp, open the Account menu (hover or focus the "Account" button) and read the text of the signed-in user name, `.user-menu-name`.

## Expected result

- The browser is redirected back to the WebApp (the URL is on the WebApp's host, not on the Identity host).
- The WebApp header shows the "Account" button (the signed-in user menu) and no longer shows the "Sign in" button.
- The text "Invalid username or password" is not shown on any page during the flow.
- The signed-in user is alice: the `.user-menu-name` text (the WebApp's `User.Identity.Name`, from alice's seeded account) contains `alice` ignoring case, does not contain `bob`, and is exactly the same text that TC-BUG-58-04's plain `alice` sign-in shows there (record it in the same test run by signing in as `alice` in a fresh, signed-out context).
