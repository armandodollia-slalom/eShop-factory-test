# Lessons: pr-check-style

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the pr-check-style agent's instructions on every run.

## L1: Verify a duplication or convention finding against the neighbouring files and the project graph before raising it
<!-- category: dismissed-finding; subtype: ; added: 2026-11-14 -->

Most dismissed style findings were preferences or wrongly assumed duplicates. Before raising one, check and drop it when:

- the "existing helper" lives in another test project and the two projects share no project reference or helper project (a small local fake or builder in each is fine);
- the neighbouring file declares the same signature or shape you are flagging (read it, for example a non-nullable `CreateContext(string)` passed `null!`);
- the only basis is ordering or placement with no documented rule (where a property is assigned in a constructor);
- you could not run the tool (`dotnet format`) and have no evidence of a violation: do not raise an unverified "formatter not run" finding; state it as unverifiable in your coverage notes only.

Still raise real findings: duplicated blocks inside one project, redundant usings, inline fully qualified names, hand-edited generated files, and deviations from a convention a neighbouring file shows.
