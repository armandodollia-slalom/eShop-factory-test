---
id: TC-ACCT-1-06
type: sad
sad-path: ownership
layer: e2e
covers: ["AC3: nothing of alice's", "AC5: Log out works as today"]
priority: P2
---

# TC-ACCT-1-06: After alice logs out and bob signs in in the same browser, the page shows only bob's details

## Why

- AC3 in the realistic shared-browser case: if the page or circuit kept the previous user's claims, alice's details would show to bob. Distinct from TC-05, which starts from a clean context.

## Preconditions

- Scenario `default`; one browser context.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$` and navigate to `/user/account`; confirm "Alice Smith" is shown.
2. Open the user menu and click "Log out".
3. Click the user icon ("Sign in") and sign in as `bob` / `Pass123$`.
4. Navigate to `/user/account`.

## Expected result

- After step 4 the page shows "Bob Smith" and "BobSmith@email.com".
- After step 4 the page does not contain "Alice Smith" or "AliceSmith@email.com".
