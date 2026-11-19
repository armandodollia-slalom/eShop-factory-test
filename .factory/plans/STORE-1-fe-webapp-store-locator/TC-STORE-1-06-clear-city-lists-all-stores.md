---
id: TC-STORE-1-06
type: happy
layer: e2e
covers: ["AC5", "Inputs: Empty shows every store"]
priority: P1
---

# TC-STORE-1-06: Clearing City on `/stores?city=red` and pressing Find stores lists all four stores again

## Why

- AC5 protects the reset path: an empty `City` (submitted as `?city=`) must not be treated as a filter that matches nothing. e2e because it starts from a filtered URL and submits the form in the browser.

## Preconditions

- Test stack with scenario `default`; anonymous shopper.

## Steps

1. Open `/stores?city=red`.
2. Fill the text box labeled `City` with an empty string (clear the box).
3. Click the button labeled `Find stores`.

## Expected result

- The page URL does not contain `city=red`.
- Exactly four stores are listed, in this order: `AdventureWorks Seattle`, `AdventureWorks Redmond`, `AdventureWorks Portland`, `AdventureWorks Denver`.
- The text `No stores in` does not appear on the page.
