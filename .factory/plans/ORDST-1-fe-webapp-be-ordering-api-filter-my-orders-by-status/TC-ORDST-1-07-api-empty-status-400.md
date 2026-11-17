---
id: TC-ORDST-1-07
type: sad
sad-path: boundary
layer: functional
covers: ["AC5: A status that is not one of the six names answers 400 with a problem detail (empty value)", "AC5: Without status it returns all (absent, not empty)"]
priority: P2
---

# TC-ORDST-1-07: GET /api/orders?status= (empty value) answers 400 with a problem detail

## Why

- The boundary between "no `status`" (all orders, AC5) and "a `status` that is not one of the six names" (400) is the empty value; read literally, an empty string is not one of the six names. Model binding easily turns `?status=` into null and returns everything, so this needs its own case. Functional because no order is read.

## Preconditions

- Ordering functional test host running; requests authenticated as a test user.

## Steps

1. `GET /api/orders?api-version=1.0&status=` as the authenticated test user.

## Expected result

- Status `400 Bad Request`.
- `Content-Type` is `application/problem+json`, body `status` field is `400`.
