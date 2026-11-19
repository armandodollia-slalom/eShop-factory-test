---
id: TC-SHIP-1-03
type: happy
layer: e2e
covers: ["AC1: Ships to heading with city and country", "Decisions: City, Country between Date and Total"]
priority: P1
---

# TC-SHIP-1-03: My orders shows a "Ships to" column with the order's city and country

## Why

- AC1 is the shopper-visible promise of the story: the row shows the destination under a "Ships to" heading. Only a browser run through the WebApp proves the API field reaches the page and is placed in the right column (between Date and Total, per Decisions). E2E is the only layer that renders the Blazor page against a real order.

## Preconditions

- Scenario `default` loaded; `alice` has no orders.
- One order placed as `alice` via the API with the plan's body and address `street: "15703 NE 61st Ct"`, `city: "Redmond"`, `state: "WA"`, `country: "U.S."`, `zipCode: "98052"`.
- Browser viewport 1280 x 800.

## Steps

1. Open the WebApp, sign in as `alice` / `Pass123$`.
2. Navigate to `/user/orders`.

## Expected result

- The orders list header row shows, in this order: `Number`, `Date`, `Ships to`, `Total`, `Status`.
- The list has exactly one order row, and its cell under "Ships to" (`.order-ships-to`) reads `Redmond, U.S.`.
- The "Ships to" cell sits between the date cell and the total cell of that row.
