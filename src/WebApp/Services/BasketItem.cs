using System.Text.Json.Serialization;

namespace eShop.WebApp.Services;

public class BasketItem
{
    public required string Id { get; set; }
    public int ProductId { get; set; }
    public required string ProductName { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal OldUnitPrice { get; set; }
    public int Quantity { get; set; }

    // The gift message stays with the basket: the order sent to ordering does not carry it.
    [JsonIgnore]
    public string? GiftMessage { get; set; }
}
