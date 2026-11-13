using Microsoft.AspNetCore.Http.HttpResults;
using CardType = eShop.Ordering.API.Application.Queries.CardType;
using Order = eShop.Ordering.API.Application.Queries.Order;

public static class OrdersApi
{
    public static RouteGroupBuilder MapOrdersApiV1(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("api/orders").HasApiVersion(1.0);

        api.MapPut("/cancel", CancelOrderAsync);
        api.MapPut("/ship", ShipOrderAsync);
        api.MapGet("{orderId:int}", GetOrderAsync);
        api.MapGet("/", GetOrdersByUserAsync);
        api.MapGet("/cardtypes", GetCardTypesAsync);
        api.MapPost("/draft", CreateOrderDraftAsync);
        api.MapPost("/", CreateOrderAsync);

        return api;
    }

    public static async Task<Results<Ok, BadRequest<string>, NotFound, Conflict<ProblemDetails>, ProblemHttpResult>> CancelOrderAsync(
        [FromHeader(Name = "x-requestid")] Guid requestId,
        CancelOrderCommand command,
        [AsParameters] OrderServices services)
    {
        if (requestId == Guid.Empty)
        {
            return TypedResults.BadRequest("Empty GUID is not valid for request ID");
        }

        var requestCancelOrder = new IdentifiedCommand<CancelOrderCommand, bool>(command, requestId);

        services.Logger.LogInformation(
            "Sending command: {CommandName} - {IdProperty}: {CommandId} ({@Command})",
            requestCancelOrder.GetGenericTypeName(),
            nameof(requestCancelOrder.Command.OrderNumber),
            requestCancelOrder.Command.OrderNumber,
            requestCancelOrder);

        return await SendOrderStatusCommandAsync(requestCancelOrder, command.OrderNumber, "Cancel order failed to process.", services);
    }

    public static async Task<Results<Ok, BadRequest<string>, NotFound, Conflict<ProblemDetails>, ProblemHttpResult>> ShipOrderAsync(
        [FromHeader(Name = "x-requestid")] Guid requestId,
        ShipOrderCommand command,
        [AsParameters] OrderServices services)
    {
        if (requestId == Guid.Empty)
        {
            return TypedResults.BadRequest("Empty GUID is not valid for request ID");
        }

        var requestShipOrder = new IdentifiedCommand<ShipOrderCommand, bool>(command, requestId);

        services.Logger.LogInformation(
            "Sending command: {CommandName} - {IdProperty}: {CommandId} ({@Command})",
            requestShipOrder.GetGenericTypeName(),
            nameof(requestShipOrder.Command.OrderNumber),
            requestShipOrder.Command.OrderNumber,
            requestShipOrder);

        return await SendOrderStatusCommandAsync(requestShipOrder, command.OrderNumber, "Ship order failed to process.", services);
    }

    /// <summary>
    /// Sends an order status change command and maps its outcome: 200 on success, 400 for command validation
    /// failures, 409 for a status transition the order's rules forbid, 404 when the order does not exist and
    /// 500 for any other failure.
    /// </summary>
    private static async Task<Results<Ok, BadRequest<string>, NotFound, Conflict<ProblemDetails>, ProblemHttpResult>> SendOrderStatusCommandAsync<T>(
        IdentifiedCommand<T, bool> request,
        int orderNumber,
        string failureDetail,
        OrderServices services)
        where T : IRequest<bool>
    {
        bool commandResult;
        try
        {
            commandResult = await services.Mediator.Send(request);
        }
        catch (OrderingDomainException ex) when (ex.InnerException is ValidationException validation)
        {
            services.Logger.LogWarning(ex, "Validation failed for order {OrderNumber}", orderNumber);
            return TypedResults.BadRequest(string.Join(" ", validation.Errors.Select(e => e.ErrorMessage)));
        }
        catch (OrderingDomainException ex)
        {
            services.Logger.LogWarning(ex, "Order status change rejected for order {OrderNumber}", orderNumber);
            return TypedResults.Conflict(new ProblemDetails
            {
                Title = "Invalid order status change",
                Detail = ex.Message,
                Status = StatusCodes.Status409Conflict
            });
        }

        if (!commandResult)
        {
            if (!await OrderExistsAsync(orderNumber, services.Queries))
            {
                return TypedResults.NotFound();
            }

            return TypedResults.Problem(detail: failureDetail, statusCode: 500);
        }

        return TypedResults.Ok();
    }

