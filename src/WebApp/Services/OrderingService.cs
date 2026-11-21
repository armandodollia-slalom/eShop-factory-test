using System.Net;

namespace eShop.WebApp.Services;

public class OrderingService(HttpClient httpClient)
{
    private readonly string remoteServiceBaseUrl = "/api/Orders/";

    public Task<OrderRecord[]> GetOrders()
    {
        return httpClient.GetFromJsonAsync<OrderRecord[]>(remoteServiceBaseUrl)!;
    }

    public async Task<OrderDetailRecord?> GetOrder(int orderNumber)
    {
        using var response = await httpClient.GetAsync($"{remoteServiceBaseUrl}{orderNumber}");
        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<OrderDetailRecord>();
    }

    public Task CreateOrder(CreateOrderRequest request, Guid requestId)
    {
        var requestMessage = new HttpRequestMessage(HttpMethod.Post, remoteServiceBaseUrl);
        requestMessage.Headers.Add("x-requestid", requestId.ToString());
        requestMessage.Content = JsonContent.Create(request);
        return httpClient.SendAsync(requestMessage);
    }
}

public record OrderRecord(
    int OrderNumber,
    DateTime Date,
    string Status,
    decimal Total);

public record OrderDetailRecord(
    int OrderNumber,
    DateTime Date,
    string Status,
    string Street,
    string City,
    string State,
    string Zipcode,
    string Country,
    List<OrderItemRecord> OrderItems,
    decimal Total);

public record OrderItemRecord(
    string ProductName,
    int Units,
    decimal UnitPrice);
