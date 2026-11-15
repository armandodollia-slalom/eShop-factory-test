# Lessons: implementer

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the implementer's instructions on every run.

## L1: Trace each failure path and each new entry point through the whole flow before finishing
<!-- category: pr-check-flow; subtype: ; added: 2026-11-15 -->

For every error, not-found or rejected outcome you add, and every route, scope or button you add, check:

- **Failed operations commit nothing.** No idempotency or request-id row, no transaction commit, for an operation that failed. A new catch covers only the failures the story names, not exceptions from the surrounding pipeline.
- **Remote calls from the UI cannot crash the page.** An HTTP or gRPC call in a Blazor event handler catches connection failures and timeouts (`HttpRequestException`, `TaskCanceledException`) and shows a message; an optional secondary call cannot break the primary page and its task is awaited on every exit.
- **Repeated clicks are safe.** A button that starts a remote call is disabled while it runs, so a second click cannot turn a success into a false error.
- **What you advertise can be used.** A new scope or audience is added to the `AllowedScopes` of the clients that must call it; a component that exists only to be shown on failure cannot be opened directly with status 200.

- Bad: `catch (Exception)` around the whole `Mediator.Send`; a Remove button that stays enabled during `DeleteWebhookAsync` and lets `HttpRequestException` escape `@onclick`; a `catalog` scope no client may request.
- Good: catch the domain exception in the inner handler; `disabled="@isRemoving"` plus try/catch around the call with a user message; the scope added to the clients' `AllowedScopes` in `Config.cs`.

## L2: Return problem details through the Problem result so the content type is `application/problem+json`
<!-- category: product-bug; subtype: ; added: 2026-11-14 -->

When a story or `ProducesResponseType` says "problem details" or a validation problem, return `TypedResults.Problem(...)` (with the status code), not `TypedResults.BadRequest<ProblemDetails>(...)` or `Conflict<ProblemDetails>(...)`, which serialize as `application/json`. Keep the regenerated OpenAPI documents consistent with what the runtime sends.

- Bad: `return TypedResults.BadRequest(new ProblemDetails { Detail = "Count must be between 1 and 12" });`
- Good: `return TypedResults.Problem("Count must be between 1 and 12", statusCode: StatusCodes.Status400BadRequest);`

## L3: Reuse what the code already has instead of copying it
<!-- category: pr-check-style; subtype: ; added: 2026-11-15 -->

Before you write markup, CSS or a helper, search for the same thing in the neighbouring pages. Upheld findings keep naming the same copies:

- **CSS:** rules copied from another page's `*.razor.css` (row layout, status badges, back links). Move the shared rules to `src/WebApp/wwwroot/css/app.css` or a shared component, and keep only page-specific rules in the scoped file.
- **Markup:** the same anchor or block in two components becomes a shared component (`src/WebApp/Components/...` or `src/WebAppComponents`).
- **Data and logic:** when you add a lookup (a `SortOptions` dictionary), render the list from it too, instead of hard-coding the same labels and `aria-selected` ternaries.
- **No double work, smallest visibility:** do not trim or normalize the same value twice; keep helpers `private` unless something outside uses them.

Then run `dotnet format eShop.Web.slnf --verify-no-changes --include <files>` on the files you changed and say in your summary that it passed.
