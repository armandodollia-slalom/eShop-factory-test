using eShop.Basket.API.Grpc;
using Google.Protobuf;
using Grpc.Core;
using Grpc.Net.Client;
using GrpcBasketItem = eShop.Basket.API.Grpc.BasketItem;

namespace eShop.Basket.FunctionalTests;

/// <summary>
/// A client for <c>BasketApi.Basket</c>. Basket.API generates only the server side of basket.proto, so the
/// methods are declared here over its message types. A caller given as a subject sends the
/// <see cref="TestAuthHandler"/> headers; a null subject sends no authorization metadata at all.
/// </summary>
public sealed class BasketGrpcClient(GrpcChannel channel)
{
    private const string ServiceName = "BasketApi.Basket";

    private static readonly Method<GetBasketRequest, CustomerBasketResponse> GetBasketMethod =
        Unary<GetBasketRequest, CustomerBasketResponse>("GetBasket", GetBasketRequest.Parser, CustomerBasketResponse.Parser);
    private static readonly Method<UpdateBasketRequest, CustomerBasketResponse> UpdateBasketMethod =
        Unary<UpdateBasketRequest, CustomerBasketResponse>("UpdateBasket", UpdateBasketRequest.Parser, CustomerBasketResponse.Parser);
    private static readonly Method<DeleteBasketRequest, DeleteBasketResponse> DeleteBasketMethod =
        Unary<DeleteBasketRequest, DeleteBasketResponse>("DeleteBasket", DeleteBasketRequest.Parser, DeleteBasketResponse.Parser);

    private readonly CallInvoker _invoker = channel.CreateCallInvoker();

    public Task<CustomerBasketResponse> GetBasketAsync(string? subject, params string[] scopes) =>
        CallAsync(GetBasketMethod, new GetBasketRequest(), subject, scopes);

    public Task<CustomerBasketResponse> UpdateBasketAsync(int productId, int quantity, string? subject, params string[] scopes)
    {
        var request = new UpdateBasketRequest();
        request.Items.Add(new GrpcBasketItem { ProductId = productId, Quantity = quantity });
        return CallAsync(UpdateBasketMethod, request, subject, scopes);
    }

    public Task<DeleteBasketResponse> DeleteBasketAsync(string? subject, params string[] scopes) =>
        CallAsync(DeleteBasketMethod, new DeleteBasketRequest(), subject, scopes);

    private async Task<TResponse> CallAsync<TRequest, TResponse>(Method<TRequest, TResponse> method, TRequest request, string? subject, string[] scopes)
        where TRequest : class
        where TResponse : class
    {
        var headers = new Metadata();
        if (subject is not null)
        {
            headers.Add(TestAuthHandler.SubjectHeader, subject);
            foreach (var scope in scopes)
            {
                headers.Add(TestAuthHandler.ScopeHeader, scope);
            }
        }

        return await _invoker.AsyncUnaryCall(method, null, new CallOptions(headers, cancellationToken: TestContext.Current.CancellationToken), request);
    }

    private static Method<TRequest, TResponse> Unary<TRequest, TResponse>(string name, MessageParser<TRequest> requestParser, MessageParser<TResponse> responseParser)
        where TRequest : class, IMessage<TRequest>
        where TResponse : class, IMessage<TResponse> =>
        new(MethodType.Unary, ServiceName, name,
            Marshallers.Create(message => message.ToByteArray(), requestParser.ParseFrom),
            Marshallers.Create(message => message.ToByteArray(), responseParser.ParseFrom));
}
