# Lessons: pr-check-style

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the pr-check-style agent's instructions on every run.

## L1: Withdraw or do not raise style findings that the repository's own conventions support
<!-- category: dismissed-finding; subtype: ; added: 2026-11-14 -->

The judge dismissed 25 style findings. Before raising one, check and drop it when: the neighbouring file already does the same thing (same nullable signature, same helper shape); the duplication is across projects that share no helper project (a new reference would be needed); the ordering or placement has no documented convention (property assignment order in a constructor); you could not verify it (formatter not run, command blocked) so it is only a suspicion; or it is a pure preference with no effect on behavior or readability. Report an unrun formatter as one coverage note, not as a finding. Raise only findings that cite the neighbouring code or documented rule they break.
