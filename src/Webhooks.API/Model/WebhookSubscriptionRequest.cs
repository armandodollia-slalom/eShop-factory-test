namespace Webhooks.API.Model;

public class WebhookSubscriptionRequest : IValidatableObject
{
    public string Url { get; set; }
    public string Token { get; set; }
    public string Event { get; set; }
    public string GrantUrl { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!Uri.IsWellFormedUriString(GrantUrl, UriKind.Absolute))
        {
            yield return new ValidationResult("GrantUrl is not valid", new[] { nameof(GrantUrl) });
        }

        if (!Uri.IsWellFormedUriString(Url, UriKind.Absolute))
        {
            yield return new ValidationResult("Url is not valid", new[] { nameof(Url) });
        }

        // Enum.TryParse also accepts numeric and comma-combined values, so only the defined names are allowed.
        var isOk = Enum.GetNames<WebhookType>().Contains(Event, StringComparer.OrdinalIgnoreCase);
        if (!isOk)
        {
            yield return new ValidationResult($"{Event} is invalid event name", new[] { nameof(Event) });
        }
    }

}
