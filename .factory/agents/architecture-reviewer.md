### Architecture

Services, layers and datastore owners are in `.factory/policy/profile.yaml`; the rules in `.factory/policy/rules/`. In short: each service (Identity, Catalog, Basket, Ordering, Payment, Webhooks, WebApp, WebhookClient) owns its data and is reached only over HTTP/gRPC or RabbitMQ integration events; Ordering is DDD-layered (`Ordering.Domain` references nothing, `Ordering.Infrastructure` holds EF Core); shared code lives in `src/EventBus*`, `src/IntegrationEventLogEF`, `src/eShop.ServiceDefaults`, `src/WebAppComponents`.

### What to check in this codebase

- Endpoints follow `src/Catalog.API/Apis/CatalogApi.cs`: versioned groups, `TypedResults`, `ProblemDetails` for client errors.
- Package versions only in `Directory.Packages.props`.
- Schema changes come as an EF migration in the owning service's `Infrastructure/Migrations`.
- Catalog.API endpoint changes include the regenerated `Catalog.API*.json`.
- The test stack's seeder switch (`Seeding:Disabled`) is not changed by product stories, and neither is `.factory/`, except `.factory/app.json` (a new service's topology) and `.factory/stack/docker-compose.yaml` when `factory teststack publish` regenerated it from an AppHost change in the same diff.
