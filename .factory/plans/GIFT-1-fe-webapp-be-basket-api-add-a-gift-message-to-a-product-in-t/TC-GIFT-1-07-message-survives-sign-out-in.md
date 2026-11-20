---
id: TC-GIFT-1-07
type: happy
layer: e2e
covers: ["AC4: message still there after sign out and sign in", "Implementation Notes: message lives with the basket on the server, not in the browser"]
priority: P1
---

# TC-GIFT-1-07: The gift message survives signing out and signing in again

## Why

- AC4 and the notes require the message to live with the server-side basket; signing in from a fresh browser context proves nothing is kept in browser storage or the session. Needs Identity and the WebApp, so e2e.

## Preconditions

- Scenario `default`; `alice` has an empty basket.

## Steps

1. Sign in as `alice`, add item 99 ("Adventurer GPS Watch") to the bag, open `/cart`, choose "Add a gift message", type `Happy birthday, Sam!` and save.
2. Sign out.
3. Open a new browser context (no cookies or storage from step 1), sign in as `alice` with `Pass123$`.
4. Open `/cart`.

## Expected result

- The bag has the line "Adventurer GPS Watch" with quantity 1, showing `"Happy birthday, Sam!"` under the product name and an "Edit" action.
