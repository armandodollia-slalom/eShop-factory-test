---
id: TC-BUG-18-02
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict", "Code map: v1 and v2"]
priority: P2
---

# TC-BUG-18-02: POST with an existing id returns 409 Conflict on api-version 1.0

## Why

- The Implementation Notes state the fix covers v1 and v2; the endpoint is mapped per version, so v1 needs its own case in case routing diverges.

## Preconditions

- Scenario default: item with id 1 exists.

## Steps

1. `POST /api/catalog/items?api-version=1.0` with the same body as TC-BUG-18-01 (`id` 1, valid name, brand, type, price).

## Expected result

- Status is 409; body is a ProblemDetails (JSON object) whose `status` is 409. The `detail` text is not asserted.
