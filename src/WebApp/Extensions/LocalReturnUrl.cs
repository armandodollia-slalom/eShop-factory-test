namespace eShop.WebApp;

public static class LocalReturnUrl
{
    // Returns a local path to navigate to after sign-in, or "/" when the return URL could leave the site.
    // A local path has a single leading '/' not followed by '/' or '\' (the rule of MVC's Url.IsLocalUrl).
    // Base-relative paths such as "item/5", which LogIn.Url produces, are made root-relative first.
    public static string ToLocalOrRoot(string? returnUrl)
    {
        if (string.IsNullOrEmpty(returnUrl) || returnUrl.Any(char.IsControl))
        {
            return "/";
        }

        if (returnUrl[0] != '/')
        {
            if (returnUrl[0] == '\\' || Uri.TryCreate(returnUrl, UriKind.Absolute, out _))
            {
                return "/";
            }

            returnUrl = "/" + returnUrl;
        }

        return IsLocal(returnUrl) ? returnUrl : "/";
    }

    private static bool IsLocal(string url)
        => url[0] == '/' && (url.Length == 1 || (url[1] != '/' && url[1] != '\\'));
}
