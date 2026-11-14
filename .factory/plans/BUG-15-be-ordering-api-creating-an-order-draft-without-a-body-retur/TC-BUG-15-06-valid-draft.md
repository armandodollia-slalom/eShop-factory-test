---
id: TC-BUG-15-06
type: happy
layer: functional
covers: ["Decisions: a valid draft still returns 200 with the same OrderDraftDTO"]
priority: P1
---

# TC-BUG-15-06: A valid draft still returns 200 with the order draft

## Why

- Regression guard: the new validation must not reject a draft with at least one item.

## Preconditions

- Ordering.API runs in-process through `OrderingApiFixture` (`tests/Ordering.FunctionalTests`); the fixture's auto-authorize middleware supplies the caller identity `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`; the client sends `api-version=1.0`.

## Steps

1. `POST /api/orders/draft` with `Content-Type: application/json` and body `{"buyerId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[{"id":"1","productId":1,"productName":"Test item","unitPrice":10.50,"oldUnitPrice":0,"quantity":2,"pictureUrl":""}]}`.

## Expected result

- Status is 200.
- The JSON body has `orderItems` with exactly 1 element whose `productId` is 1 and `units` is 2.
- The JSON body `total` is 21.0.
