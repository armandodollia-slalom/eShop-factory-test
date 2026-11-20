---
id: TC-BRAND-3-08
type: happy
layer: e2e
covers: ["AC2: choosing Most products orders by number of products, largest first", "AC2: equal counts in alphabetical order", "AC2: address gets ?sort=count"]
priority: P1
---

# TC-BRAND-3-08: Choosing "Most products" reorders the cards by count and adds ?sort=count to the address

## Why

- AC2 is the story's main user flow: the shopper picks "Most products", the cards reorder (largest count first, ties alphabetical) and the address records the choice. The demo ties (Gravitator / Raptor Elite / WildRunner at 11, B&R / Daybird at 10, AirStrider / Zephyr at 6) prove the page shows the API's tie order. e2e because it is a UI interaction through the WebApp and the API.

## Preconditions

- Test stack running with scenario `default`. Anonymous visitor.

## Steps

1. Open `/brands`.
2. Click the "Most products" option of the Sort control.

## Expected result

- The page address is `/brands?sort=count`.
- "Most products" is marked as the selected option (`aria-current` set); "Name" has no `aria-current`.
- There are 13 brand cards, and their headings in page order are: "Gravitator", "Raptor Elite", "WildRunner", "B&R", "Daybird", "Solstix", "Legend", "Green Equipment", "AirStrider", "Zephyr", "Grolltex", "Quester", "XE".
- The first card's text is "11 products · from $59.99" (Gravitator) and the last card's is "3 products · from $199.00" (XE).
