---
id: TC-STORE-1-11
type: sad
sad-path: boundary
layer: e2e
covers: ["Inputs: city starts with the text (boundary: text longer than city)"]
priority: P3
---

# TC-STORE-1-11: The text `Seattles` (one character past the city name) matches no store

## Why

- Boundary just outside the prefix rule: a text longer than any city cannot be its prefix. Catches an implementation that checks the reverse direction (text starts with city).

## Preconditions

- Test stack with scenario `default`; anonymous shopper.

## Steps

1. Open `/stores?city=Seattles`.

## Expected result

- The page shows the exact text `No stores in "Seattles".`
- None of `AdventureWorks Seattle`, `AdventureWorks Redmond`, `AdventureWorks Portland`, `AdventureWorks Denver` appears on the page.
