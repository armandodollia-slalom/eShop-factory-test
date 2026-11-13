## L1: Do not raise a finding the story's Decisions or a code comment already justify
<!-- category: dismissed-finding; subtype: ; added: 2026-11-13 -->

Read the story's Decisions and Implementation Notes and the comments at the changed code first. A deliberate, documented choice (for example an in-memory ordinal sort for collation independence) is not a style defect.

- Bad: "loads the whole brand and sorts in memory" when a comment cites the story decision.
- Good: no finding.

## L2: Report only convention breaks you can cite
<!-- category: dismissed-finding; subtype: ; added: 2026-11-13 -->

Cite the rule (`.editorconfig` line, AGENTS.md, or at least two neighbouring examples) for every finding. Do not flag expected domain-rule mappings without logging, missing interface extensions, or hard-coded sizes unless you show that the convention or matching token exists. If the diff change is required by `.editorconfig` (such as `new()` brace placement), it is not out of scope.

- Bad: "hard-coded spacing instead of design tokens" with no matching token named.
- Good: "`.editorconfig:101` requires X; line 12 breaks it".
