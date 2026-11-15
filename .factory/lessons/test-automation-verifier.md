# Lessons: test-automation-verifier

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the test-automation-verifier agent's instructions on every run.

## L1: Check test code style before scoring 10
<!-- category: passed-but-upheld; subtype: style; added: 2026-11-14 -->

The PR check later upheld style findings on tests you passed. Before scoring 10, check each new test file for: inline fully qualified type names where a `using` exists; `using` directives already supplied by implicit usings (`System.Threading`, `System.Linq`); helpers duplicated apart from one parameter, or the same setup block (such as token acquisition) copied from a sibling spec instead of reusing a shared helper under `e2e/`; scenarios looped in a single test instead of `DataRow`/`InlineData`; private helpers placed between test methods when neighbouring files keep them at the end; inconsistent `BASE_URL` handling versus the neighbouring spec; and scenario names in specs or plans that do not exist in the repository. List each as a gap.

## L2: Open the frames and check that the video shows what the case asserts
<!-- category: passed-but-upheld; subtype: video; added: 2026-11-14 -->

The PR check upheld video findings on tests you passed. For every UI case, open the keyframes and confirm that the frame itself shows the evidence, not only that the code asserts it:

- A signed-in case shows something that marks the session (the account icon or name, a "Add to shopping bag" instead of "Log in to purchase" button), not just the page.
- A click or navigation case shows the destination (its title or URL), not only the changed content.
- An absence callout (`demo.absent`) is framed on the region where the missing element would appear, scrolled into view, not on the heading above it.
- A "nothing was created" or "state unchanged" case shows the page that proves it (orders list, read-back), not only the error message.
- The final state is readable: full-page frames fill the frame, and the message or total the spec asserts is in view.

List each miss as a gap with the frame name. Do not score 10 on a frame you did not open.
