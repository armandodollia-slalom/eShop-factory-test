## L1: Check test code style and naming before scoring 10
<!-- category: passed-but-upheld; subtype: style; added: 2026-11-13 -->

The PR check upheld style findings in tests you passed. Before scoring 10, scan each test file for: fully qualified names where a `using` exists, near-duplicate helpers, looped scenarios instead of `DataRow`/`test.each`, inconsistent nullable handling next to a sibling spec, and plan or scenario names that do not match the implemented scenario. List each as a gap.

- Bad: score 10 with `OrderingApiFixture` writing the full namespace three times.
- Good: gap "use a using directive (lines 44, 69-73)".
