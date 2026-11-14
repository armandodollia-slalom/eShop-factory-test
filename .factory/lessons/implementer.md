# Lessons: implementer

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the implementer's instructions on every run.

## L1: Trace each failure path through the whole pipeline before finishing
<!-- category: pr-check-flow; subtype: ; added: 2026-11-14 -->

For every error, not-found or rejected outcome you add, follow it through the behaviors, handlers and callers around it and check three things: nothing is committed for an operation that failed (idempotency or request-id rows, transactions); a new catch only covers the failures the story names, not exceptions from the surrounding pipeline; and an optional secondary call (such as a "more from this brand" section) cannot break the primary page, and its task is awaited or observed on every exit.

- Bad: `catch (Exception)` around the whole `Mediator.Send`, so outer-pipeline faults return 200; a 404 path that still lets the transaction behavior commit the request-id row; a brand-mates task left unawaited when the item lookup throws.
- Good: catch only the domain exception inside the inner handler; roll back or skip recording the request id when the handler returns false; wrap the optional call in its own try/catch and await it in a `finally` or before the primary lookup throws.

## L2: Return problem details through the Problem result so the content type is `application/problem+json`
<!-- category: product-bug; subtype: ; added: 2026-11-14 -->

When a story or `ProducesResponseType` says "problem details" or a validation problem, return `TypedResults.Problem(...)` (with the status code), not `TypedResults.BadRequest<ProblemDetails>(...)` or `Conflict<ProblemDetails>(...)`, which serialize as `application/json`. Keep the regenerated OpenAPI documents consistent with what the runtime sends.

- Bad: `return TypedResults.BadRequest(new ProblemDetails { Detail = "Count must be between 1 and 12" });`
- Good: `return TypedResults.Problem("Count must be between 1 and 12", statusCode: StatusCodes.Status400BadRequest);`

## L3: Match the neighbouring code's style in the same file before finishing
<!-- category: pr-check-style; subtype: ; added: 2026-11-14 -->

Open the nearest existing method in the same file and copy its shape. Check: the same call form (named `detail:` argument and wrapped arguments for `TypedResults.Problem`, no long one-line calls); no duplicated serialize-and-write or lookup lines (call the existing helper); no `bool` flag parameter whose only use is choosing a message (pass the message or write two small methods); no whitespace-only, BOM or re-indent hunks in lines you did not change; `nameof` kept where it was; no public constants used only locally; run `dotnet format` over the files you touched. If you refresh a generated file (EF snapshot), say so in the summary. Never edit applied migrations or other generated files by hand: add a new migration and regenerate.

- Bad: `TypedResults.Problem("Unknown brand 999", statusCode: StatusCodes.Status400BadRequest)` where the neighbours use `TypedResults.Problem(detail: "...", statusCode: 500)`.
- Good: the same wrapped, named-argument form as the neighbours.

## L4: Keep UI changes to the story, share the existing styles, and leave room below sections
<!-- category: pr-check-design; subtype: ; added: 2026-11-14 -->

When you add a column, section or button to an existing page: do not restyle cells or breakpoints the story did not name (check the phone-width layout at 390px: header labels must line up over their values and rows must wrap the same way); give the new element the same markup and icon as its existing twin (a Remove button next to another Remove button shows the same trash icon); check desktop width for a new column making an existing cell wrap onto two lines; and when you add a section below an existing block, drop the old block's bottom padding or margin so there is no large empty gap. Use the existing type tokens, not hard-coded font sizes. Look at the page at both widths before you finish.

- Bad: five fixed columns at 480px that shrink every cell; a plain-text Remove beside an icon Remove; 4rem padding above the new "Saved for later" heading.
- Good: the new column added to the existing grid template for both header and rows; the same `cart-remove` markup with its icon; section spacing a single `1.5rem`.
