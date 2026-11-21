---
id: TC-BUG-4-06
type: sad
sad-path: auth
layer: functional
covers: ["Actual: a price change also publishes ProductPriceChangedIntegrationEvent"]
priority: P1
---

# TC-BUG-4-06: Anonymous price change publishes no ProductPriceChangedIntegrationEvent

## Why

- The story calls out that an anonymous price change also publishes `ProductPriceChangedIntegrationEvent`, which propagates the forged price to baskets. The event is recorded in the catalog database's `IntegrationEventLog` table (`UseIntegrationEventLogs()` in `CatalogContext`), which the functional layer can query directly against its real Postgres. This needs a `WebApplicationFactory<Program>` client built without `AutoAuthorizeStartupFilter` (the default `CatalogApiFixture` authenticates every request) and sends no `Authorization` header.

## Preconditions

- Catalog functional fixture's Postgres seeded by the Catalog.API seeder; item 1 has price `109.99`.
- Record `N` = number of rows in `"IntegrationEventLog"` whose `"EventTypeName"` contains `ProductPriceChangedIntegrationEvent`.

## Steps

1. Through an unauthenticated client (no `AutoAuthorizeStartupFilter`, no `Authorization` header), `PUT /api/catalog/items/1?api-version=2.0` with body `{"id":1,"name":"Wanderer Black Hiking Boots","description":"Anonymous price change","price":1.00,"pictureFileName":"1.webp","catalogTypeId":1,"catalogBrandId":1,"availableStock":100,"restockThreshold":10,"maxStockThreshold":200,"onReorder":false}`.
2. Count the rows in `"IntegrationEventLog"` whose `"EventTypeName"` contains `ProductPriceChangedIntegrationEvent`.
3. Read `"Price"` of `"Catalog"` row `"Id" = 1`.

## Expected result

- Step 1 returns status `401`.
- Step 2 returns `N` (no new event row).
- Step 3 returns `109.99`.
