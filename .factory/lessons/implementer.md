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
