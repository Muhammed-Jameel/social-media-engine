# Self-hosted Postiz

Postiz is the local publishing gateway behind AURENDOR Content OS. AURENDOR remains the system of record for reviewed copy, ordered asset hashes, owner approval, publication intent, and audit history. Postiz owns provider OAuth and delivery to Instagram, Facebook, LinkedIn, TikTok, and X.

The generated local configuration sets `POSTIZ_NOT_SECURED=true` because the development URL uses plain HTTP. This makes Postiz use a localhost-compatible authentication cookie in Safari. Remove that variable (or leave it empty) when deploying Postiz behind HTTPS so secure cookies remain enabled.

## 1. Start the private local stack

Docker Desktop must be running. From the repository root:

```bash
pnpm postiz:up
```

The first start downloads the pinned Postiz `v2.23.0` image and its supported dependencies. It creates `.postiz/.env` with random local database/JWT secrets, uses named Docker volumes, and binds Postiz only to `127.0.0.1:4007`.

Check the service with:

```bash
docker compose --env-file .postiz/.env -f infra/postiz/docker-compose.yml ps
```

Open [http://localhost:4007](http://localhost:4007) and create the single administrator. Immediately stop new registrations after that account exists:

```bash
pnpm postiz:lock
pnpm postiz:up
```

Do not run the lock command before the administrator is created.

## 2. Configure provider applications

Postiz still needs provider-issued application credentials. Put them only in `.postiz/.env`, never in tracked files:

- `X_API_KEY` and `X_API_SECRET`
- `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`
- `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` for Facebook and Instagram
- `TIKTOK_CLIENT_ID` and `TIKTOK_CLIENT_SECRET`

Restart Postiz after changing provider credentials. Then use Postiz to authorize each owned AURENDOR account. A browser login session by itself cannot replace the provider OAuth/application setup.

TikTok public Direct Post requires TikTok audit approval. Until that approval is verified, keep TikTok delivery as a Postiz draft/manual completion path.

## 3. Connect AURENDOR to Postiz

In Postiz, open **Settings → Developers → Public API** and create an API key. Put it in the ignored Content OS `.env.local`:

```dotenv
POSTIZ_FRONTEND_URL=http://localhost:4007
POSTIZ_API_URL=http://localhost:4007/api
POSTIZ_API_KEY=replace-with-the-generated-key
POSTIZ_TIKTOK_DIRECT_POST_VERIFIED=false
```

Only change the TikTok verification flag after the configured provider application has passed TikTok's Direct Post audit. Otherwise AURENDOR deliberately sends TikTok media through the `UPLOAD` inbox route for manual completion.

Restart `pnpm dev`, then open [http://localhost:3000/publishing](http://localhost:3000/publishing). Connected supported channels appear automatically.

## 4. Safe operating sequence

1. Approve an exact current content item in **Content**.
2. Open **Publishing** and select the item and destination channels.
3. Review the platform-specific captions, ordered carousel assets, and time.
4. Send a Postiz draft first.
5. Verify the draft inside Postiz and each connected account identity.
6. Complete a supervised one-channel canary before enabling live scheduling.

Live dispatch additionally requires authenticated non-demo mode, the durable publishing gates to be enabled, and the global pause to be off. Duplicate requests are reserved before dispatch. If a provider response is ambiguous, AURENDOR records it for reconciliation and does not retry automatically.

## Operations

### Verified channel setup — 2026-09-07

- Cloud instance: `https://postiz.aurendor.io` (Postiz v2.23.0).
- Facebook Page **Aurendor** and Instagram **@aurendor** completed OAuth and were saved in Postiz. Both remained visible after refreshing Safari.
- The existing Aurendor Facebook Page was added to its Aurendor business portfolio, and Instagram was linked to that Page. OAuth access was limited to the selected current AURENDOR assets, not future assets.
- Meta required `pages_read_user_content` in addition to the documented Postiz Facebook scopes; enabling it resolved the invalid-scope error. Instagram comments and insights permissions were also enabled for testing.
- App credentials remain only in private server configuration. No credentials or authorization codes belong in this document.
- Connection success is not a live-publishing test. No post was published during setup. Meta app publication requirements and a supervised publishing canary remain to be checked.
- X **@aurendor_io** completed OAuth and remained visible after refreshing Safari. App `33408919` uses OAuth 1.0a consumer credentials, Native App, Read and Write (no DM access), and callback `https://postiz.aurendor.io/integrations/social/x`. The developer account showed $0 paid/free credits; no credits were purchased and no publishing canary was run.
- LinkedIn app **AURENDOR Publishing** (`264511058`) is associated with Aurendor company Page `120943948`. The owner obtained Advertising API access, then completed OAuth and Page selection. Postiz confirmed `Channel Added` for `linkedin-page` and displayed **Aurendor**. Connection is verified; a live-publishing canary is still outstanding. Both LinkedIn callbacks remain configured. Do not misrepresent organic-only use in review forms.
- TikTok organization **AURENDOR** (`7682684171361469460`) and app **AURENDOR Publishing** (`7682668121328617492`) exist. On 2026-09-08 the owner completed sandbox **AURENDOR Upload Review** (`7682631084802344968`), with target **aurendor.io**, app icon, Login Kit callback `/integrations/social/tiktok`, and only `user.info.basic` + `video.upload`. Direct Post is off. Sandbox credentials were installed privately on the VPS. Both public ownership challenges are served by Caddy; the sandbox challenge was verified byte-for-byte over HTTPS. Sandbox OAuth and a two-photo inbox handoff succeeded on Postiz's side; mobile confirmation remains pending. Production review has not been submitted.
- Review blocker: the owner's published [Terms](https://www.aurendor.io/policies/terms-conditions) and [Privacy Policy](https://www.aurendor.io/policies/privacy-policy) list Lagos, Nigeria. The owner explicitly confirmed the correct business location is **Iraq, Baghdad**. Public pages have not been corrected; the governing-law clause requires separate care. TikTok also needs a real sandbox end-to-end demo before production review. Do not represent these tasks as completed.
- After the credential restart, the container health check passed while the backend was not listening on port 3000. A targeted `pm2 restart backend` restored the API (unauthenticated `/api/user/self` returned the expected 401), and Safari loaded the channel list. Validate backend and orchestrator separately after future restarts; the cause of this startup stall is not established.

### TikTok form copy prepared (not submitted)

- Category: Productivity; platform: Web; website: `https://postiz.aurendor.io`.
- Description: “AURENDOR’s workspace to prepare original content and send TikTok uploads for in-app review and publishing.”
- Requested scopes: `user.info.basic`, `video.upload`; no Direct Post.
- Review explanation: “AURENDOR uses a private, self-hosted Postiz workspace for its own original business content. Login Kit identifies the authorized account using user.info.basic. Content Posting API with video.upload sends owner-reviewed media to the creator inbox; the administrator then reviews and publishes inside TikTok. Direct Post is not requested. This is an internal tool, not a public multi-tenant service.”

### Upload-only compatibility — 2026-09-08

**Live sandbox result, 2026-09-08:** OAuth connected Aurendor successfully. Owner-authorized two-photo canary `TT-SANDBOX-20260908-01` ran through authenticated Postiz UI and its worker, using explicit `UPLOAD`. Post `cmts9fjm80002pv7x7mclid3z` completed at 06:07:21 UTC with no error, `releaseId=missing`, and `releaseURL=https://www.tiktok.com/messages?lang=en`. The deployed provider maps `SEND_TO_USER_INBOX` to this result. Postiz labels the record `PUBLISHED`, but this is **inbox handoff only, not a public post**. Owner mobile-inbox confirmation remains outstanding. Video uploads, full announcement carousels, and production review are not validated by this two-image sandbox test. See [canary audit](../operations/TIKTOK-SANDBOX-CANARY-20260908.json).

The upstream v2.23.0 provider requires six OAuth scopes including `video.publish`, and requests username fields requiring `user.info.profile`. The cloud overlay now uses `aurendor/postiz:2.23.0-tiktok-upload-only-1`, a derived image built from the exact deployed upstream digest. `infra/postiz/tiktok-upload-only/patch.cjs` checks the original bundle SHA-256 before changing BOTH backend and orchestrator; upgrades fail closed until reviewed.

- OAuth requests/validates only `user.info.basic` and `video.upload`; user info requests only basic fields. The channel uses returned display name/open ID, not an invented username.
- Direct, missing, or malformed posting methods fail before media/network I/O. Explicit `UPLOAD` is required. Photos use `MEDIA_UPLOAD`; videos use the inbox endpoint.
- Scope-unavailable analytics return no data, not fabricated zeroes. Creator-info querying is skipped; preflight uses a conservative 600-second cap, not claimed account-specific permission.
- The upstream editor still offers Direct Post by default. Select **Upload content to TikTok without posting it**; the server rejects Direct Post. AI/commercial disclosures, privacy, caption finalization, and the actual publish action must be completed in TikTok.
- Postiz's completed inbox delivery is NOT evidence of public publication. The AURENDOR manual-handoff contract and publishing gates are unchanged.
- Build tests cover exact scopes, basic authentication/refresh, direct-post denial, inbox/photo routing, no unauthorized analytics calls, and upstream drift (11 tests). Existing gateway/executor tests passed (10 tests); mocks do not prove TikTok acceptance.

Build before deployment: `docker compose --env-file .postiz/.env -f infra/postiz/docker-compose.yml -f infra/postiz/docker-compose.cloud.yml build postiz`. To roll back, restore the previous cloud overlay and private pre-TikTok env backup, then recreate Postiz. Do not revert to the broad-scope upstream provider while leaving sandbox credentials active.

```bash
pnpm postiz:logs
pnpm postiz:down
```

`postiz:down` stops containers but preserves named volumes. Back up the Postiz PostgreSQL and upload volumes before any upgrade. Review release notes before changing `POSTIZ_IMAGE_TAG`; do not use `latest` in production.

## Cloud deployment

The cloud overlay adds Caddy with automatic HTTPS while retaining the pinned Postiz stack, health ordering, private databases, and persistent volumes. On the server, set `POSTIZ_HOSTNAME` in the private `.postiz/.env`, leave `POSTIZ_NOT_SECURED` empty, point the hostname's DNS record at the server, and run:

```bash
docker compose \
  --env-file .postiz/.env \
  -f infra/postiz/docker-compose.yml \
  -f infra/postiz/docker-compose.cloud.yml \
  up -d --build
```

Only TCP ports 22, 80, and 443 and UDP port 443 need to be reachable publicly. PostgreSQL, Redis, Temporal, Elasticsearch, and the local Postiz port remain private. Registration must stay disabled after the administrator is migrated.

Before changing AURENDOR's API URL, migrate the Postiz PostgreSQL and upload volumes, verify the administrator session over HTTPS, verify the organization API key, and send a supervised draft. Do not treat a healthy container as proof that Temporal workers or provider publishing are healthy.

The production VPS installs `infra/postiz/backup.sh` as a systemd timer. It creates a protected nightly PostgreSQL dump, upload archive, and environment recovery copy under `/var/backups/aurendor-postiz`, retaining 14 days by default. These same-server backups support quick recovery but do not replace an off-server backup or provider snapshot.
