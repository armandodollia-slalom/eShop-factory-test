---
id: TC-STORE-1-09
type: sad
sad-path: boundary
layer: e2e
covers: ["Inputs: city starts with the text"]
priority: P2
---

# TC-STORE-1-09: A text that occurs inside a city but not at its start (`land`) matches no store

## Why

- The rule is "starts with", not "contains": `land` is inside `Portland` but is not its prefix. A `Contains` implementation would wrongly list Portland. Opened via URL to keep the step to one action; the URL path is the same filter (AC3).

## Preconditions

- Test stack with scenario `default`; anonymous shopper.

## Steps

1. Open `/stores?city=land`.

## Expected result

- The page shows the exact text `No stores in "land".`
- `AdventureWorks Portland` does not appear on the page.
- None of the other three store names appears on the page.
