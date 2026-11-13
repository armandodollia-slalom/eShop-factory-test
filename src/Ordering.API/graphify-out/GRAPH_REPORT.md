# Graph Report - Ordering.API  (2026-11-13)

## Corpus Check
- 72 files · ~6,193 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 509 nodes · 918 edges · 33 communities (26 shown, 7 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6c4d693b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ILogger
- Task
- CreateOrderCommand
- Extensions.AddEventBusSubscriptions
- Extensions.AddApplicationServices
- CreateOrderCommandValidator
- GlobalUsings.cs
- BasketItem
- OrderStatusChangedToPaidIntegrationEvent
- IRequestHandler
- Ordering.API.csproj
- SelectTryResult
- SetStockRejectedOrderStatusCommand
- eShop.Ordering.API.Application.IntegrationEvents.Events
- IdentityService
- OrderDraftDTO
- IdentifiedCommandHandler
- IRequest
- eShop.Ordering.API.Application.Commands
- IdentifiedCommandHandler.IdentifiedCommandHandler
- SetAwaitingValidationOrderStatusCommand
- ShipOrderCommand
- OrderStockRejectedIntegrationEvent
- OrderItemDTO
- IntegrationEvent
- OrderStatusChangedToAwaitingValidationIntegrationEvent
- OrderStatusChangedToCancelledIntegrationEvent
- OrderStatusChangedToStockConfirmedIntegrationEvent
- OrderStatusChangedToSubmittedIntegrationEvent
- OrderStatusChangedToShippedIntegrationEvent
- OrderPaymentFailedIntegrationEvent
- Program.Testing.cs

## God Nodes (most connected - your core abstractions)
1. `CreateOrderCommand` - 25 edges
2. `Order` - 20 edges
3. `eShop.Ordering.API.Application.Commands` - 19 edges
4. `OrderServices` - 17 edges
5. `IdentifiedCommandHandler` - 16 edges
6. `eShop.Ordering.API.Application.IntegrationEvents.Events` - 13 edges
7. `OrderStatusChangedToAwaitingValidationIntegrationEvent` - 12 edges
8. `OrderStatusChangedToPaidIntegrationEvent` - 12 edges
9. `OrdersApi` - 11 edges
10. `CreateOrderCommandHandler` - 10 edges

## Surprising Connections (you probably didn't know these)
- `CancelOrderIdentifiedCommandHandler` --inherits--> `IdentifiedCommandHandler`  [EXTRACTED]
  src/Ordering.API/Application/Commands/CancelOrderCommandHandler.cs → src/Ordering.API/Application/Commands/IdentifiedCommandHandler.cs
- `CreateOrderCommand` --references--> `OrderItemDTO`  [EXTRACTED]
  src/Ordering.API/Application/Commands/CreateOrderCommand.cs → src/Ordering.API/Application/Commands/CreateOrderDraftCommandHandler.cs
- `CreateOrderIdentifiedCommandHandler` --references--> `CreateOrderCommand`  [EXTRACTED]
  src/Ordering.API/Application/Commands/CreateOrderCommandHandler.cs → src/Ordering.API/Application/Commands/CreateOrderCommand.cs
- `CreateOrderIdentifiedCommandHandler` --inherits--> `IdentifiedCommandHandler`  [EXTRACTED]
  src/Ordering.API/Application/Commands/CreateOrderCommandHandler.cs → src/Ordering.API/Application/Commands/IdentifiedCommandHandler.cs
- `CreateOrderDraftCommand` --references--> `BasketItem`  [EXTRACTED]
  src/Ordering.API/Application/Commands/CreateOrderDraftCommand.cs → src/Ordering.API/Application/Models/BasketItem.cs

## Import Cycles
- None detected.

## Communities (33 total, 7 thin omitted)

### Community 0 - "ILogger"
Cohesion: 0.06
Nodes (14): LoggingBehavior, TransactionBehavior, ValidatorBehavior, SetPaidOrderStatusCommandHandler, OrderCancelledDomainEventHandler, OrderShippedDomainEventHandler, OrderStatusChangedToAwaitingValidationDomainEventHandler, OrderStatusChangedToPaidDomainEventHandler (+6 more)

### Community 1 - "Task"
Cohesion: 0.08
Nodes (17): OrdersApi, OrderServices, IdentityService, Logger, Mediator, Queries, IOrderQueries, OrderQueries (+9 more)

### Community 2 - "CreateOrderCommand"
Cohesion: 0.05
Nodes (35): CreateOrderRequest, CreateOrderCommand, CardExpiration, CardHolderName, CardNumber, CardSecurityNumber, CardTypeId, City (+27 more)

### Community 3 - "Extensions.AddEventBusSubscriptions"
Cohesion: 0.07
Nodes (7): SetPaidOrderStatusCommand, GracePeriodConfirmedIntegrationEventHandler, OrderPaymentFailedIntegrationEventHandler, OrderPaymentSucceededIntegrationEventHandler, OrderStockConfirmedIntegrationEventHandler, OrderStockRejectedIntegrationEventHandler, eShop.Ordering.API.Application.IntegrationEvents.EventHandling

### Community 4 - "Extensions.AddApplicationServices"
Cohesion: 0.08
Nodes (5): IOrderingIntegrationEventService, OrderingIntegrationEventService, eShop.Ordering.API.Application.IntegrationEvents, Extensions, OrderingContextSeed

### Community 5 - "CreateOrderCommandValidator"
Cohesion: 0.11
Nodes (6): CancelOrderCommandValidator, CreateOrderCommandValidator, IdentifiedCommandValidator, ShipOrderCommandValidator, eShop.Ordering.API.Application.Validations, BasketItemExtensions

### Community 7 - "BasketItem"
Cohesion: 0.14
Nodes (12): BasketItem, Id, OldUnitPrice, PictureUrl, ProductId, ProductName, Quantity, UnitPrice (+4 more)

### Community 8 - "OrderStatusChangedToPaidIntegrationEvent"
Cohesion: 0.18
Nodes (9): OrderStockItem, ProductId, Units, OrderStatusChangedToPaidIntegrationEvent, BuyerIdentityGuid, BuyerName, OrderId, OrderStatus (+1 more)

### Community 9 - "IRequestHandler"
Cohesion: 0.19
Nodes (3): CancelOrderCommand, CancelOrderCommandHandler, CancelOrderIdentifiedCommandHandler

### Community 10 - "Ordering.API.csproj"
Cohesion: 0.15
Nodes (7): net10.0, Asp.Versioning.Http, Aspire.Npgsql.EntityFrameworkCore.PostgreSQL, FluentValidation, FluentValidation.DependencyInjectionExtensions, Microsoft.EntityFrameworkCore.Tools, Microsoft.NET.Sdk.Web

### Community 11 - "SelectTryResult"
Cohesion: 0.29
Nodes (5): LinqSelectExtensions, SelectTryResult, CaughtException, Result, Source

### Community 12 - "SetStockRejectedOrderStatusCommand"
Cohesion: 0.24
Nodes (3): SetStockRejectedOrderStatusCommand, SetStockRejectedOrderStatusCommandHandler, SetStockRejectedOrderStatusIdentifiedCommandHandler

### Community 13 - "eShop.Ordering.API.Application.IntegrationEvents.Events"
Cohesion: 0.18
Nodes (5): GracePeriodConfirmedIntegrationEvent, OrderId, OrderStockConfirmedIntegrationEvent, OrderId, eShop.Ordering.API.Application.IntegrationEvents.Events

### Community 14 - "IdentityService"
Cohesion: 0.24
Nodes (3): eShop.Ordering.API.Infrastructure.Services, IdentityService, IIdentityService

### Community 15 - "OrderDraftDTO"
Cohesion: 0.29
Nodes (5): CreateOrderDraftCommand, CreateOrderDraftCommandHandler, OrderDraftDTO, OrderItems, Total

### Community 16 - "IdentifiedCommandHandler"
Cohesion: 0.24
Nodes (4): IdentifiedCommand, Command, Id, IdentifiedCommandHandler

### Community 17 - "IRequest"
Cohesion: 0.24
Nodes (3): SetStockConfirmedOrderStatusCommand, SetStockConfirmedOrderStatusCommandHandler, SetStockConfirmedOrderStatusIdentifiedCommandHandler

### Community 20 - "SetAwaitingValidationOrderStatusCommand"
Cohesion: 0.28
Nodes (3): SetAwaitingValidationOrderStatusCommand, SetAwaitingValidationIdentifiedOrderStatusCommandHandler, SetAwaitingValidationOrderStatusCommandHandler

### Community 21 - "ShipOrderCommand"
Cohesion: 0.28
Nodes (3): ShipOrderCommand, ShipOrderCommandHandler, ShipOrderIdentifiedCommandHandler

### Community 22 - "OrderStockRejectedIntegrationEvent"
Cohesion: 0.25
Nodes (6): ConfirmedOrderStockItem, HasStock, ProductId, OrderStockRejectedIntegrationEvent, OrderId, OrderStockItems

### Community 23 - "OrderItemDTO"
Cohesion: 0.29
Nodes (7): OrderItemDTO, Discount, PictureUrl, ProductId, ProductName, UnitPrice, Units

### Community 25 - "OrderStatusChangedToAwaitingValidationIntegrationEvent"
Cohesion: 0.29
Nodes (6): OrderStatusChangedToAwaitingValidationIntegrationEvent, BuyerIdentityGuid, BuyerName, OrderId, OrderStatus, OrderStockItems

### Community 26 - "OrderStatusChangedToCancelledIntegrationEvent"
Cohesion: 0.29
Nodes (5): OrderStatusChangedToCancelledIntegrationEvent, BuyerIdentityGuid, BuyerName, OrderId, OrderStatus

### Community 27 - "OrderStatusChangedToStockConfirmedIntegrationEvent"
Cohesion: 0.29
Nodes (5): OrderStatusChangedToStockConfirmedIntegrationEvent, BuyerIdentityGuid, BuyerName, OrderId, OrderStatus

### Community 28 - "OrderStatusChangedToSubmittedIntegrationEvent"
Cohesion: 0.29
Nodes (5): OrderStatusChangedToSubmittedIntegrationEvent, BuyerIdentityGuid, BuyerName, OrderId, OrderStatus

### Community 29 - "OrderStatusChangedToShippedIntegrationEvent"
Cohesion: 0.33
Nodes (5): OrderStatusChangedToShippedIntegrationEvent, BuyerIdentityGuid, BuyerName, OrderId, OrderStatus

## Knowledge Gaps
- **104 isolated node(s):** `Mediator`, `Logger`, `Queries`, `IdentityService`, `UserId` (+99 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 205 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CreateOrderCommand` connect `CreateOrderCommand` to `Task`, `IRequest`, `eShop.Ordering.API.Application.Commands`, `IdentifiedCommandHandler.IdentifiedCommandHandler`, `OrderItemDTO`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **What connects `Mediator`, `Logger`, `Queries` to the rest of the system?**
  _104 weakly-connected nodes found - possible missing edges._
- **Should `ILogger` be split into smaller, more focused modules?**
  _Cohesion score 0.058653846153846154 - nodes in this community are weakly interconnected._
- **Why does `eShop.Ordering.API.Application.Commands` connect `eShop.Ordering.API.Application.Commands` to `Extensions.AddEventBusSubscriptions`, `GlobalUsings.cs`, `IRequestHandler`, `SetStockRejectedOrderStatusCommand`, `OrderDraftDTO`, `IdentifiedCommandHandler`, `IRequest`, `IdentifiedCommandHandler.IdentifiedCommandHandler`, `SetAwaitingValidationOrderStatusCommand`, `ShipOrderCommand`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `Task` be split into smaller, more focused modules?**
  _Cohesion score 0.07832080200501253 - nodes in this community are weakly interconnected._
- **Why does `IdentifiedCommandHandler` connect `IdentifiedCommandHandler` to `ILogger`, `Extensions.AddEventBusSubscriptions`, `IRequestHandler`, `SetStockRejectedOrderStatusCommand`, `IRequest`, `IdentifiedCommandHandler.IdentifiedCommandHandler`, `SetAwaitingValidationOrderStatusCommand`, `ShipOrderCommand`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `CreateOrderCommand` be split into smaller, more focused modules?**
  _Cohesion score 0.04698581560283688 - nodes in this community are weakly interconnected._