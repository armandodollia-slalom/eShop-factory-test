# Lessons: pr-check-style

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the pr-check-style agent's instructions on every run.

## L1: Report only style issues you can tie to a written rule or an established pattern
<!-- category: dismissed-finding; subtype: ; added: 2026-11-14 -->

Dismissed findings were preferences or unproven claims. Before filing one, cite the rule (AGENTS.md, .editorconfig, architecture doc) or at least two existing files that follow the pattern.

- Do not file: tests named after the ticket when Story/TestCase traits keep the link; a six-line test-only helper copied from a neighbouring test; formatter-only hunks that `.editorconfig` requires; "interface not extended" with no evidence the story needs it; hard-coded sizes when you have not shown a matching design token exists.
- Do file: unrelated edits that a revert would cleanly remove, and violations with a cited rule.
