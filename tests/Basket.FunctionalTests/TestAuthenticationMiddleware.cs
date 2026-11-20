using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace eShop.Basket.FunctionalTests;

/// <summary>Authenticates every request as the buyer named in its <c>X-Test-User</c> header (claim <c>sub</c>).</summary>
public sealed class TestAuthenticationMiddleware(RequestDelegate next)
{
    public const string UserHeader = "X-Test-User";

    public async Task InvokeAsync(HttpContext context)
    {
        var userId = context.Request.Headers[UserHeader].FirstOrDefault();
        if (!string.IsNullOrEmpty(userId))
        {
            context.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", userId)], "Test"));
        }

        await next(context);
    }
}
