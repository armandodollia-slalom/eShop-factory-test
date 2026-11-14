using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace eShop.Basket.FunctionalTests;

/// <summary>
/// Stands in for the JWT bearer scheme. A request carrying <see cref="SubjectHeader"/> is authenticated as that
/// user, with one <c>scope</c> claim per <see cref="ScopeHeader"/> entry (an entry may itself hold spaces, as a
/// single space-separated <c>scope</c> claim). A request without it gets no result, so it stays anonymous.
/// </summary>
public sealed class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "Test";
    public const string SubjectHeader = "x-test-sub";
    public const string ScopeHeader = "x-test-scope";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var subject = Request.Headers[SubjectHeader].ToString();
        if (string.IsNullOrEmpty(subject))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var claims = new List<Claim> { new("sub", subject) };
        // Repeated headers may arrive folded into one comma-separated value; scope names never contain commas.
        claims.AddRange(Request.Headers[ScopeHeader]
            .SelectMany(value => (value ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Select(scope => new Claim("scope", scope)));

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName));
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName)));
    }
}
