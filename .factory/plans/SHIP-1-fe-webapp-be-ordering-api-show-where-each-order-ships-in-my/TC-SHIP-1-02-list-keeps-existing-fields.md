---
id: TC-SHIP-1-02
type: happy
layer: e2e
covers: ["AC4: other columns unchanged", "Implementation Notes: keep existing callers working, add fields, do not rename or remove"]
priority: P1
---

# TC-SHIP-1-02: The order list keeps every existing field with its name and value

## Why

- The story requires the list's existing callers (the WebApp and the client app) to keep working: fields may only be added. A rename or removal of `orderNumber`, `date`, `status` or `total`, or a changed total, would break them silently. Checked at the API on the e2e layer because only the test stack can save an order.

## Preconditions

- Scenario `default` loaded; `alice` has no orders; bearer token for `alice` as in TC-SHIP-1-01.
- One order placed as `alice` with the plan's body (one Adventurer GPS Watch, unit price 10.00, quantity 1) and address `city: "Redmond"`, `country: "U.S."`, `street: "15703 NE 61st Ct"`, `state: "WA"`, `zipCode: "98052"`; the time just before the POST is recorded as T0 (UTC).

## Steps

1. `GET /api/orders?api-version=1.0` with header `Authorization: Bearer <alice token>`.

## Expected result

- Status 200, body is a JSON array of exactly 1 item.
- The item has exactly these properties: `orderNumber`, `date`, `status`, `total`, `city`, `country` (no other property removed or renamed; the only new ones are `city` and `country`).
- `orderNumber` is a positive integer.
- `date` is an ISO 8601 date-time not earlier than T0 minus 1 minute and not later than the time of the GET.
- `status` is a non-empty string (for example `"Submitted"`).
- `total` = `10` (number).
