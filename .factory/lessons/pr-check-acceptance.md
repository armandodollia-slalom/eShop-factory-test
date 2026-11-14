# Lessons: pr-check-acceptance

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the PR check acceptance critic's instructions on every run.

## L1: Report only gaps against what the story actually states
<!-- category: dismissed-finding; subtype: ; added: 2026-11-14 -->

Before raising a finding, check the story text, its Implementation Notes and Deviations: do not report an acceptance item whose files or scenarios the story says do not exist in this repository, a response-body format or detail text the story leaves unspecified (a plain ProblemDetails satisfies "a validation problem" when neighbouring endpoints do the same), or a deviation the story already records. Plan-text mismatches and video defects belong to the flow, style and video critics; if another lens already covers the same frame or cause, do not repeat it.

- Bad: "The scenario is named bug-7, not basket-edge" when the story notes that scenario does not exist here.
- Good: cite the exact acceptance sentence that the diff fails; stay silent where the story is silent.
