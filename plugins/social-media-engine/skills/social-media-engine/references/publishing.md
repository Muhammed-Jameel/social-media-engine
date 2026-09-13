# Publishing safely

## Manual export
Manual export works independently of providers. Export only owner-approved items.
The runtime creates a hash-bound folder containing content JSON and actual asset files.
Give the user the folder and upload instructions for their selected platform.
Exporting does not mean publishing, scheduling, or connecting an account.

## Optional Postiz adapter
Configure `POSTIZ_API_URL` and `POSTIZ_API_KEY` privately in the shell environment.
Use your exact Postiz public API base URL, including any proxy prefix such as /api.
The adapter can append /public/v1 but does not discover deployment routing.
HTTPS is required except for a local
test/self-hosted endpoint. No built-in credentials or company-specific default endpoints.
Postiz cloud and self-hosted deployments are possible; the owner supplies the service.

Use `accounts` to list live integrations. Bind every platform/language variant to an
explicit account ID. Verify provider capabilities and current settings against
[Postiz's API](https://docs.postiz.com/public-api/posts/create). Never infer that a
requested platform is connected. Record capability evidence with the binding.
The adapter passes provider-specific settings through; it does not guarantee every
provider/format combination or replace platform account eligibility.

Instagram settings distinguish posts and stories. TikTok requires the proper privacy,
interaction, disclosure and posting-method settings. UPLOAD may require the owner to
finish posting in TikTok; do not report it as public. DIRECT_POST requires explicitly
verified account/app capability. Facebook settings depend on the selected content type.

Prepare an intent with item ID, operation (draft/schedule/now), offset-aware date, and
variant/account/settings bindings. Preparation reads accounts but sends no assets/posts.
Show the exact account names/IDs, platform/language variants, current content hash,
operation, date and timezone, and confirmation hash to the owner.

Only after explicit confirmation, set `SOCIAL_ENGINE_ALLOW_PUBLISH=true` for that
authorized invocation and call `dispatch-send --send` with the exact confirmation hash
and owner identity. Even remote drafts are external writes and need this approval.
Never enable publishing by default, store this gate in brand settings, or reuse consent
for a different account, caption, schedule, revision, or future batch.

## Ambiguity and reconciliation
The runtime records SENDING before network work, payload hash before posting, and
receipts before interpretation. It refuses automatic resend.
ACCEPTED means the provider accepted a request, not that a network published it.
UNKNOWN/SENDING after a crash require checking the provider using `provider-posts`
or its UI. Do not retry blindly; duplicates may otherwise go public.
BLOCKED_BEFORE_POST can be cancelled locally after investigation; uploads may still
exist remotely. Cancellation of PREPARED is local only.
Already submitted schedules must be edited/cancelled through the provider, then their
outcomes reconciled with concrete evidence. Local cancellation is not remote deletion.

Reconciliation records source, explanation, exact post IDs, state and supporting URLs.
For TikTok UPLOAD, confirm the actual public URL before marking publication complete.
Treat expired tokens, missing accounts, unsupported media and ambiguous receipts as
action-required errors, never successful publication.
