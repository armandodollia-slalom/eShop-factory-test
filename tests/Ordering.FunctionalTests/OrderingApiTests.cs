using System.Net;
using System.Text;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Ordering.API.Application.Commands;
using eShop.Ordering.API.Application.Models;
using eShop.Ordering.API.Application.Queries;
using Microsoft.AspNetCore.Mvc.Testing;

namespace eShop.Ordering.FunctionalTests;

public sealed class OrderingApiTests : IClassFixture<OrderingApiFixture>
{
    private const string DraftRequestId = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
    private const string ItemRequiredDetail = "An order draft requires at least one item.";
    private const string SingleItemDraftJson = """{"buyerId":"b1","items":[{"id":"i1","productId":1,"productName":"Test Product 1","unitPrice":10.2,"oldUnitPrice":9.8,"quantity":2,"pictureUrl":"p1"}]}""";
    private const string ProblemJson = "application/problem+json";

    private readonly WebApplicationFactory<Program> _webApplicationFactory;
    private readonly HttpClient _httpClient;

    public OrderingApiTests(OrderingApiFixture fixture)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));

        _webApplicationFactory = fixture;
        _httpClient = _webApplicationFactory.CreateDefaultClient(handler);
    }

    [Fact]
    public async Task GetAllStoredOrdersWorks()
    {
        // Act
        var response = await _httpClient.GetAsync("api/orders", TestContext.Current.CancellationToken);
        var s = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CancelWithEmptyGuidFails()
    {
        // Act
        var content = new StringContent(BuildOrder(), UTF8Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", Guid.Empty.ToString() } }
        };
        var response = await _httpClient.PutAsync("/api/orders/cancel", content, TestContext.Current.CancellationToken);
        var s = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CancelNonExistentOrderFails()
    {
        // Act
        var content = new StringContent(BuildOrder(), UTF8Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", Guid.NewGuid().ToString() } }
        };
        var response = await _httpClient.PutAsync("api/orders/cancel", content, TestContext.Current.CancellationToken);
        var s = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        // Assert
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task ShipWithEmptyGuidFails()
    {
        // Act
        var content = new StringContent(BuildOrder(), UTF8Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", Guid.Empty.ToString() } }
        };
        var response = await _httpClient.PutAsync("api/orders/ship", content, TestContext.Current.CancellationToken);
        var s = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ShipNonExistentOrderFails()
    {
        // Act
        var content = new StringContent(BuildOrder(), UTF8Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", Guid.NewGuid().ToString() } }
        };
        var response = await _httpClient.PutAsync("api/orders/ship", content, TestContext.Current.CancellationToken);

        // Assert
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task GetAllOrdersCardType()
    {
        // Act 1
        var response = await _httpClient.GetAsync("api/orders/cardtypes", TestContext.Current.CancellationToken);
        var s = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetStoredOrdersWithOrderId()
    {
        // Act
        var response = await _httpClient.GetAsync("api/orders/1", TestContext.Current.CancellationToken);
        var responseStatus = response.StatusCode;

        // Assert
        Assert.Equal("NotFound", responseStatus.ToString());
    }

    [Fact]
    public async Task AddNewEmptyOrder()
    {
        // Act
        var content = new StringContent(JsonSerializer.Serialize(new Order()), UTF8Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", Guid.Empty.ToString() } }
        };
        var response = await _httpClient.PostAsync("api/orders", content, TestContext.Current.CancellationToken);
        var s = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddNewOrder()
    {
        // Act
        var item = new BasketItem
        {
            Id = "1",
            ProductId = 12,
            ProductName = "Test",
            UnitPrice = 10,
            OldUnitPrice = 9,
            Quantity = 1,
            PictureUrl = null
        };
        var cardExpirationDate = Convert.ToDateTime("2023-12-22T12:34:24.334Z");
        var OrderRequest = new CreateOrderRequest("1", "TestUser", null, null, null, null, null, "XXXXXXXXXXXX0005", "Test User", cardExpirationDate, "test buyer", 1, null, new List<BasketItem> { item });
        var content = new StringContent(JsonSerializer.Serialize(OrderRequest), UTF8Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", Guid.NewGuid().ToString() } }
        };
        var response = await _httpClient.PostAsync("api/orders", content, TestContext.Current.CancellationToken);
        var s = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task PostDraftOrder()
    {
        // Act
        var item = new BasketItem
        {
            Id = "1",
            ProductId = 12,
            ProductName = "Test",
            UnitPrice = 10,
            OldUnitPrice = 9,
            Quantity = 1,
            PictureUrl = null
        };
        var bodyContent = new CustomerBasket("1", new List<BasketItem> { item });
        var content = new StringContent(JsonSerializer.Serialize(bodyContent), UTF8Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", Guid.NewGuid().ToString() } }
        };
        var response = await _httpClient.PostAsync("api/orders/draft", content, TestContext.Current.CancellationToken);
        var s = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CreateOrderDraftSucceeds()
    {
        var payload = FakeOrderDraftCommand();
        var content = new StringContent(JsonSerializer.Serialize(FakeOrderDraftCommand()), UTF8Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", Guid.NewGuid().ToString() } }
        };
        var response = await _httpClient.PostAsync("api/orders/draft", content, TestContext.Current.CancellationToken);

        var s = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var responseData = JsonSerializer.Deserialize<OrderDraftDTO>(s, new JsonSerializerOptions() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(payload.Items.Count(), responseData.OrderItems.Count());
        Assert.Equal(payload.Items.Sum(o => o.Quantity * o.UnitPrice), responseData.Total);
        AssertThatOrderItemsAreTheSameAsRequestPayloadItems(payload, responseData);
    }

    private CreateOrderDraftCommand FakeOrderDraftCommand()
    {
        return new CreateOrderDraftCommand(
            BuyerId: Guid.NewGuid().ToString(),
            new List<BasketItem>()
            {
                new BasketItem()
                {
                    Id = Guid.NewGuid().ToString(),
                    ProductId = 1,
                    ProductName = "Test Product 1",
                    UnitPrice = 10.2m,
                    OldUnitPrice = 9.8m,
                    Quantity = 2,
                    PictureUrl = Guid.NewGuid().ToString(),
                }
            });
    }

    private static void AssertThatOrderItemsAreTheSameAsRequestPayloadItems(CreateOrderDraftCommand payload, OrderDraftDTO responseData)
    {
        // check that OrderItems contain all product Ids from the payload
        var payloadItemsProductIds = payload.Items.Select(x => x.ProductId);
        var orderItemsProductIds = responseData.OrderItems.Select(x => x.ProductId);
        Assert.All(orderItemsProductIds, orderItemProdId => payloadItemsProductIds.Contains(orderItemProdId));
        // TODO: might need to add more asserts in here
    }

    [Fact]
    [Trait("Story", "BUG-15")]
    [Trait("TestCase", "TC-BUG-15-01")]
    public async Task TC_BUG_15_01_DraftWithNoBodyReturns400()
    {
        var content = new ByteArrayContent([]);
        content.Headers.ContentType = null;
        content.Headers.Add("x-requestid", DraftRequestId);

        var response = await _httpClient.PostAsync("api/orders/draft", content, TestContext.Current.CancellationToken);

        await AssertItemRequiredProblemAsync(response);
    }

    [Fact]
    [Trait("Story", "BUG-15")]
    [Trait("TestCase", "TC-BUG-15-02")]
    public async Task TC_BUG_15_02_DraftWithJsonNullBodyReturns400()
    {
        var response = await PostDraftAsync("null");

        await AssertItemRequiredProblemAsync(response);
    }

    [Fact]
    [Trait("Story", "BUG-15")]
    [Trait("TestCase", "TC-BUG-15-03")]
    public async Task TC_BUG_15_03_DraftWithNullItemsReturns400()
    {
        var response = await PostDraftAsync("""{"buyerId":"b1","items":null}""");

        await AssertItemRequiredProblemAsync(response);
    }

    [Fact]
    [Trait("Story", "BUG-15")]
    [Trait("TestCase", "TC-BUG-15-04")]
    public async Task TC_BUG_15_04_DraftWithEmptyItemsReturns400()
    {
        var response = await PostDraftAsync("""{"buyerId":"b1","items":[]}""");

        await AssertItemRequiredProblemAsync(response);
    }

    [Fact]
    [Trait("Story", "BUG-15")]
    [Trait("TestCase", "TC-BUG-15-05")]
    public async Task TC_BUG_15_05_DraftWithSingleItemReturns200()
    {
        var response = await PostDraftAsync(SingleItemDraftJson);

        var json = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(json);
        var orderItems = document.RootElement.GetProperty("orderItems");
        Assert.Equal(1, orderItems.GetArrayLength());
        Assert.Equal(1, orderItems[0].GetProperty("productId").GetInt32());
        Assert.Equal(20.4m, document.RootElement.GetProperty("total").GetDecimal());
    }

    private async Task<HttpResponseMessage> PostDraftAsync(string json)
    {
        var content = new StringContent(json, Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", DraftRequestId } }
        };
        return await _httpClient.PostAsync("api/orders/draft", content, TestContext.Current.CancellationToken);
    }

    private static async Task AssertItemRequiredProblemAsync(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
        using var document = JsonDocument.Parse(json);
        Assert.Equal(ItemRequiredDetail, document.RootElement.GetProperty("detail").GetString());
        Assert.Equal(400, document.RootElement.GetProperty("status").GetInt32());
        // No draft is computed: the handler is not invoked, so the body carries no draft fields.
        Assert.False(document.RootElement.TryGetProperty("orderItems", out _));
        Assert.False(document.RootElement.TryGetProperty("total", out _));
    }

    string BuildOrder()
    {
        var order = new
        {
            OrderNumber = "-1"
        };
        return JsonSerializer.Serialize(order);
    }
}
