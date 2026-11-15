---
id: TC-STORE-1-03
type: happy
layer: e2e
covers: ["AC2", "Inputs: City prefix filter, case-insensitive", "Outputs: Find stores puts ?city=<text> in URL"]
priority: P1
---

# TC-STORE-1-03: Typing `red` in City and pressing Find stores lists only AdventureWorks Redmond and puts `city=red` in the URL

## Why

- AC2 checks the form round trip: the `City` text box, the `Find stores` button, the GET form writing `?city=red` and the prefix match against `Redmond` (lower-case input vs capitalised city). e2e because the behaviour is the form submission and enhanced navigation in the browser.

## Preconditions

- Test stack with scenario `default`; anonymous shopper.

## Steps

1. Open `/stores`.
2. Fill the text box labeled `City` with `red`.
3. Click the button labeled `Find stores`.

## Expected result

- The page URL contains `city=red`.
- Exactly one store is listed: `AdventureWorks Redmond`, with `15700 NE 61st Ct`, `Redmond` and `Mon–Fri 10:00–19:00`.
- `AdventureWorks Seattle`, `AdventureWorks Portland` and `AdventureWorks Denver` do not appear on the page.
- The text `No stores in` does not appear on the page.
