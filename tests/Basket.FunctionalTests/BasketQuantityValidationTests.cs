using System.Security.Claims;
using eShop.Basket.API.Grpc;
using Grpc.Core;
using Microsoft.AspNetCore.Http;
using GrpcBasketItem = eShop.Basket.API.Grpc.BasketItem;

namespace eShop.Basket.FunctionalTests;

[Collection(RedisCollection.Name)]
[Trait("Story", "BUG-8")]
public sealed class BasketQuantityValidationTests(RedisFixture fixture)
{
    [Fact]
    [Trait("TestCase", "TC-BUG-8-08")]
    public async Task TC_BUG_8_08_RejectedUpdateLeavesExistingRedisBasketUntouched()
    {
        // Own buyer id so the shared Redis is not affected; the case's "alice" is the caller identity.
        var buyerId = $"alice-{Guid.NewGuid():N}";
        var service = new BasketService(
            new RedisBasketRepository(NullLogger<RedisBasketRepository>.Instance, fixture.Connection),
            NullLogger<BasketService>.Instance);
        var context = new FakeServerCallContext(buyerId);

        await service.UpdateBasket(CreateRequest((5, 2)), context);

        var exception = await Assert.ThrowsAsync<RpcException>(() =>
            service.UpdateBasket(CreateRequest((7, -3), (6, 0)), context));
        Assert.Equal(StatusCode.InvalidArgument, exception.StatusCode);

        var basket = await service.GetBasket(new GetBasketRequest(), context);
        var item = Assert.Single(basket.Items);
        Assert.Equal(5, item.ProductId);
        Assert.Equal(2, item.Quantity);
        Assert.DoesNotContain(basket.Items, i => i.ProductId is 7 or 6);
    }

    private static UpdateBasketRequest CreateRequest(params (int ProductId, int Quantity)[] items)
    {
        var request = new UpdateBasketRequest();
        foreach (var (productId, quantity) in items)
        {
            request.Items.Add(new GrpcBasketItem { ProductId = productId, Quantity = quantity });
        }

        return request;
    }

    private sealed class FakeServerCallContext : ServerCallContext
    {
        private readonly Dictionary<object, object> _userState = new();

        public FakeServerCallContext(string userId)
        {
            var httpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", userId)]))
            };
            _userState["__HttpContext"] = httpContext;
        }

        protected override string MethodCore => "MethodName";
        protected override string HostCore => "HostName";
        protected override string PeerCore => "PeerName";
        protected override DateTime DeadlineCore => DateTime.MaxValue;
        protected override Metadata RequestHeadersCore => new();
        protected override CancellationToken CancellationTokenCore => CancellationToken.None;
        protected override Metadata ResponseTrailersCore => new();
        protected override Status StatusCore { get; set; }
        protected override WriteOptions? WriteOptionsCore { get; set; }
        protected override AuthContext AuthContextCore => new(string.Empty, new Dictionary<string, List<AuthProperty>>());
        protected override IDictionary<object, object> UserStateCore => _userState;

        protected override ContextPropagationToken CreatePropagationTokenCore(ContextPropagationOptions? options) =>
            throw new NotImplementedException();

        protected override Task WriteResponseHeadersAsyncCore(Metadata responseHeaders) => Task.CompletedTask;
    }
}
