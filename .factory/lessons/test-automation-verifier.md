# Lessons: test-automation-verifier

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the test-automation-verifier agent's instructions on every run.

## L2: Check that each video identifies its case before scoring 10
<!-- category: passed-but-upheld; subtype: video; added: 2026-11-15 -->

The PR check's video critic keeps upholding findings on suites you passed. For each UI case open its keyframes and list as a gap: no frame or caption shows the requested URL or the URL after a redirect (the recording has no address bar); the input that makes the case distinct (`999999`, `?city=red`) never appears; a step the case relies on (the pager, page 1's last card) is never in view; a caption is clipped at the viewport edge; or a value the video cannot show (the pointer `cursor`) is not narrated from a measurement.
