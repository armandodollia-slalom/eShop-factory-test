### Flow of a request

Browser → WebApp (Blazor Server, `src/WebApp`) → Ordering over HTTP and Basket over gRPC (`src/WebApp/Services`), Catalog over HTTP (`src/WebAppComponents/Services`); sign-in through Identity.API (OpenID Connect). Ordering: `OrdersApi.cs` → MediatR command (`src/Ordering.API/Application/Commands`) → `Ordering.Domain` aggregate → EF (`Ordering.Infrastructure`) → integration events over RabbitMQ to OrderProcessor, PaymentProcessor, Webhooks and WebApp.
