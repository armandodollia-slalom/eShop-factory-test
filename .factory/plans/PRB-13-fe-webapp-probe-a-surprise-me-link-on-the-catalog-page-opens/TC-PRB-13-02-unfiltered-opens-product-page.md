---
id: TC-PRB-13-02
type: happy
layer: e2e
covers: ["AC2: no filter, click opens the product page of one of the catalog's products"]
priority: P1
---

# TC-PRB-13-02: Without filters, "Surprise me" opens the product page of a catalog product

## Why

- AC2's core outcome is that the click lands on a real product page. The pick and redirect happen server-side, so only an e2e run through the WebApp proves the click reaches `/item/{id}` and renders the product.

## Preconditions

- Test stack running with scenario `default` (101 products, ids 1–101). Anonymous shopper.

## Steps

1. Open the catalog page `/` with no filter selected.
2. Click the "Surprise me" link.

## Expected result

- The browser ends on a URL whose path matches `/item/<id>` with `<id>` an integer from 1 to 101.
- The product page renders the product's name as its heading, and that name is one of the 101 seeded product names (for example it equals the name the Catalog API returns for `GET /api/catalog/items/<id>?api-version=1.0`).
- No error page or "not found" message is shown.
