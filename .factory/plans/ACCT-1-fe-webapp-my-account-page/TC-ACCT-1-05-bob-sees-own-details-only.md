---
id: TC-ACCT-1-05
type: sad
sad-path: ownership
layer: e2e
covers: ["AC3: bob sees \"Bob Smith\" and \"BobSmith@email.com\"", "AC3: nothing of alice's"]
priority: P1
---

# TC-ACCT-1-05: Account page shows bob's own name and email and none of alice's

## Why

- AC3 guards against the page showing a fixed or another user's details; a hard-coded or cached value would leak alice's data to bob. Uses a fresh browser context so only bob's session exists.

## Preconditions

- Scenario `default`: bob has Name "Bob", LastName "Smith", Email "BobSmith@email.com".
- A new browser context with no prior sign-in.

## Steps

1. In the new context, sign in to the WebApp as `bob` / `Pass123$`.
2. Navigate to `/user/account`.

## Expected result

- The page shows the text "Bob Smith".
- The page shows the text "BobSmith@email.com".
- The page does not contain the text "Alice Smith".
- The page does not contain the text "AliceSmith@email.com".
