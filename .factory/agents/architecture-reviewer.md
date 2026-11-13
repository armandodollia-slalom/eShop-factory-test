### Architecture

Services, layers and datastore owners are in `.factory/policy/profile.yaml`, and the rules are in `.factory/policy/rules/` (both read-only). In short: each service (Identity, Catalog, Basket, Ordering, Payment, Webhooks, WebApp, WebhookClient) owns its data and is reached only over HTTP/gRPC or RabbitMQ integration events; Ordering is DDD-layered (`Ordering.Domain` references nothing, `Ordering.Infrastructure` holds EF Core); shared code lives in `src/EventBus*`, `src/IntegrationEventLogEF`, `src/eShop.ServiceDefaults`, `src/WebAppComponents`.

### What to check in this codebase

- Endpoints follow `src/Catalog.API/Apis/CatalogApi.cs`: versioned groups, `TypedResults`, `ProblemDetails` for client errors.
- Package versions only in `Directory.Packages.props`.
- Schema changes come as an EF migration in the owning service's `Infrastructure/Migrations`.
- Catalog.API endpoint changes include the regenerated `Catalog.API*.json`.
- The test stack's seeder switch (`Seeding:Disabled`) is not changed by product stories, and neither is `.factory/`, except `.factory/app.json` (a new service's topology, and its `policy.services` declaration: id, project roots, new datastores) and `.factory/stack/docker-compose.yaml` when `factory teststack publish` regenerated it from an AppHost change in the same diff.
- For every project a change adds, check that its derived class (type and layer, from the policy's classification conventions; the policy finding or `factory arch` shows it) matches what the project is and does, that a declared service really is new and its datastores really are its own, and that code was not put in a test or library project to stay out of a rule. The factory derives the class from the project; it cannot judge whether the project was put in the right place.
