---
id: TC-BUG-55-06
type: happy
layer: e2e
covers: ["What happens: 'Signing in as alice with her correct password works as usual'"]
priority: P2
---

# TC-BUG-55-06: alice signs in with her correct password while another account is locked out

## Why

- The ticket states that other users are unaffected; a fix must not turn the lockout global or per-browser. Running alice's sign-in in the same browser context right after a failed sign-in for a locked-out account catches a lockout tied to the session or client instead of the user. The locked account is sent a wrong password, which is refused under either outcome the ticket allows, so this case does not depend on how the fix treats a correct password during lockout.

## Preconditions

- Test stack up with scenario `bug-55`; user `bug55-locked` exists with `LockoutEnabled` true, `LockoutEnd` `2099-01-01 00:00:00+00`, `AccessFailedCount` 0 and `bob`'s password hash; seeded user `alice` with `LockoutEnd` NULL and `AccessFailedCount` 0.
- Browser context with no session cookies.

## Steps

1. Open the WebApp home page and click the sign-in link; wait for the Identity login form.
2. Enter user name `bug55-locked` and password `factoryfake-wrong-0001`, click the login button; wait for the login form to reload.
3. In the same browser context, enter user name `alice` and her correct password (the seeded `alice` password), click the login button.

## Expected result

- After step 3 the browser is redirected back to the WebApp and the header shows alice's signed-in user menu instead of the sign-in link.
