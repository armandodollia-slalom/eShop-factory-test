namespace eShop.Ordering.FunctionalTests;

class AutoAuthorizeMiddleware
{
    public const string IDENTITY_ID = "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00";

    /// <summary>Request header that makes a test call as another user; without it the call is made as <see cref="IDENTITY_ID"/>.</summary>
    public const string IDENTITY_HEADER = "x-test-identity";

    private readonly RequestDelegate _next;

    public AutoAuthorizeMiddleware(RequestDelegate rd)
    {
        _next = rd;
    }

    public async Task Invoke(HttpContext httpContext)
    {
        var identity = new ClaimsIdentity("cookies");
        var identityId = httpContext.Request.Headers.TryGetValue(IDENTITY_HEADER, out var requested) && !string.IsNullOrEmpty(requested)
            ? requested.ToString()
            : IDENTITY_ID;

        identity.AddClaim(new Claim("sub", identityId));
        identity.AddClaim(new Claim("unique_name", identityId));
        identity.AddClaim(new Claim(ClaimTypes.Name, identityId));

        httpContext.User.AddIdentity(identity);

        await _next.Invoke(httpContext);
    }
}
