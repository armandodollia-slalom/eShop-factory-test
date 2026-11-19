---
id: TC-PWD-1-02
type: sad
sad-path: auth
layer: e2e
covers: ["AC1: entry not shown to visitors who are not signed in"]
priority: P2
---

# TC-PWD-1-02: Visitor who is not signed in sees no "Change password" entry

## Why

- AC1 explicitly limits the entry to signed-in shoppers; a leak would put the entry in the anonymous header. Only the rendered WebApp layout shows this, so the case is e2e.

## Preconditions

- Scenario `pwd-1`; a fresh browser context with no cookies.

## Steps

1. Open `<WebAppUrl>/` without signing in.
2. Without clicking anything (the anonymous user icon is a link that leaves the WebApp), inspect the rendered WebApp header.

## Expected result

- The header's user icon is the sign-in link to the Identity.API login page, not a user menu (no "Log out" item).
- No element with the text "Change password" exists anywhere on the page.
- No link on the page has an `href` ending in `/Manage/ChangePassword`.
