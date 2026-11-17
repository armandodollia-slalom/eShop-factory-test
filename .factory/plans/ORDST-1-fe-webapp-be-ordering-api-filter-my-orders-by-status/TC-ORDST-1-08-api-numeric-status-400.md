---
id: TC-ORDST-1-08
type: sad
sad-path: validation
layer: functional
covers: ["AC5: A status that is not one of the six names answers 400 with a problem detail (numeric value)"]
priority: P2
---

# TC-ORDST-1-08: GET /api/orders?status=4 (numeric value of Paid) answers 400 with a problem detail

## Why

- `OrderStatus` is an enum with numeric values (Paid = 4); a plain `Enum.TryParse` accepts `"4"` and would filter by Paid even though `4` is not one of the six names AC5 accepts. Functional because the rejection precedes any read.

## Preconditions

- Ordering functional test host running; requests authenticated as a test user.

## Steps

1. `GET /api/orders?api-version=1.0&status=4` as the authenticated test user.

## Expected result

- Status `400 Bad Request`.
- `Content-Type` is `application/problem+json`, body `status` field is `400`.
