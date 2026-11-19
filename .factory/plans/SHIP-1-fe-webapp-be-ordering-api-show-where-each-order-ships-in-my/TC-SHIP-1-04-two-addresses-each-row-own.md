---
id: TC-SHIP-1-04
type: happy
layer: e2e
covers: ["AC2: each row shows its own order's city and country"]
priority: P1
---

# TC-SHIP-1-04: Two orders with different addresses each show their own city and country

## Why

- AC2 is the reason the story exists: telling orders sent to different addresses apart. A rendering bug that repeats the first row's destination or mixes rows up would pass TC-SHIP-1-03 with a single order, so this case needs two orders with different cities and different countries, checked row by row in the browser.

## Preconditions

- Scenario `default` loaded; `alice` has no orders.
- Order A placed as `alice` via the API with address `street: "15703 NE 61st Ct"`, `city: "Redmond"`, `state: "WA"`, `country: "U.S."`, `zipCode: "98052"`; its `orderNumber` recorded as A (the one `orderNumber` that `GET /api/orders?api-version=1.0` lists after this POST and did not list before it).
- Order B placed as `alice` afterwards with address `street: "1 Rue de Rivoli"`, `city: "Paris"`, `state: "IDF"`, `country: "France"`, `zipCode: "75001"`; its `orderNumber` recorded as B, the same way.
- Order numbers are not assumed to grow with creation order: rows are matched only by the recorded A and B.
- Browser viewport 1280 x 800.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Navigate to `/user/orders`.

## Expected result

- The list shows exactly two order rows.
- The row whose number cell reads A has `Redmond, U.S.` in its "Ships to" cell.
- The row whose number cell reads B has `Paris, France` in its "Ships to" cell.
- Neither row's "Ships to" cell contains the other order's city or country.
