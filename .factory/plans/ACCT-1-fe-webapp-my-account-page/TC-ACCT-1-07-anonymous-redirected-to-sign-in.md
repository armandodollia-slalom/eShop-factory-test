---
id: TC-ACCT-1-07
type: sad
sad-path: auth
layer: e2e
covers: ["AC4: visitor not signed in is sent to sign in"]
priority: P1
---

# TC-ACCT-1-07: Anonymous visitor opening /user/account is sent to sign in

## Why

- AC4: the page shows personal data and must require authentication; a missing `[Authorize]` would render the page (possibly empty) to anyone. The redirect is the OIDC challenge, observable only through the browser on the stack.

## Preconditions

- Scenario `default`; a new browser context with no cookies.

## Steps

1. Navigate directly to `/user/account` on the WebApp.

## Expected result

- The browser ends on the Identity service's login page (URL origin is the stack's identity service), showing the Username and Password fields and the "Login" button.
- No "My account" heading of the WebApp, and no "Alice Smith", "Bob Smith" or email text, is shown.
