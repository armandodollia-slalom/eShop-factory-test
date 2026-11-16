---
id: TC-ACCT-1-09
type: happy
layer: e2e
covers: ["AC5: \"My orders\" still there and works"]
priority: P2
---

# TC-ACCT-1-09: "My orders" is still in the user menu and opens the orders page

## Why

- AC5 is a regression guard: adding the new link must not break the existing "My orders" entry. Separate from the logout case so a failure names the broken item.

## Preconditions

- Scenario `default` (alice has no orders); `alice` signed in on the WebApp.

## Steps

1. On the WebApp home page, open the user menu.
2. Click "My orders".

## Expected result

- The browser URL path is `/user/orders`.
- The page tab title is `My orders | AdventureWorks`.
