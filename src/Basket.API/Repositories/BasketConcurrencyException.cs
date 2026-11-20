namespace eShop.Basket.API.Repositories;

/// <summary>
/// Thrown when a basket kept changing concurrently and a conditional update could not be applied.
/// </summary>
public sealed class BasketConcurrencyException(string buyerId, int attempts)
    : Exception($"Basket {buyerId} kept changing concurrently; update abandoned after {attempts} attempts.");
