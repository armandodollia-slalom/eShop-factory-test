---
id: TC-SHIP-1-06
type: happy
layer: e2e
covers: ["AC4: order number, date, total and status show exactly what they show today"]
priority: P1
---

# TC-SHIP-1-06: Number, date, total and status columns show the same values as before

## Why

- AC4 guards against the new column shifting or corrupting the existing ones (for example the total moving under the wrong header or the status badge losing its class). TC-SHIP-1-02 proves the API still returns the values; this case proves the page still renders them in their own cells. It needs a real placed order, so it runs in the browser on the test stack.

## Preconditions

- Scenario `default` loaded; `alice` has no orders.
- One order placed as `alice` via the API with the plan's body (total 10.00) and address `city: "Redmond"`, `country: "U.S."`, `street: "15703 NE 61st Ct"`, `state: "WA"`, `zipCode: "98052"`.
- `GET /api/orders?api-version=1.0` as `alice` has been called and its single item's `orderNumber`, `date` and `status` recorded.
- Browser viewport 1280 x 800.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Navigate to `/user/orders`.

## Expected result

- The row's `.order-number` cell reads the recorded `orderNumber`.
- The row's `.order-date` cell's trimmed text is exactly the string My orders renders for that date today: the recorded `date` deserialized into a .NET `DateTime` the way `OrderingService` does (System.Text.Json, no time-zone conversion) and formatted with `DateTime.ToString()` in the WebApp's culture, to the second (`Orders.razor` renders `@order.Date`).
- The row's `.order-total` cell reads `$10.00`.
- The row's `.order-status` cell contains a `span` with class `status` plus the lowercased status, whose text is the recorded `status` (or a later status the order has reached, if it changed between the GET and the page load).
- None of these cells contains `Redmond` or `U.S.`.
