---
id: TC-CAT-1-11
type: happy
layer: e2e
covers: ["AC6", "Outputs: heading More from {brand}", "Outputs: up to four product cards with picture, name, price"]
priority: P1
---

# TC-CAT-1-11: A visitor sees "More from Peak Gear" with four product cards

## Why

- Requirement: AC6 first half (heading and up to four cards). Item 1001 has six brand-mates, so the cap of four is visible. E2E because the section is rendered by the WebApp from the real API.

## Preconditions

- Scenario `brand-mates` (`extends: default`) adds brands 14 "Peak Gear", 15 "Solo Gear", 16 "Trail Co" and 17 "Twin Gear" and these `Catalog` rows (CatalogTypeId 1, PictureFileName `<id>.webp`):

| Id | Name | Price | AvailableStock | CatalogBrandId |
| --- | --- | --- | --- | --- |
| 1001 | Charlie Rope | 20.00 | 10 | 14 |
| 1002 | Beta Stove | 30.00 | 10 | 14 |
| 1003 | Delta Lamp | 15.50 | 10 | 14 |
| 1004 | Echo Boots | 45.00 | 0 | 14 |
| 1005 | Foxtrot Mat | 25.00 | 10 | 14 |
| 1006 | Zulu Pack | 60.00 | 10 | 14 |
| 1007 | alpha Tent | 120.00 | 10 | 14 |
| 1008 | Lone Compass | 12.00 | 10 | 15 |
| 1009 | Kilo Stick | 18.00 | 10 | 16 |
| 1010 | Juliet Cup | 9.50 | 10 | 16 |
| 1011 | India Rope | 22.00 | 10 | 16 |
| 1012 | Anchor | 5.00 | 10 | 17 |
| 1013 | Twin Mug | 7.00 | 10 | 17 |
| 1014 | Twin Mug | 8.00 | 10 | 17 |

Ordinal (code point) name order of the six other items of item 1001: Beta Stove (1002), Delta Lamp (1003), Echo Boots (1004), Foxtrot Mat (1005), Zulu Pack (1006), alpha Tent (1007) (lowercase "alpha" sorts after "Zulu" ordinally). No item with id 999999 exists.
- E2E on the test stack: `loadScenario('brand-mates')` in `beforeAll`, WebApp at the stack base URL.

## Steps

1. As an anonymous visitor open `/item/1001`.

## Expected result

- The product details heading "Charlie Rope" is visible.
- Below the details a heading "More from Peak Gear" is visible.
- Exactly 4 product cards are in that section, with names Beta Stove, Delta Lamp, Echo Boots, Foxtrot Mat in this order, each with a picture and its price rendered exactly as "$30.00", "$15.50", "$45.00", "$25.00" (the catalog card format `$` + value with 2 decimals).
- No card for "Charlie Rope", "Zulu Pack" or "alpha Tent" is in the section.
