namespace eShop.Basket.FunctionalTests;

[Trait("Story", "CART-1")]
[Collection(RedisCollection.Name)]
public sealed class SaveForLaterTests(RedisFixture fixture)
{
    private RedisBasketRepository CreateRepository()
        => new(NullLogger<RedisBasketRepository>.Instance, fixture.Connection);

    private static string NewBuyerId() => $"buyer-{Guid.NewGuid():N}";

    private static BasketItem Line(int productId, int quantity) => new() { ProductId = productId, Quantity = quantity };

    [Fact]
    [Trait("TestCase", "TC-CART-1-11")]
    public async Task TC_CART_1_11_DeleteBasketEmptiesCartAndKeepsSavedProducts()
    {
        var repository = CreateRepository();
        var buyerId = NewBuyerId();
        await repository.UpdateBasketAsync(new CustomerBasket
        {
            BuyerId = buyerId,
            Items = [Line(2, 1)],
            SavedItems = [Line(1, 2)]
        });

        var deleted = await repository.DeleteBasketAsync(buyerId);
        var basket = await repository.GetBasketAsync(buyerId);

        Assert.True(deleted);
        Assert.NotNull(basket);
        Assert.Empty(basket.Items);
        var saved = Assert.Single(basket.SavedItems);
        Assert.Equal(1, saved.ProductId);
        Assert.Equal(2, saved.Quantity);
    }

    [Fact]
    [Trait("TestCase", "TC-CART-1-12")]
    public async Task TC_CART_1_12_DeleteBasketWithNothingSavedLeavesEmptyCartAndNothingSaved()
    {
        var repository = CreateRepository();
        var buyerId = NewBuyerId();
        await repository.UpdateBasketAsync(new CustomerBasket
        {
            BuyerId = buyerId,
            Items = [Line(2, 1)],
            SavedItems = []
        });

        var deleted = await repository.DeleteBasketAsync(buyerId);
        var basket = await repository.GetBasketAsync(buyerId);

        Assert.True(deleted);
        Assert.Equal(0, basket?.Items.Count ?? 0);
        Assert.Equal(0, basket?.SavedItems.Count ?? 0);
    }

    [Fact]
    [Trait("TestCase", "TC-CART-1-13")]
    public async Task TC_CART_1_13_SavedProductsRoundTripThroughRedisAndSurviveNewRepositoryInstance()
    {
        var buyerId = NewBuyerId();
        await CreateRepository().UpdateBasketAsync(new CustomerBasket
        {
            BuyerId = buyerId,
            Items = [Line(2, 1)],
            SavedItems = [Line(1, 2), Line(3, 5)]
        });

        var basket = await CreateRepository().GetBasketAsync(buyerId);

        Assert.NotNull(basket);
        var item = Assert.Single(basket.Items);
        Assert.Equal(2, item.ProductId);
        Assert.Equal(1, item.Quantity);
        Assert.Equal(2, basket.SavedItems.Count);
        Assert.Equivalent(
            new[] { (ProductId: 1, Quantity: 2), (ProductId: 3, Quantity: 5) },
            basket.SavedItems.Select(i => (i.ProductId, i.Quantity)).ToArray());
    }

    [Fact]
    [Trait("TestCase", "TC-CART-1-14")]
    public async Task TC_CART_1_14_BasketStoredWithoutSavedItemsLoadsWithEmptySavedList()
    {
        var buyerId = NewBuyerId();
        var json = $$"""{"BuyerId":"{{buyerId}}","Items":[{"Id":"a1","ProductId":2,"ProductName":"Basecamp Mug","UnitPrice":10.0,"OldUnitPrice":0,"Quantity":1,"PictureUrl":""}]}""";
        await fixture.Connection.GetDatabase().StringSetAsync($"/basket/{buyerId}", json);

        var basket = await CreateRepository().GetBasketAsync(buyerId);

        Assert.NotNull(basket);
        var item = Assert.Single(basket.Items);
        Assert.Equal(2, item.ProductId);
        Assert.Equal(1, item.Quantity);
        Assert.NotNull(basket.SavedItems);
        Assert.Empty(basket.SavedItems);
    }
}
