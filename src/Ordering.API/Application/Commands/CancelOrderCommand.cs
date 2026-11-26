using System.Text.Json.Serialization;

namespace eShop.Ordering.API.Application.Commands;

public record CancelOrderCommand(int OrderNumber) : IRequest<CancelOrderResult>
{
    /// <summary>
    /// Identity of the buyer asking to cancel. When set, only that buyer's order is cancelled.
    /// Never read from the request body: the API sets it from the caller's identity.
    /// </summary>
    [JsonIgnore]
    public string BuyerIdentityGuid { get; init; }
}

public enum CancelOrderResult
{
    Cancelled,
    NotFound,
    NotCancellable
}
