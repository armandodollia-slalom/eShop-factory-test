---
id: TC-BUG-10-17
type: sad
sad-path: not-found
layer: unit
covers: ["Decisions: existing unit tests now assert 404"]
priority: P2
---

# TC-BUG-10-17: A false command result from the mediator returns a 404 problem

## Why

- Replaces unit tests Cancel_order_returns_problem_when_command_fails / Ship_order_returns_problem_when_command_fails, which now assert 404 instead of 500 (intended change).

## Preconditions

- Mediator mock returning false for the identified command.

## Steps

1. Call `CancelOrderAsync` and `ShipOrderAsync` with a non-empty request id.

## Expected result

- Each returns a ProblemHttpResult with StatusCode 404.
