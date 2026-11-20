---
id: TC-BRAND-3-04
type: sad
sad-path: validation
layer: functional
covers: ["AC4: any other value answers 400", "AC4: problem description names the allowed values"]
priority: P1
---

# TC-BRAND-3-04: Summary with an unknown sort value answers 400 with a problem naming name and count

## Why

- AC4 requires any value other than `name` or `count` to be rejected with 400 and a problem description that names the allowed values, so a client learns how to fix the call. Without validation the endpoint would silently return some order. Functional checks the status code and problem body of the real endpoint.

## Preconditions

- The catalog Functional host (`CatalogApiFixture`) is running with the demo catalog.

## Steps

1. Send `GET /api/catalog/catalogbrands/summary?api-version=1.0&sort=price` anonymously.

## Expected result

- Status `400`.
- Content type `application/problem+json`.
- The body is a problem object with `status` 400, and its `detail` text contains both `name` and `count`.
- The body is not a brand array (no entry with `id` / `brand` / `itemCount`).
