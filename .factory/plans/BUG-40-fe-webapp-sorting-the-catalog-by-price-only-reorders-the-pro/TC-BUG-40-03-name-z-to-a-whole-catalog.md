---
id: TC-BUG-40-03
type: happy
layer: e2e
covers: ["Expected: Name: Z to A works the same way in its own order"]
priority: P1
---

# TC-BUG-40-03: Name: Z to A orders the whole catalog, ending with Adventurer GPS Watch on the last page

## Why

- "Name: Z to A" had the same per-page defect. The first page and the last page together prove the order spans the whole catalog: before the fix, page 1 only showed the A-names reversed and the last page could not end with "Adventurer GPS Watch".

## Preconditions

- Scenario `default` loaded. New browser context.

## Steps

1. Open `BASE_URL` (`/`).
2. Click `#catalog-sort-trigger`, then the option named `Name: Z to A`.
3. Read the 9 card names on page 1.
4. Click the page link with text `12` in `.catalog-pagination`; read the card names.

## Expected result

- After step 2 the URL query is exactly `sort=name-desc`.
- Page 1 shows exactly 9 cards. Cards 1 to 7 are, in order: Zero Gravity Ski Goggles, Zenith Cycling Jersey, Wanderer Black Hiking Boots, Vigor 2.0 Insulated Jacket, Vertical Journey Climbing Shoes, VenturePro GPS Watch, Venture Grey Trail Shoes.
- Cards 8 and 9 on page 1 are, as a set, {Venture 2022 Snowboard, Venture 2.0 40L Waterproof Duffel Bag}; their relative order depends on the database collation and is not asserted (see Open questions in `_index.md`).
- Page 12 (URL query contains `sort=name-desc` and `page=12`) shows exactly 2 cards: AeroLite Cycling Helmet, then Adventurer GPS Watch.
- `.catalog-sort-value` reads `Name: Z to A` on pages 1 and 12.
