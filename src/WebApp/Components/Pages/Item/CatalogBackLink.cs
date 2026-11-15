using Microsoft.AspNetCore.Components;

namespace eShop.WebApp.Components.Pages.Item;

internal static class CatalogBackLink
{
    // Return the shopper to the catalog they came from, preserving any active
    // brand/type/page filters. The catalog navigation is server rendered, so the
    // Referer header carries the exact filtered URL. Falls back to the catalog
    // root when the referrer is not the filtered catalog (deep link, external
    // navigation, or an unfiltered listing) so behaviour is unchanged there.
    public static string Href(HttpContext? httpContext, NavigationManager nav)
    {
        var referer = httpContext?.Request.Headers.Referer.ToString();
        if (!string.IsNullOrEmpty(referer)
            && Uri.TryCreate(referer, UriKind.Absolute, out var refUri)
            && Uri.TryCreate(nav.BaseUri, UriKind.Absolute, out var baseUri)
            && string.Equals(refUri.Authority, baseUri.Authority, StringComparison.OrdinalIgnoreCase)
            && string.Equals(refUri.AbsolutePath.TrimEnd('/'), baseUri.AbsolutePath.TrimEnd('/'), StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrEmpty(refUri.Query))
        {
            return refUri.PathAndQuery;
        }

        return "";
    }
}
