### Test layers in this codebase

- `unit`: MSTest in `tests/<Service>.UnitTests` (NSubstitute mocks), in-process, no database.
- `functional`: xUnit v3 in `tests/<Service>.FunctionalTests` (Catalog, Basket, Ordering, Webhooks): the service in-process (`WebApplicationFactory`) against a real Postgres/Redis that the test fixture starts (`CatalogApiFixture.cs`). Use it for API contracts, status codes and validation.
- `e2e`: Playwright specs in `e2e/teststack/` through the WebApp on the test stack.

### Test data

Scenario `default` (`.factory/stack/scenarios/default`): the demo catalog (101 items, 13 brands, 8 types; item 99 is "Adventurer GPS Watch"), users `alice` and `bob` (password `Pass123$`), empty baskets, no orders. `_base` holds the ordering card types. A case that needs more data describes it as a new scenario that `extends: default`.

### Interfaces

Catalog API `GET /api/catalog/items?api-version=1.0&pageSize=&pageIndex=` (anonymous); Ordering and Webhooks need a bearer token from Identity; Basket is gRPC (`src/Basket.API/Proto/basket.proto`).
