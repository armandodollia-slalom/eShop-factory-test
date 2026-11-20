---
id: TC-BRAND-3-05
type: sad
sad-path: boundary
layer: functional
covers: ["AC4: any other value answers 400 (empty value)"]
priority: P2
---

# TC-BRAND-3-05: Summary with an empty sort value answers 400

## Why

- An empty `sort=` is the boundary between "parameter absent" (default name order, TC-BRAND-3-03) and "a value outside name and count" (400, AC4). Model binding can turn an empty string into null and silently treat it as the default; the literal reading of AC4 ("any other value") is a 400, as the as-built notes also decide. Functional checks the real binding.

## Preconditions

- The catalog Functional host (`CatalogApiFixture`) is running with the demo catalog.

## Steps

1. Send `GET /api/catalog/catalogbrands/summary?api-version=1.0&sort=` anonymously.

## Expected result

- Status `400`, content type `application/problem+json`.
- The problem's `detail` text contains both `name` and `count`.
