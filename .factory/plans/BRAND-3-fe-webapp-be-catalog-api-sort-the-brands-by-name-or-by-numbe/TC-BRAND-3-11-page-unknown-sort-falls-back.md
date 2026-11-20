---
id: TC-BRAND-3-11
type: sad
sad-path: validation
layer: e2e
covers: ["AC3: any other sort value shows the alphabetical order with Name selected"]
priority: P1
---

# TC-BRAND-3-11: Opening /brands with an unknown sort value shows the alphabetical order with "Name" selected

## Why

- AC3 says an unknown `sort` on the page is not an error: it falls back to the name order with "Name" selected. Since the API answers 400 for unknown values (AC4), a page that forwards the value unchanged would show an error instead of brands. e2e because it is the page's handling of its own address.

## Preconditions

- Test stack running with scenario `default`. Anonymous visitor.

## Steps

1. Open `/brands?sort=price`.

## Expected result

- The page shows no error message and the heading "Brands".
- "Name" is marked as selected (`aria-current` set); "Most products" is not.
- There are 13 brand cards, and their headings in page order are: "AirStrider", "B&R", "Daybird", "Gravitator", "Green Equipment", "Grolltex", "Legend", "Quester", "Raptor Elite", "Solstix", "WildRunner", "XE", "Zephyr".
