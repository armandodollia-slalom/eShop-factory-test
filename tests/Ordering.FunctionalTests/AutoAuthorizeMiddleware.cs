namespace eShop.Ordering.FunctionalTests;

class AutoAuthorizeMiddleware
{
    public const string IDENTITY_ID = "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00";

    // Optional request header naming the user to authenticate as; requests without it run as IDENTITY_ID.
    public const string USER_HEADER = "x-test-user";

    private readonly RequestDelegate _next;

    public AutoAuthorizeMiddleware(RequestDelegate rd)
    {
        _next = rd;
    }

    public async Task Invoke(HttpContext httpContext)
    {
        var identity = new ClaimsIdentity("cookies");
        string userId = httpContext.Request.Headers[USER_HEADER];
        if (string.IsNullOrEmpty(userId))
        {
            userId = IDENTITY_ID;
        }

        identity.AddClaim(new Claim("sub", userId));
        identity.AddClaim(new Claim("unique_name", userId));
        identity.AddClaim(new Claim(ClaimTypes.Name, userId));

        httpContext.User.AddIdentity(identity);

        await _next.Invoke(httpContext);
    }
}
