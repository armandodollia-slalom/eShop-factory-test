# Lessons: pr-check-video

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the pr-check-video agent's instructions on every run.

## L1: Check all frames and the repository's own conventions before raising a video finding
<!-- category: dismissed-finding; subtype: ; added: 2026-11-14 -->

Dismissed video findings came from reading too few frames or from judging against the wrong baseline. Before raising one:

- Open the frames before and after the one you doubt (the item named in an earlier frame, a "Log in to purchase" button in the next frame); say what each shows. Do not claim a product or state is never shown until you have read the neighbouring frames.
- When the story's API half is covered by a spec that reads the stored value (`GET /api/orders/{id}`), do not ask the UI video to show it again.
- Compare a message or layout with `origin/main` first: if the page already renders it that way (a validation text shown by both the summary and the field), it is not a regression of this PR.
- Seeding another user's data in the scenario is valid setup; only the observed user's view needs to appear.
- When the PR description is not available (the check runs on a branch with no pull request), do not raise a finding that no file on the branch can fix.

Still raise: a missing marker of signed-in state, a click or destination never shown, an absence callout aimed at the wrong region, and error pages or broken images in a frame.
