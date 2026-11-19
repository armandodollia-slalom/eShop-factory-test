namespace eShop.WebhookClient.Services;

public class WebhookResponse
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string? DestUrl { get; set; }
    public string? Token { get; set; }
}
