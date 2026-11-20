using eShop.Basket.API.Grpc;
using Google.Protobuf;
using Grpc.Core;
using Grpc.Net.Client;

namespace eShop.Basket.FunctionalTests;

/// <summary>
/// A gRPC client for the Basket service (package BasketApi, service Basket) over the in-process host. Basket.API
/// generates only the server side of basket.proto, so the client calls are declared here on its message types.
/// </summary>
public sealed class BasketGrpcClient(GrpcChannel channel, string buyerId) : IDisposable
{
    private const string ServiceName = "BasketApi.Basket";

    private static readonly Method<GetBasketRequest, CustomerBasketResponse> GetBasketMethod =
        Unary<GetBasketRequest, CustomerBasketResponse>("GetBasket", GetBasketRequest.Parser, CustomerBasketResponse.Parser);

    private static readonly Method<UpdateBasketRequest, CustomerBasketResponse> UpdateBasketMethod =
        Unary<UpdateBasketRequest, CustomerBasketResponse>("UpdateBasket", UpdateBasketRequest.Parser, CustomerBasketResponse.Parser);

    private readonly CallInvoker _invoker = channel.CreateCallInvoker();

    public async Task<CustomerBasketResponse> GetBasketAsync(GetBasketRequest request) =>
        await _invoker.AsyncUnaryCall(GetBasketMethod, null, Options(), request);

    public async Task<CustomerBasketResponse> UpdateBasketAsync(UpdateBasketRequest request) =>
        await _invoker.AsyncUnaryCall(UpdateBasketMethod, null, Options(), request);

    public void Dispose() => channel.Dispose();

    private CallOptions Options() =>
        new(headers: new Metadata { { TestAuthenticationMiddleware.UserHeader, buyerId } },
            cancellationToken: TestContext.Current.CancellationToken);

    private static Method<TRequest, TResponse> Unary<TRequest, TResponse>(string name, MessageParser<TRequest> requestParser, MessageParser<TResponse> responseParser)
        where TRequest : class, IMessage<TRequest>
        where TResponse : class, IMessage<TResponse> =>
        new(MethodType.Unary, ServiceName, name,
            Marshallers.Create(message => message.ToByteArray(), requestParser.ParseFrom),
            Marshallers.Create(message => message.ToByteArray(), responseParser.ParseFrom));
}
