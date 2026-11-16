---
id: TC-ACCT-1-02
type: happy
layer: e2e
covers: ["AC1: link opens /user/account"]
priority: P1
---

# TC-ACCT-1-02: "My account" link opens /user/account

## Why

- AC1 requires the link to open `/user/account`; a wrong href would leave the page unreachable from the UI. Separate from TC-01 because it checks navigation, not menu layout.

## Preconditions

- Scenario `default`; `alice` signed in on the WebApp (as in TC-ACCT-1-01 step 1).

## Steps

1. On the WebApp home page, open the user menu.
2. Click the "My account" link.

## Expected result

- The browser URL path is `/user/account`.
- The page shows the heading "My account" (no sign-in page, no error page).
