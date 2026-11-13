---
id: TC-BUG-18-01
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict", "Steps to Reproduce 1"]
priority: P1
---

# TC-BUG-18-01: POST with an existing id returns 409 Conflict on api-version 2.0

## Why

- This is the reported bug: a primary key violation surfaced as 500. Functional layer is the cheapest that reaches the endpoint against a real Postgres, where the PK violation occurs.

## Preconditions

- Scenario default: catalog item with id 1 exists (demo catalog). No auth needed beyond what the existing create tests use.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"id": 1, "name": "Duplicate", "catalogBrandId": 1, "catalogTypeId": 1, "price": 10, "availableStock": 1}`.

## Expected result

- Status is 409 (not 500).
- Body is a ProblemDetails (JSON object) whose `status` is 409. The exact `detail` text, `title` and content-type are not asserted (unspecified by the story).
