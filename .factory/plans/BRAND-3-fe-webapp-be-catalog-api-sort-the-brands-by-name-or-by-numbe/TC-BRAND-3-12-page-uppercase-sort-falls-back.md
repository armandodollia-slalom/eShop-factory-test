---
id: TC-BRAND-3-12
type: sad
sad-path: boundary
layer: e2e
covers: ["AC3: any other sort value (case variant of count) shows the alphabetical order with Name selected"]
priority: P2
---

# TC-BRAND-3-12: Opening /brands?sort=COUNT shows the alphabetical order with "Name" selected

## Why

- `COUNT` is the value closest to the accepted `count`; under the literal reading of AC3 it is "any other value" and falls back to the name order. It also guards against the page and API disagreeing on case (the page selecting "Most products" while the API answers 400, TC-BRAND-3-06). e2e because it is the page's handling of its own address. See Open questions in `_index.md`.

## Preconditions

- Test stack running with scenario `default`. Anonymous visitor.

## Steps

1. Open `/brands?sort=COUNT`.

## Expected result

- The page shows no error message.
- "Name" is marked as selected (`aria-current` set); "Most products" is not.
- The card headings in page order are: "AirStrider", "B&R", "Daybird", "Gravitator", "Green Equipment", "Grolltex", "Legend", "Quester", "Raptor Elite", "Solstix", "WildRunner", "XE", "Zephyr".
