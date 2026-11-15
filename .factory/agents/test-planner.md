### Test layers in this codebase

- `unit`: MSTest in `tests/<Service>.UnitTests` (NSubstitute mocks), in-process, no database.
- `functional`: xUnit v3 in `tests/<Service>.FunctionalTests` (Catalog, Basket, Ordering, Webhooks): the service in-process (`WebApplicationFactory`) against a real Postgres/Redis that the test fixture starts (`CatalogApiFixture.cs`). Use it for API contracts and status codes. Limit: in the Ordering functional host, `IntegrationEventLogService` resolves event types from `Assembly.GetEntryAssembly()` (the test runner), so an order that passes validation cannot be saved there; a case that needs a created order goes on the `e2e` layer (API calls on the test stack as `alice` or `bob`). Rejections that stop before the order is saved stay functional.
- `e2e`: Playwright specs in `e2e/teststack/` through the WebApp on the test stack.

### Test data

Scenario `default` (`.factory/stack/scenarios/default`): the demo catalog (101 items, 13 brands, 8 types; item 99 is "Adventurer GPS Watch"), users `alice` and `bob` (password `Pass123$`), empty baskets, no orders. `_base` holds the ordering card types. A case that needs more data describes it as a new scenario that `extends: default`.

### Interfaces

Catalog API `/api/catalog/...` (versioned with `api-version`; reads are anonymous); Ordering and Webhooks need a bearer token from Identity; Basket is gRPC (`src/Basket.API/Proto/basket.proto`).
