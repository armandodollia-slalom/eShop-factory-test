---
id: TC-EPIC-359-01
type: happy
layer: e2e
covers: ["AC1: header Brands link opens the Brands page", "AC1: cards alphabetical with counts and 'from $x.xx'", "AC1: card opens catalog with only that brand's items and header 'Brand: <name>'", "AC1: 'All brands' lands on /brands with heading 'Brands' and the Brands nav link current", "AC1: filtered catalog shows the card's item count"]
priority: P1
---

# TC-EPIC-359-01: Header Brands link → Daybird card → filtered catalog → "All brands" back to /brands

## Why

- AC1 is the epic's main round trip: BRAND-1's header link and page, BRAND-2's card link, brand header and "All brands" link, in one session. Each story tests its part from a direct URL; only this case proves the hand-offs (the page reached from the header has working card links, the card count matches what the catalog shows, the catalog shows only that brand's products, the way back restores the Brands page and nav state). e2e because it is browser navigation across WebApp pages.

## Preconditions

- Test stack running with scenario `default`. Anonymous visitor.
- Seeded Daybird (brand 1) products, 10 in all: "Wanderer Black Hiking Boots", "Trailblaze hiking backpack", "Stealth Lite Bike Helmet", "Midnight Blue Goggles", "Arctic Shield Insulated Jacket", "Raven Swift Snowboard", "Shadow Black Snowboard", "Explorer Frost Boots", "LumenHead Headlamp", "Blizzard Snowboard". The catalog shows 9 items per page, so they span two pages.

## Steps

1. Open the home page `/`.
2. In the header navigation, click the link "Brands".
3. On the Brands page, read the Daybird card's text, then click the card whose heading is "Daybird".
4. On the catalog page, read the product names of the item cards, then click the pagination link "Next page" and read the product names of the item cards again.
5. Click the link "All brands" in the page header.

## Expected result

- After step 2: the path is `/brands`; the heading is "Brands"; there are 13 brand cards whose headings in page order are "AirStrider", "B&R", "Daybird", "Gravitator", "Green Equipment", "Grolltex", "Legend", "Quester", "Raptor Elite", "Solstix", "WildRunner", "XE", "Zephyr"; every card shows a product count and a "from $" price with two decimals.
- In step 3, the Daybird card's text is "10 products · from $49.99".
- After step 3: the path is `/` with query `brand=1` (one `brand` value); the page header title reads "Brand: Daybird"; the catalog toolbar reads "10 products" (the count shown on the card); in the Filters panel's Brand group only the "Daybird" tag has class `active`.
- In step 4: page 1 shows 9 item cards and page 2 shows 1; the 10 product names read across both pages are exactly the 10 seeded Daybird products listed in Preconditions, each once, and no other product name appears on either page; the header title still reads "Brand: Daybird" on page 2.
- After step 5: the path is `/brands` with no query; the heading "Brands" is shown with 13 brand cards; in the header navigation the "Brands" link has class `is-current` and the "Shop all" link does not.
