---
id: TC-ACCT-1-10
type: happy
layer: e2e
covers: ["AC5: \"Log out\" still there and works"]
priority: P2
---

# TC-ACCT-1-10: "Log out" is still in the user menu and signs the user out

## Why

- AC5 regression guard for the logout form that sits next to the new link. Checking that `/user/account` then demands sign-in proves the session really ended.

## Preconditions

- Scenario `default`; `alice` signed in on the WebApp.

## Steps

1. On the WebApp, open the user menu and click "Log out".
2. After the logout completes, navigate to `/user/account`.

## Expected result

- After step 1 the WebApp header shows the "Sign in" user icon link and no user menu.
- After step 2 the browser is on the Identity service's login page (Username/Password form), not on the account page.
