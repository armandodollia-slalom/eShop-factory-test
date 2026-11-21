using Microsoft.AspNetCore.Http.Features;

/// <summary>
/// Marks a page whose response is buffered and sent only once it is fully rendered, so the page can still
/// set its status code when a streaming component in the layout would otherwise start the response early.
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public sealed class BufferResponseAttribute : Attribute;

public static class BufferedResponseExtensions
{
    /// <summary>
    /// Buffers the response of endpoints marked with <see cref="BufferResponseAttribute"/>.
    /// </summary>
    public static IApplicationBuilder UseBufferedResponses(this IApplicationBuilder app) =>
        app.Use(async (context, next) =>
        {
            if (context.GetEndpoint()?.Metadata.GetMetadata<BufferResponseAttribute>() is null)
            {
                await next(context);
                return;
            }

            var originalBody = context.Features.GetRequiredFeature<IHttpResponseBodyFeature>();
            await using var buffer = new MemoryStream();
            context.Features.Set<IHttpResponseBodyFeature>(new StreamResponseBodyFeature(buffer));
            try
            {
                await next(context);
            }
            finally
            {
                context.Features.Set(originalBody);
            }

            context.Response.ContentLength = buffer.Length;
            buffer.Position = 0;
            await buffer.CopyToAsync(originalBody.Stream, context.RequestAborted);
        });
}
