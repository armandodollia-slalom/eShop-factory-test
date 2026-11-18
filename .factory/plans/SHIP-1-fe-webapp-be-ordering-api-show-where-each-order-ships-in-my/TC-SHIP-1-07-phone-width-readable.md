---
id: TC-SHIP-1-07
type: happy
layer: e2e
covers: ["AC5: Ships to readable at phone width, no sideways scroll", "Decisions: value wraps (overflow-wrap anywhere, min-width 0)", "Implementation Notes code map AC5: 480px rule gives Ships to its own full-width line"]
priority: P1
---

# TC-SHIP-1-07: At phone width "Ships to" takes its row's full width, short values stay on one line, and the page does not scroll sideways

## Why

- AC5 is a layout requirement that only a rendered page at a phone viewport can prove. "No sideways scroll" alone is not enough: a cell squeezed to one character wide also never scrolls but is unreadable, so the case asserts the cell's width and line count, not only that the text fits.
- Two orders cover both ends: an ordinary value (`Redmond, U.S.`) must render on a single line in a full-width cell, and a real, unbreakable 58-letter city must wrap inside the cell without forcing a scroll, while the ordinary words next to it (`United Kingdom`) still break only between words.

## Preconditions

- Scenario `default` loaded; `alice` has no orders.
- Two orders placed as `alice` via the API with the plan's body:
  - Order A: `street: "15703 NE 61st Ct"`, `city: "Redmond"`, `state: "WA"`, `country: "U.S."`, `zipCode: "98052"`.
  - Order B: `street: "1 Station Road"`, `city: "Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch"`, `state: "Anglesey"`, `country: "United Kingdom"`, `zipCode: "LL61 5UJ"`.
- Browser viewport 375 x 667 (phone width).

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Navigate to `/user/orders` and wait for two order rows (`li.orders-item` other than `.orders-header`).

## Expected result

Page:

- `document.documentElement.scrollWidth` is less than or equal to `document.documentElement.clientWidth` (no horizontal scroll).

Order A's row (the row whose `.order-ships-to` trimmed text is `Redmond, U.S.`):

- The `.order-ships-to` cell's bounding-box width equals its `li.orders-item` row's content width (row width minus its horizontal padding) within 1px.
- The cell renders on one line: its bounding-box height is not greater than 1.5 times its computed `line-height` in pixels.

Order B's row (the row whose `.order-ships-to` trimmed text is `Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch, United Kingdom`):

- The cell is visible and its trimmed text is exactly `Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch, United Kingdom` (not truncated, no ellipsis).
- The cell's bounding-box width equals its row's content width within 1px.
- The cell's bounding box lies entirely within the viewport horizontally (left >= 0, right <= 375).
- The cell's `scrollWidth` is not greater than its `clientWidth` (no text clipped inside the cell).
- `United` and `Kingdom` are each unbroken: a DOM `Range` over the substring `United` inside the cell's text node returns client rects that all share one `top` value, and so does a `Range` over `Kingdom`.
