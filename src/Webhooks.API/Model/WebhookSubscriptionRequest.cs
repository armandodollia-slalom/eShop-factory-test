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

        var isOk = Enum.TryParse(Event, ignoreCase: true, result: out WebhookType whtype);
        // Enum.TryParse accepts any numeric string and ORs comma-separated values ("1,2" -> OrderPaid),
        // so only a single value naming a defined WebhookType member is valid.
        if (!isOk || Event.Contains(',') || !Enum.IsDefined(whtype))
        {
            yield return new ValidationResult($"{Event} is invalid event name", new[] { nameof(Event) });
        }
    }

}
