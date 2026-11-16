---
id: TC-ACCT-1-01
type: happy
layer: e2e
covers: ["AC1: \"My account\" link above \"My orders\""]
priority: P1
---

# TC-ACCT-1-01: User menu lists "My account" directly above "My orders"

## Why

- AC1 fixes the link's position in the user menu; a link added in the wrong place or missing fails the story's entry point. The menu only exists in the rendered WebApp for a signed-in user, so e2e is the cheapest layer.

## Preconditions

- Scenario `default`; user `alice` / `Pass123$`.

## Steps

1. Open the WebApp home page `/` and sign in as `alice` / `Pass123$` through the user icon ("Sign in").
2. Back on the WebApp, hover or click the user icon button (aria-label "Account") to open the user menu.
3. Read the menu items of the user menu panel in document order.

## Expected result

- The menu contains a link with text "My account".
- The menu items, in order, are "My account", "My orders", "Log out": "My account" comes immediately before "My orders".
- Exactly one "My account" link exists in the menu.
