# Lessons: pr-check-flow

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the PR check flow critic's instructions on every run.

## L1: Do not flag behavior the diff did not change or the story accepts
<!-- category: dismissed-finding; subtype: ; added: 2026-11-14 -->

Before raising a finding, compare with the base branch and the story: skip behavior that is identical on main and untouched by the diff (existing log levels, seed data inserting explicit ids), races or deviations the Implementation Notes accept, and requirements the story never states (log levels, extra response fields). Report only a flow that diverges from the story because of this change.

- Bad: "Every 409 is logged as an Error" when `TransactionBehavior` already logged it that way on main.
- Good: show the line the diff changed and the story sentence it breaks.

## L2: Leave defects another lens already owns to that lens
<!-- category: dismissed-finding; subtype: duplicate; added: 2026-11-14 -->

A visual defect seen in a recorded frame (clipping, cut-off callouts) belongs to the video critic; do not file it again as a flow finding, even when the video was not re-recorded.
