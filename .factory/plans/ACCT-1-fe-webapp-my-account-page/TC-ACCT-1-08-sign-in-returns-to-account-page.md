---
id: TC-ACCT-1-08
type: happy
layer: e2e
covers: ["AC4: after signing in as alice they land on /user/account"]
priority: P1
---

# TC-ACCT-1-08: Signing in as alice from the redirect lands on /user/account

## Why

- AC4's second half: the return URL must be preserved through the OIDC round trip, otherwise the user lands on the home page. Separate from TC-07 because it checks the return, not the refusal.

## Preconditions

- Scenario `default`; a new browser context with no cookies.

## Steps

1. Navigate directly to `/user/account` on the WebApp (redirected to the Identity login page).
2. Fill Username `alice`, Password `Pass123$` and click "Login".

## Expected result

- The browser ends on the WebApp with URL path `/user/account`.
- The page shows the heading "My account" and the text "Alice Smith".
