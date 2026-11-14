---
id: TC-BUG-15-05
type: happy
layer: functional
covers: ["Decisions: 200 body unchanged", "Boundary: one item accepted"]
priority: P1
---

# TC-BUG-15-05: Draft with exactly one item still returns 200 with the computed draft

## Why

- Guards against regression from the changed signature and return type, and is the just-inside boundary for the item-count rule.

## Preconditions

- The Ordering functional-test fixture is running (OrderingApiFixture, auto-authorized caller, api-version 1.0).

## Steps

1. `POST api/orders/draft` with `Content-Type: application/json`, body `{"buyerId":"b1","items":[{"id":"i1","productId":1,"productName":"Test Product 1","unitPrice":10.2,"oldUnitPrice":9.8,"quantity":2,"pictureUrl":"p1"}]}`.

## Expected result

- Status code is 200.
- Body `orderItems` has exactly 1 entry with `productId` 1.
- Body `total` is 20.4.
