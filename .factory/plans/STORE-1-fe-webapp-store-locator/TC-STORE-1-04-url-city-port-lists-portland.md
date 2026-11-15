---
id: TC-STORE-1-04
type: happy
layer: e2e
covers: ["AC3", "Inputs: City kept in URL as ?city=<text>", "Inputs: ignoring letter case", "Outputs: opening that URL shows the same filtered list"]
priority: P1
---

# TC-STORE-1-04: Opening `/stores?city=PORT` directly lists only AdventureWorks Portland

## Why

- AC3 covers the deep link (the filter read from the query string on first load, not from a form post) and case-insensitivity with an all-upper-case value. e2e because it is a direct browser navigation to the URL.

## Preconditions

- Test stack with scenario `default`; anonymous shopper.

## Steps

1. Open `/stores?city=PORT`.

## Expected result

- The page has an `h1` with the text `Store locator`.
- Exactly one store is listed: `AdventureWorks Portland`, with `800 SW Broadway`, `Portland` and `Mon–Sun 10:00–18:00`.
- `AdventureWorks Seattle`, `AdventureWorks Redmond` and `AdventureWorks Denver` do not appear on the page.
