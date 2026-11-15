---
id: TC-STORE-1-12
type: happy
layer: e2e
covers: ["Inputs: Empty shows every store", "Inputs: Kept in the page URL as ?city=<text>"]
priority: P3
---

# TC-STORE-1-12: Opening `/stores?city=` lists all four stores

## Why

- An empty field is submitted as `?city=` (Inputs: empty shows every store). Opening that URL directly must not show `No stores in "".`. Separate from TC-STORE-1-06, which goes through the form.

## Preconditions

- Test stack with scenario `default`; anonymous shopper.

## Steps

1. Open `/stores?city=`.

## Expected result

- Exactly four stores are listed, in this order: `AdventureWorks Seattle`, `AdventureWorks Redmond`, `AdventureWorks Portland`, `AdventureWorks Denver`.
- The text `No stores in` does not appear on the page.
