---
id: TC-BRAND-3-07
type: happy
layer: e2e
covers: ["AC1: Sort control with Name and Most products", "AC1: Name selected by default", "AC1: cards in alphabetical order"]
priority: P1
---

# TC-BRAND-3-07: Brands page shows a Sort control with Name selected and cards in alphabetical order

## Why

- AC1 defines the page's initial state: a "Sort" control with exactly two options, "Name" selected, and the alphabetical order. A control that defaults to "Most products", or shows no selection, would fail. e2e because the control is rendered by the WebApp on the test stack.

## Preconditions

- Test stack running with scenario `default`. Anonymous visitor.

## Steps

1. Open `/brands` (no query string).

## Expected result

- A control labelled "Sort" is visible above the brand cards.
- It offers exactly two options, in this order: "Name", "Most products".
- "Name" is marked as the selected option (`aria-current` set on it); "Most products" has no `aria-current`.
- There are 13 brand cards, and their headings in page order are: "AirStrider", "B&R", "Daybird", "Gravitator", "Green Equipment", "Grolltex", "Legend", "Quester", "Raptor Elite", "Solstix", "WildRunner", "XE", "Zephyr".
