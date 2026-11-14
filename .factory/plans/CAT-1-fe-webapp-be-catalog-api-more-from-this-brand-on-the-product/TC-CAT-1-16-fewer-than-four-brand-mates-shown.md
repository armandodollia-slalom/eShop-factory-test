---
id: TC-CAT-1-16
type: happy
layer: e2e
covers: ["AC6", "Outputs: up to four product cards"]
priority: P1
---

# TC-CAT-1-16: A brand with two other items shows the heading and exactly two cards

## Why

- AC6 says up to four cards. Risk: the section requiring four items or padding. Brand 16 "Trail Co" has three items, so item 1009 has two brand-mates. E2E because the section is rendered by the WebApp.

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

No item with id 999999 exists.
- E2E on the test stack: `loadScenario('brand-mates')` in `beforeAll`, WebApp at the stack base URL.
- Ordinal name order of the two other items of item 1009: India Rope (1011), Juliet Cup (1010).

## Steps

1. As an anonymous visitor open `/item/1009`.

## Expected result

- The product details heading "Kilo Stick" is visible.
- A heading "More from Trail Co" is visible.
- Exactly 2 product cards are in that section: India Rope ("$22.00") then Juliet Cup ("$9.50"), each with a picture.
- No card for "Kilo Stick" is in the section.
