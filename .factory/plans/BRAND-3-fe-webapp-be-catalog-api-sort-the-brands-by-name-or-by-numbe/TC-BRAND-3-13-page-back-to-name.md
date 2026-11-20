---
id: TC-BRAND-3-13
type: happy
layer: e2e
covers: ["AC1: Name option gives the alphabetical order", "AC2: the address carries sort=count only for Most products"]
priority: P2
---

# TC-BRAND-3-13: Choosing "Name" after "Most products" restores the alphabetical order

## Why

- The control has two options (AC1); switching back must work, not only the first switch. If the "Name" link kept `sort=count` in the address, the page would stay in count order. e2e because it is a UI interaction.

## Preconditions

- Test stack running with scenario `default`. Anonymous visitor.

## Steps

1. Open `/brands?sort=count`.
2. Click the "Name" option of the Sort control.

## Expected result

- The page address no longer contains `sort=count`.
- "Name" is marked as selected (`aria-current` set); "Most products" is not.
- The card headings in page order are: "AirStrider", "B&R", "Daybird", "Gravitator", "Green Equipment", "Grolltex", "Legend", "Quester", "Raptor Elite", "Solstix", "WildRunner", "XE", "Zephyr".
