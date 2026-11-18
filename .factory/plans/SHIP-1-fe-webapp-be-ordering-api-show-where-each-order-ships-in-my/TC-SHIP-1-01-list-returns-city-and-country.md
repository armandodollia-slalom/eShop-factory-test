---
id: TC-SHIP-1-01
type: happy
layer: e2e
covers: ["AC1: city and country as entered at checkout", "AC2: each order's own address", "Implementation Notes: city and country added to the order list"]
priority: P1
---

# TC-SHIP-1-01: The order list returns each order's city and country as entered at checkout

## Why

- AC1 and AC2 depend on the Ordering API's list carrying the address, which it did not before; if `OrderQueries.GetOrdersFromUserAsync` mapped the wrong field or one order's address onto another, every UI case would fail with no pointer to the cause. It runs on the e2e layer as API calls because the Ordering functional host cannot save an order; two orders with distinct values catch a swapped or shared mapping.

## Preconditions

- Scenario `default` loaded; `alice` has no orders.
- A bearer token for `alice` with the `orders` scope (implicit flow of the `orderingswaggerui` client on Identity, signing in as `alice` / `Pass123$`).
- Order A placed as `alice` with `POST /api/orders?api-version=1.0`, the plan's body and address `street: "15703 NE 61st Ct"`, `city: "Redmond"`, `state: "WA"`, `country: "U.S."`, `zipCode: "98052"`; its `orderNumber` recorded as A (the one `orderNumber` that `GET /api/orders?api-version=1.0` lists after this POST and did not list before it).
- Order B placed the same way afterwards with address `street: "1 Rue de Rivoli"`, `city: "Paris"`, `state: "IDF"`, `country: "France"`, `zipCode: "75001"`; its `orderNumber` recorded as B, the same way.
- Order numbers are not assumed to grow with creation order: rows are matched only by the recorded A and B.

## Steps

1. `GET /api/orders?api-version=1.0` with header `Authorization: Bearer <alice token>`.

## Expected result

- Status 200, body is a JSON array of exactly 2 items.
- The item whose `orderNumber` equals A has `city` = `"Redmond"` and `country` = `"U.S."`.
- The item whose `orderNumber` equals B has `city` = `"Paris"` and `country` = `"France"`.
- Values match the strings sent at checkout exactly (same case, no trimming or reformatting).
