---
id: TC-BRAND-3-06
type: sad
sad-path: boundary
layer: functional
covers: ["AC4: any other value answers 400 (case variant of an allowed value)"]
priority: P2
---

# TC-BRAND-3-06: Summary with sort=COUNT (different case) answers 400

## Why

- AC4 accepts exactly `name` and `count`; `COUNT` is the closest value outside that set. The literal reading (and the as-built decision to match exactly) is a 400, so a case-insensitive comparison would be a contract drift between the API and the page, which also matches exactly. Functional checks the real validator. See Open questions in `_index.md`.

## Preconditions

- The catalog Functional host (`CatalogApiFixture`) is running with the demo catalog.

## Steps

1. Send `GET /api/catalog/catalogbrands/summary?api-version=1.0&sort=COUNT` anonymously.

## Expected result

- Status `400`, content type `application/problem+json`.
- The problem's `detail` text contains both `name` and `count`.