    private static async Task<bool> OrderExistsAsync(int orderNumber, IOrderQueries queries)
    {
        try
        {
            await queries.GetOrderAsync(orderNumber);
            return true;
        }
        catch (KeyNotFoundException)
        {
            return false;
        }
    }

    public static async Task<Results<Ok<Order>, NotFound>> GetOrderAsync(int orderId, [AsParameters] OrderServices services)
    {
        try
        {
            var order = await services.Queries.GetOrderAsync(orderId);
            return TypedResults.Ok(order);
        }
        catch
        {
            return TypedResults.NotFound();
        }
    }

    public static async Task<Ok<IEnumerable<OrderSummary>>> GetOrdersByUserAsync([AsParameters] OrderServices services)
    {
        var userId = services.IdentityService.GetUserIdentity();
        var orders = await services.Queries.GetOrdersFromUserAsync(userId);
        return TypedResults.Ok(orders);
    }

    public static async Task<Ok<IEnumerable<CardType>>> GetCardTypesAsync(IOrderQueries orderQueries)
    {
        var cardTypes = await orderQueries.GetCardTypesAsync();
        return TypedResults.Ok(cardTypes);
    }

    public static async Task<OrderDraftDTO> CreateOrderDraftAsync(CreateOrderDraftCommand command, [AsParameters] OrderServices services)
    {
        services.Logger.LogInformation(
            "Sending command: {CommandName} - {IdProperty}: {CommandId} ({@Command})",
            command.GetGenericTypeName(),
            nameof(command.BuyerId),
            command.BuyerId,
            command);

        return await services.Mediator.Send(command);
    }

    public static async Task<Results<Ok, BadRequest<string>>> CreateOrderAsync(
        [FromHeader(Name = "x-requestid")] Guid requestId,
        CreateOrderRequest request,
        [AsParameters] OrderServices services)
    {

        //mask the credit card number

        services.Logger.LogInformation(
            "Sending command: {CommandName} - {IdProperty}: {CommandId}",
            request.GetGenericTypeName(),
            nameof(request.UserId),
            request.UserId); //don't log the request as it has CC number

        if (requestId == Guid.Empty)
        {
            services.Logger.LogWarning("Invalid IntegrationEvent - RequestId is missing - {@IntegrationEvent}", request);
            return TypedResults.BadRequest("RequestId is missing.");
        }

        using (services.Logger.BeginScope(new List<KeyValuePair<string, object>> { new("IdentifiedCommandId", requestId) }))
        {
            var maskedCCNumber = request.CardNumber.Substring(request.CardNumber.Length - 4).PadLeft(request.CardNumber.Length, 'X');
            var createOrderCommand = new CreateOrderCommand(request.Items, request.UserId, request.UserName, request.City, request.Street,
                request.State, request.Country, request.ZipCode,
                maskedCCNumber, request.CardHolderName, request.CardExpiration,
                request.CardSecurityNumber, request.CardTypeId);

            var requestCreateOrder = new IdentifiedCommand<CreateOrderCommand, bool>(createOrderCommand, requestId);

            services.Logger.LogInformation(
                "Sending command: {CommandName} - {IdProperty}: {CommandId} ({@Command})",
                requestCreateOrder.GetGenericTypeName(),
                nameof(requestCreateOrder.Id),
                requestCreateOrder.Id,
                requestCreateOrder);

            bool result;
            try
            {
                result = await services.Mediator.Send(requestCreateOrder);
            }
            catch (OrderingDomainException ex)
            {
                // IdentifiedCommandHandler lets domain exceptions through; keep this endpoint's existing behavior.
                services.Logger.LogWarning(ex, "CreateOrderCommand rejected - RequestId: {RequestId}", requestId);
                result = false;
            }

            if (result)
            {
                services.Logger.LogInformation("CreateOrderCommand succeeded - RequestId: {RequestId}", requestId);
            }
            else
            {
                services.Logger.LogWarning("CreateOrderCommand failed - RequestId: {RequestId}", requestId);
            }

            return TypedResults.Ok();
        }
    }
}

public record CreateOrderRequest(
    string UserId,
    string UserName,
    string City,
    string Street,
    string State,
    string Country,
    string ZipCode,
    string CardNumber,
    string CardHolderName,
    DateTime CardExpiration,
    string CardSecurityNumber,
    int CardTypeId,
    string Buyer,
    List<BasketItem> Items);
