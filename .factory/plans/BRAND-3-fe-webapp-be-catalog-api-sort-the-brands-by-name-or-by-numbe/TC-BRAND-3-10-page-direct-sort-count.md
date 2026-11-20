---
id: TC-BRAND-3-10
type: happy
layer: e2e
covers: ["AC3: opening /brands?sort=count directly selects Most products and shows that order", "AC2: a shared link keeps the order"]
priority: P1
---

# TC-BRAND-3-10: Opening /brands?sort=count directly shows "Most products" selected and the count order

## Why

- AC3 (and the "shared link" part of AC2) requires the page to read `sort` from the address on first load in a fresh browser context, with no prior interaction. A page that only reorders on click would show the name order here. e2e because it covers the WebApp's query binding and its call to the API.

## Preconditions

- Test stack running with scenario `default`. Anonymous visitor in a new browser context.

## Steps

1. Open `/brands?sort=count` directly.

## Expected result

- "Most products" is marked as selected (`aria-current` set); "Name" is not.
- There are 13 brand cards, and their headings in page order are: "Gravitator", "Raptor Elite", "WildRunner", "B&R", "Daybird", "Solstix", "Legend", "Green Equipment", "AirStrider", "Zephyr", "Grolltex", "Quester", "XE".
