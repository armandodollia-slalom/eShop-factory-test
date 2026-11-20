---
id: TC-BRAND-1-06
type: happy
layer: e2e
covers: ["AC2: heading is Brands", "AC2: one card per brand", "AC2: alphabetical order of the brand name"]
priority: P1
---

# TC-BRAND-1-06: Brands page has heading "Brands" and one card per brand in alphabetical order

## Why

- AC2 defines the page: its heading, one card for every catalog brand (including one without products) and name order. The scenario's added brands have ids 14 and 15 but sort first and in the middle, so a page that shows brands in id order, or drops the empty brand, fails. e2e because the page is rendered by the WebApp from the API.

## Preconditions

- Test stack running with scenario `brand-1` (demo catalog plus brand 14 "Acme Empty" without products and brand 15 "Mono Gear" with one product). Anonymous visitor.

## Steps

1. Open `/brands`.

## Expected result

- The page heading is "Brands".
- There are exactly 15 brand cards, each with the brand name as its heading.
- The card headings in page order are: "Acme Empty", "AirStrider", "B&R", "Daybird", "Gravitator", "Green Equipment", "Grolltex", "Legend", "Mono Gear", "Quester", "Raptor Elite", "Solstix", "WildRunner", "XE", "Zephyr".
- No brand name appears on two cards.
