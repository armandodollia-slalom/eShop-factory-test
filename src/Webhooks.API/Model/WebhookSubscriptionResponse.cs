using System.Globalization;

namespace Webhooks.API.Model;

public class WebhookSubscriptionResponse
{
    private const int VisibleTokenCharacters = 4;
    private const string Ellipsis = "…";

    public int Id { get; set; }

    public WebhookType Type { get; set; }
    public DateTime Date { get; set; }
    public string DestUrl { get; set; }
    public string TokenHint { get; set; }
    public string UserId { get; set; }

    public static WebhookSubscriptionResponse FromSubscription(WebhookSubscription subscription) => new()
    {
        Id = subscription.Id,
        Type = subscription.Type,
        Date = subscription.Date,
        DestUrl = subscription.DestUrl,
        TokenHint = GetTokenHint(subscription.Token),
        UserId = subscription.UserId
    };

    // The token is the shared secret sent with every webhook call, so only its end is ever returned.
    public static string GetTokenHint(string token)
    {
        if (string.IsNullOrEmpty(token))
        {
            return null;
        }

        // Count text elements, not UTF-16 code units, so a surrogate pair or combining sequence is never split.
        var characters = new StringInfo(token);
        return characters.LengthInTextElements > VisibleTokenCharacters
            ? Ellipsis + characters.SubstringByTextElements(characters.LengthInTextElements - VisibleTokenCharacters)
            : Ellipsis;
    }
}
