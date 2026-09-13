# Implementation and validation report

## Delivered
A native, brand-first Social Media Engine plugin with a portable Python runtime,
persistent local brand memory, self-contained agent workflows, an owner dashboard,
and optional controlled Postiz delivery.

The old copied application is preserved in the ignored local recovery archive.
The new package does not contain customer content, licensed fonts, provider credentials,
private workstation paths, old dependencies or the legacy application's generated media.

## Validation performed
- **47 automated tests: PASS.** Standard-library unittest suite.
- **Real browser exercise: PASS.** Desktop and 390px mobile viewport; no page errors.
- **Actual media exercise: PASS.** Five PNGs and a six-second H.264 MP4, used in four
  fictional-brand drafts including a carousel, video and Arabic image.
- **Video playback: PASS.** The browser played the entire deliberately silent test video.
- **Owner controls: PASS in test.** Questionnaire save, brand approval, rated feedback,
  change-request invalidation, and UI navigation.
- **Provider contracts: PASS against local fake Postiz.** Account discovery, real multipart
  HTTP upload, exact payload binding, disabled accounts, changed credentials, redirect
  refusal, partial receipts, disconnect ambiguity, no resend, reconciliation.
- **Official Codex plugin validator: PASS.**
- **Official skill validator: PASS.**
- **Extracted-package portability: PASS.** Executed from a separate installation path
  containing spaces, with data created only in its selected private working folder.
- **Deterministic release build: PASS.** Same source produced identical ZIP hashes.
- **Protected original: read-only throughout this task.** Recorded commit unchanged.
  The private local integrity report describes the verification boundary.

## Release artifact
`dist/social-media-engine-1.0.0.zip` contains the installable plugin.
`dist/SHA256SUMS` contains its checksum. The artifact is approximately 48 KB.
The files are local; this task did not commit, tag, push, or create a GitHub release.
A version-tag release workflow is provided for the repository owner.

## Not claimed
No live production credentials were used. No social post was published or scheduled.
No real platform OAuth flow, live account permissions, live analytics, or cross-host
installation was certified. The local ZIP execution test is not a Codex/Cowork UI
installation test.

The media exercise is a technical demonstration for a fictional brand, not genuine
owner approval, a production campaign or proof of identical creative quality across
models. Professional quality still needs a real brand's calibration/review session.

This is a tested local-first release candidate. Calling it universally production-ready
or issue-free would overstate the evidence. See SOCIAL-MEDIA-ENGINE-GAPS.md for the
remaining account-dependent and product-scope boundaries.
