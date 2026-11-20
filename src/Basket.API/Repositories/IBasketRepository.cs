using eShop.Basket.API.Model;

namespace eShop.Basket.API.Repositories;

public interface IBasketRepository
{
    Task<CustomerBasket> GetBasketAsync(string customerId);
    Task<CustomerBasket> UpdateBasketAsync(CustomerBasket basket);

    /// <summary>
    /// Replaces the buyer's basket with the result of <paramref name="update"/> applied to the basket stored at write time.
    /// <paramref name="update"/> may run more than once when a concurrent write changes the stored basket.
    /// </summary>
    Task<CustomerBasket> UpdateBasketAsync(string buyerId, Func<CustomerBasket, CustomerBasket> update);
    Task<bool> DeleteBasketAsync(string id);
}
