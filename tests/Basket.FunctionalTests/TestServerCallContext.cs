using System.Security.Claims;
using Grpc.Core;
using Microsoft.AspNetCore.Http;

namespace eShop.Basket.FunctionalTests;

/// <summary>
/// A <see cref="ServerCallContext"/> for calling a gRPC service in process. The service reads the caller from the
/// <see cref="HttpContext"/> kept in user state <c>__HttpContext</c>, the way Grpc.AspNetCore stores it.
/// </summary>
public sealed class TestServerCallContext : ServerCallContext
{
    private readonly Dictionary<object, object> _userState = [];
    private readonly Metadata _requestHeaders = [];
    private readonly Metadata _responseTrailers = [];
    private readonly CancellationToken _cancellationToken;

    private TestServerCallContext(HttpContext httpContext, CancellationToken cancellationToken)
    {
        _userState["__HttpContext"] = httpContext;
        _cancellationToken = cancellationToken;
    }

    /// <summary>A call whose user has the claim <c>sub</c> = <paramref name="userId"/>, or no claims when it is null.</summary>
    public static TestServerCallContext ForUser(string? userId, CancellationToken cancellationToken = default)
    {
        var httpContext = new DefaultHttpContext();
        if (userId is not null)
        {
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", userId)]));
        }

        return new TestServerCallContext(httpContext, cancellationToken);
    }

    protected override string MethodCore => "MethodName";
    protected override string HostCore => "HostName";
    protected override string PeerCore => "PeerName";
    protected override DateTime DeadlineCore => DateTime.MaxValue;
    protected override Metadata RequestHeadersCore => _requestHeaders;
    protected override CancellationToken CancellationTokenCore => _cancellationToken;
    protected override Metadata ResponseTrailersCore => _responseTrailers;
    protected override Status StatusCore { get; set; }
    protected override WriteOptions? WriteOptionsCore { get; set; }
    protected override AuthContext AuthContextCore { get; } = new(string.Empty, []);
    protected override IDictionary<object, object> UserStateCore => _userState;

    protected override ContextPropagationToken CreatePropagationTokenCore(ContextPropagationOptions? options) =>
        throw new NotSupportedException();

    protected override Task WriteResponseHeadersAsyncCore(Metadata responseHeaders) => Task.CompletedTask;
}
