---
id: TC-BRAND-3-09
type: happy
layer: e2e
covers: ["AC2: a reload keeps the order"]
priority: P2
---

# TC-BRAND-3-09: Reloading after choosing "Most products" keeps the count order

## Why

- AC2 says the choice survives a reload. If the order lived only in component state (not in the address), a reload would fall back to the name order. Separate from TC-BRAND-3-10 because here the page state comes from an in-page navigation followed by a browser reload. e2e because only the browser can reload.

## Preconditions

- Test stack running with scenario `default`. Anonymous visitor.

## Steps

1. Open `/brands`.
2. Click "Most products".
3. Reload the page.

## Expected result

- The address is still `/brands?sort=count`.
- "Most products" is marked as selected (`aria-current` set); "Name" is not.
- The card headings in page order are: "Gravitator", "Raptor Elite", "WildRunner", "B&R", "Daybird", "Solstix", "Legend", "Green Equipment", "AirStrider", "Zephyr", "Grolltex", "Quester", "XE".
