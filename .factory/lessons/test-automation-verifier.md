# Lessons: test-automation-verifier

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the test-automation-verifier agent's instructions on every run.

## L1: Check test code style before scoring 10
<!-- category: passed-but-upheld; subtype: style; added: 2026-11-14 -->

The PR check later upheld style findings on tests you passed. Before scoring 10, open one neighbouring test file and check each new test file against it for: inline fully qualified type names where a `using` exists; explicit `using` directives that `ImplicitUsings` already provides (for example `System.Threading`); private helpers placed between test methods instead of at the end of the class; helpers duplicated apart from one parameter; scenarios looped in one test instead of `DataRow`/`Theory`; auth or token blocks copy-pasted from a sibling spec instead of using a shared helper in `e2e/teststack`; inconsistent `BASE_URL` handling; and scenario names in specs or plans that do not exist in the repository. List each as a gap.

## L2: Check that videos show what each case asserts before scoring 10
<!-- category: passed-but-upheld; subtype: video; added: 2026-11-14 -->

The PR check upheld video findings on tests you passed. For each UI case open its keyframes and fail the case if: a signed-in case shows no signed-in marker; a click is asserted but the clicked element or the destination title/URL never appears; an absence frame shows the page top instead of the area where the element would be; a "nothing created" case never shows the list or API result; the closing frame is rendered at half width or the asserted text (empty-cart message, totals) is scrolled out of view. Name the keyframe you opened for every UI case.
