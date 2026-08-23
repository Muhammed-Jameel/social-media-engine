# Social-Network Setup

This document describes the intended account preparation and the current limits of the engine. OAuth callbacks, real social API mutations, webhook verification, and live analytics collection still require implementation and sandbox validation. Until then, use dry-run or explicit manual handoff.

## Common gate for every network

Before any supervised post:

- verify the provider identity and exact AURENDOR account/Page/organization/channel;
- request least privilege and record granted scopes;
- encrypt and test token refresh/revocation;
- verify format, media, copy, scheduling, rate limits, and account-level API access;
- configure HTTPS callbacks/webhooks and signature verification;
- use immutable provider-reachable media URLs where required;
- pass creative, claims, compliance, license, approval, idempotency, and global-pause gates;
- reconcile the provider ID and final visible post after the request;
- have an operator ready to remove the canary manually.

## Instagram and Facebook

Environment names are `META_APP_ID`, `META_APP_SECRET`, and `META_REDIRECT_URI`.

1. Create a Meta app owned by AURENDOR.
2. Confirm the Instagram account is professional and bind it through the supported Business Login route or a linked Facebook Page as appropriate.
3. Request only the Page/account, publishing, insights, and comment scopes actually used; complete App Review/Advanced Access where required.
4. Bind Facebook Page IDs and Instagram user IDs separately in the engine.
5. Validate image, video/Reel, carousel, and Story support per account. Do not infer that one format authorizes all others.
6. For Instagram, schedule internally and invoke create/publish at the due time; there is no future-publish field in the researched content-publishing route.
7. Enforce Instagram’s API-published-content rate budget and Meta’s current media constraints at preflight.
8. For Facebook native scheduling, re-test the allowed time window before relying on it; otherwise retain internal scheduling.

Comments may be ingested and classified after scope verification. The engine must not auto-post public replies.

## LinkedIn organization page

Environment names are `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, and `LINKEDIN_REDIRECT_URI`.

1. Create a LinkedIn application associated with the AURENDOR organization.
2. Complete three-legged OAuth as an authorized organization administrator.
3. Obtain the vetted Community Management access tier and scopes needed for organization posts/analytics.
4. Bind the organization URN, not only the member who authenticated.
5. Use an internal scheduler because the researched Posts API does not expose a future publish time.
6. Represent organic multi-slide content as supported MultiImage or document content. Do not send the sponsored-only carousel media type for an organic post.

Keep the capability unavailable until the actual AURENDOR organization passes an identity/read test and a sandbox or supervised create test.

## TikTok

Environment names are `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, and `TIKTOK_REDIRECT_URI`.

TikTok is intentionally **manual draft handoff only** for this internal AURENDOR utility. Current Direct Post audit guidance rejects private/internal account-management upload utilities as an acceptable public audited client, and unaudited posts are restricted. Do not relabel this limitation as a technical error or bypass it with a production flag.

If OAuth and upload-draft support are implemented:

1. obtain creator consent and current account info;
2. upload the approved asset as a draft;
3. notify the owner to review/edit metadata and complete publication in TikTok;
4. record the handoff, not a published state;
5. reconcile the visible post only after the owner confirms completion.

## YouTube

YouTube is optional. A future adapter may use OAuth and `videos.insert`, then schedule an eligible never-public private video with `status.publishAt`. Until the API project passes the relevant audit, uploaded videos may be forced private. Keep the route manual/offline and do not describe a private test upload as public success.

## X and unsupported channels

The schema reserves `x` and `manual`, but no X adapter or provider research is approved in this snapshot. Use a manual handoff with a recorded checklist. Never infer a connection because the platform enum exists.

## Canary evidence

For each real network, the first canary record must include the approved plan ID, exact copy and asset hashes, account ID, operation/schedule/timezone, idempotency key, request/response references with secrets removed, provider publication ID, visible URL, owner observation, rollback result, and metric-collection check. One successful canary does not authorize broad rollout.
