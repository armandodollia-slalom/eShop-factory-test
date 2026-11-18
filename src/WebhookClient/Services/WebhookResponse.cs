namespace eShop.WebhookClient.Services;

public class WebhookResponse
{
    public DateTime Date { get; set; }
    public string? DestUrl { get; set; }
    public string? TokenHint { get; set; }
}
