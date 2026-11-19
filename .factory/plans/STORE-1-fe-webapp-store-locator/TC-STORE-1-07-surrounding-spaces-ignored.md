---
id: TC-STORE-1-07
type: happy
layer: e2e
covers: ["Inputs: ignoring surrounding spaces"]
priority: P2
---

# TC-STORE-1-07: City text with surrounding spaces (`den` with two spaces before and after) lists only AdventureWorks Denver

## Why

- The Inputs rule says the filter ignores surrounding spaces; without trimming, `den` with surrounding spaces would match nothing. No AC exercises it, so it needs its own case. e2e because the filter lives in the page component and there is no WebApp unit test project.

## Preconditions

- Test stack with scenario `default`; anonymous shopper.

## Steps

1. Open `/stores`.
2. Fill the text box labeled `City` with two spaces, then `den`, then two spaces (7 characters: space, space, d, e, n, space, space).
3. Click the button labeled `Find stores`.

## Expected result

- Exactly one store is listed: `AdventureWorks Denver`, with `1600 16th St`, `Denver` and `Tue–Sun 9:00–17:00`.
- The text `No stores in` does not appear on the page.
