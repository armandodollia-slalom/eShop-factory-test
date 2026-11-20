using System.Text;

namespace eShop.Basket.FunctionalTests;

[Collection(RedisCollection.Name)]
[Trait("Story", "GIFT-1")]
public sealed class Gift1Tests(RedisFixture fixture)
{
    private const string GiftMessage = "Happy birthday, Sam!";

    [Fact]
    [Trait("TestCase", "TC-GIFT-1-11")]
    public async Task TC_GIFT_1_11_RedisKeepsGiftMessageAcrossSaveAndLoad()
    {
        var repository = new RedisBasketRepository(NullLogger<RedisBasketRepository>.Instance, fixture.Connection);
        var buyerId = $"buyer-{Guid.NewGuid():N}";
        Assert.Null(await repository.GetBasketAsync(buyerId));

        await repository.UpdateBasketAsync(new CustomerBasket
        {
            BuyerId = buyerId,
            Items =
            [
                new BasketItem { ProductId = 99, Quantity = 2, GiftMessage = GiftMessage },
                new BasketItem { ProductId = 1, Quantity = 1, GiftMessage = null },
            ]
        });
        var loaded = await repository.GetBasketAsync(buyerId);

        Assert.NotNull(loaded);
        Assert.Equal(2, loaded.Items.Count);
        var withMessage = loaded.Items.Single(i => i.ProductId == 99);
        Assert.Equal(2, withMessage.Quantity);
        Assert.Equal(GiftMessage, withMessage.GiftMessage);
        var withoutMessage = loaded.Items.Single(i => i.ProductId == 1);
        Assert.Equal(1, withoutMessage.Quantity);
        Assert.Null(withoutMessage.GiftMessage);
    }

    [Fact]
    [Trait("TestCase", "TC-GIFT-1-12")]
    public async Task TC_GIFT_1_12_BasketStoredWithoutGiftMessageFieldStillLoads()
    {
        var buyerId = $"legacy-{Guid.NewGuid():N}";
        var legacyJson =
            $$"""{"BuyerId":"{{buyerId}}","Items":[{"Id":"1","ProductId":99,"ProductName":"Adventurer GPS Watch","UnitPrice":10.0,"OldUnitPrice":0,"Quantity":2,"PictureUrl":null}]}""";
        Assert.DoesNotContain("GiftMessage", legacyJson);
        await fixture.Connection.GetDatabase().StringSetAsync($"/basket/{buyerId}", Encoding.UTF8.GetBytes(legacyJson));
        var repository = new RedisBasketRepository(NullLogger<RedisBasketRepository>.Instance, fixture.Connection);

        var loaded = await repository.GetBasketAsync(buyerId);

        Assert.NotNull(loaded);
        Assert.Equal(buyerId, loaded.BuyerId);
        var item = Assert.Single(loaded.Items);
        Assert.Equal(99, item.ProductId);
        Assert.Equal(2, item.Quantity);
        Assert.Null(item.GiftMessage);
    }
}
