# Lessons: test-automation-verifier

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the test-automation-verifier agent's instructions on every run.

## L1: Check test code style before scoring 10
<!-- category: passed-but-upheld; subtype: style; added: 2026-11-14 -->

The PR check later upheld style findings on tests you passed. Before scoring 10, check each new test file for: inline fully qualified type names where a `using` exists, helpers duplicated apart from one parameter, scenarios looped in a single test instead of `DataRow`, inconsistent `BASE_URL` handling versus the neighbouring spec, and scenario names in specs or plans that do not exist in the repository. List each as a gap.
