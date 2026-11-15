---
id: TC-STORE-1-05
type: sad
sad-path: not-found
layer: e2e
covers: ["AC4", "Outputs: No stores in \"<text>\". and no store"]
priority: P1
---

# TC-STORE-1-05: Searching for `Boston` shows `No stores in "Boston".` and no store

## Why

- AC4 defines the empty result: an exact message string and no store rows. A wrong quote style, missing period or a list still rendered would break it. e2e through the form, as the AC describes a search.

## Preconditions

- Test stack with scenario `default`; anonymous shopper.

## Steps

1. Open `/stores`.
2. Fill the text box labeled `City` with `Boston`.
3. Click the button labeled `Find stores`.

## Expected result

- The page URL contains `city=Boston`.
- The page shows the exact text `No stores in "Boston".`
- None of `AdventureWorks Seattle`, `AdventureWorks Redmond`, `AdventureWorks Portland`, `AdventureWorks Denver` appears on the page.
