---
id: TC-BUG-55-05
type: happy
layer: e2e
covers: ["What happens: refusal lasts 'a few minutes'", "What should happen: the shopper is signed in once they can be"]
priority: P2
---

# TC-BUG-55-05: Correct password after the lockout has ended signs the shopper in

## Why

- The lockout message tells the shopper that waiting helps; this case proves that after the lockout window the correct password does sign them in. Seeding `LockoutEnd` in the past avoids waiting five real minutes in the test.

## Preconditions

- Test stack up with scenario `bug-55`; user `bug55-expired` exists with `LockoutEnabled` true, `LockoutEnd` `2020-01-01 00:00:00+00`, `AccessFailedCount` 0 and `bob`'s password hash.
- Browser context with no session cookies.

## Steps

1. Open the WebApp home page and click the sign-in link; wait for the Identity login form.
2. Enter user name `bug55-expired` and the correct password, click the login button.

## Expected result

- The browser is redirected back to the WebApp (not `/Account/Login`) and the header shows the signed-in user menu instead of the sign-in link.
- No message containing "Invalid username or password" or "locked" is shown.
