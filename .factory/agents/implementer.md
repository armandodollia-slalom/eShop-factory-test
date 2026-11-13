### Stack

.NET 10 microservices (C#, ASP.NET Core minimal APIs, gRPC for Basket, Blazor Server for WebApp) composed by an Aspire AppHost (`src/eShop.AppHost/AppHost.cs`). Services talk over HTTP/gRPC and RabbitMQ integration events (`src/EventBus`, `src/EventBusRabbitMQ`); each owns its database (Postgres `identitydb`, `catalogdb`, `orderingdb`, `webhooksdb`; Redis for Basket). Read `README.md` and the architecture policy (`.factory/policy/profile.yaml`, read-only) before adding a project or a cross-service call.

### Shell setup

The .NET SDK is in `~/.dotnet` (put it on `PATH`: `export PATH=$HOME/.dotnet:$PATH`). In a new worktree run `dotnet restore eShop.Web.slnf -v q && npm ci` once. The code graph: `graphify query "<question>"` (build it with `graphify update .` if `graphify-out/` is missing).

### Layout

- Product code: `src/<Service>` (one project per service; Ordering is split into `Ordering.API`, `Ordering.Domain`, `Ordering.Infrastructure`, `OrderProcessor`). Shared libraries: `src/EventBus*`, `src/IntegrationEventLogEF`, `src/eShop.ServiceDefaults`, `src/WebAppComponents`; `src/Shared` holds source files linked into several projects.
- Tests: `tests/<Service>.UnitTests` (MSTest), `tests/<Service>.FunctionalTests` (xUnit v3), `tests/Application.UnitTests` (MSTest, several services), `e2e/` (Playwright).
- Not built here: `src/ClientApp`, `src/HybridApp` (.NET MAUI). Do not change them.
- Test stack: `.factory/stack/` (scenarios, and `docker-compose.yaml`, generated from the AppHost by `factory teststack publish`; never edit it by hand). Its topology (services, images, ports, URLs, readiness, test-only overrides) is in `.factory/app.json`, which you may edit; `.factory/config.json` and the rest of `.factory/` are the factory's.

### Conventions: which example to follow

| Concern | Follow |
| --- | --- |
| HTTP endpoint | `src/Catalog.API/Apis/CatalogApi.cs`: `MapGroup` + `HasApiVersion`, handlers returning `TypedResults`, `[ProducesResponseType<ProblemDetails>]` for 400s |
| Application wiring | `src/<Service>/Extensions/Extensions.cs` (`AddApplicationServices`), `Program.cs` stays thin |
| Auth | `builder.AddDefaultAuthentication()` from `src/eShop.ServiceDefaults/AuthenticationExtensions.cs`; `RequireAuthorization()` on groups |
| Persistence and migrations | EF Core contexts in `src/<Service>/Infrastructure` (`CatalogContext.cs`); migrations in `Infrastructure/Migrations`, created with `dotnet ef migrations add <Name> --project src/<Service>` |
| Domain logic | `src/Ordering.Domain/AggregatesModel` (aggregates, domain events), commands and handlers in `src/Ordering.API/Application/Commands` (MediatR) |
| Events and messaging | `src/Catalog.API/IntegrationEvents` (event records in `Events/`, handlers in `EventHandling/`, publishing through the integration event log) |
| UI | Blazor components in `src/WebApp/Components/Pages`, shared ones in `src/WebAppComponents`, styles in `*.razor.css` next to the component |

### Rules

- Package versions live only in `Directory.Packages.props` (central package management); a csproj has `<PackageReference Include="X" />` without a version.
- API changes are versioned with Asp.Versioning (`HasApiVersion`, `api-version` query string); keep existing versions working.
- `src/Catalog.API/Catalog.API.json` and `Catalog.API_v2.json` are OpenAPI documents generated on build (`Microsoft.Extensions.ApiDescription.Server`); rebuild Catalog.API and commit them when you change its endpoints. Never edit them by hand.
- A service never references another service's project or connects to its database (policy ARCH-004, DATA-001).
- `Seeding:Disabled` (in `src/Shared/MigrateDbContextExtensions.cs`) is the test stack's switch; keep seeders working when it is unset.

### A new service, end to end

Register it in every place, in one subtask: `src/eShop.AppHost/AppHost.cs` (`AddDotnetProject`, `WithReference` to its database and the event bus, `Identity__Url` if it validates tokens); `src/Identity.API/Configuration/Config.cs` when it needs a scope or a client; `eShop.Web.slnf`; and the test stack, in `.factory/app.json`: `stack.services.<name>` (`project`, `image: { env: <NAME>_IMAGE, name }`), a `stack.ports` entry and its `stack.publishOverrides.ports.services` mapping if the browser or a test reaches it, `stack.urls`, its `teststack.services` readiness URL, and, for the architecture policy, the new service under `policy.services` (`id`, `roots`: the folder of each of its projects, `owns_datastores`: its new databases). A project's class (type and layer) is derived from the project itself by the policy's classification conventions (read-only, in `.factory/policy/profile.yaml`): name and place it like the existing ones (`src/<Service>.API` with the Web SDK; tests under `tests/` as test projects). A project that fits no convention, or is nested in another, is escalated to a person: report it, never work around it; add a `publishOverrides.services` entry (with its reason) only for what the test stack must do differently, such as the identity URL or seeding off. Then run `node .factory/bin/factory.mjs teststack publish` (it regenerates `.factory/stack/docker-compose.yaml` from the AppHost) and `node .factory/bin/factory.mjs teststack drift`, which must report `"check":"clean"`.

### Time, UI, optional features

- No clock abstraction exists (direct `DateTime.UtcNow` calls); new code injects `TimeProvider` (register `TimeProvider.System`) so tests can control time. Leave existing calls alone.
- WebApp pages are static server-side rendering with `[StreamRendering]` (`src/WebApp/Components/Pages/Catalog/Catalog.razor`); interactivity only where a component needs it (`@rendermode InteractiveServer`, as in `Pages/User/OrdersRefreshOnStatusChange.razor`). Forms on static pages use `EditForm ... FormName=... Enhance` with `[SupplyParameterFromForm]` (`Pages/Checkout/Checkout.razor`).
- The AI features are off unless configured: `CatalogAI.cs` (embeddings, `textEmbeddingModel`) and the WebApp chatbot (`chatModel`); code must keep working with them off.

### Planning subtasks

`Directory.Packages.props`, a service's `Extensions/Extensions.cs` and `Program.cs`, and `src/Shared/*` go in the first subtask that needs them.

### Checks before you commit

- Build: `dotnet build eShop.Web.slnf -nologo -v q -clp:ErrorsOnly`
- Unit tests of a service you touched: `dotnet test --project tests/<Service>.UnitTests` (`tests/Application.UnitTests` for Catalog, Identity, OrderProcessor, PaymentProcessor, Webhooks, WebhookClient).
- Format the files you changed: `dotnet format eShop.Web.slnf --include <files>`.
- Do not run the functional tests or the e2e suite here; they need Docker and belong to feature verification.
