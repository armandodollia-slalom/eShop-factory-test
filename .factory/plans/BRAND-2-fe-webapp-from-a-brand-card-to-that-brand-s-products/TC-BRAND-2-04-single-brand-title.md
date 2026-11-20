---
id: TC-BRAND-2-04
type: happy
layer: e2e
covers: ["AC2: header title \"Brand: <name>\" instead of the usual title"]
priority: P1
---

# TC-BRAND-2-04: Catalog filtered to one brand shows "Brand: Daybird" instead of the usual title

## Why

- AC2 makes the header tell the shopper which brand they are looking at, with the ticket's own example "Brand: Daybird". The risk is a title that keeps the usual text, shows the id instead of the name, or shows both. e2e because the title is a section rendered into the layout's header by the streamed catalog page.

## Preconditions

- Test stack running with scenario `default`. Brand 1 is "Daybird". Anonymous visitor.

## Steps

1. Open `/brands` and click the card whose heading is "Daybird".
2. Wait until the catalog toolbar shows "10 products", then read the page header title.

## Expected result

- The page header title text is exactly "Brand: Daybird".
- The page does not contain the text "Ready for a new adventure?".
- The page header subtitle does not contain "Start the season with the latest in clothing and equipment.".
