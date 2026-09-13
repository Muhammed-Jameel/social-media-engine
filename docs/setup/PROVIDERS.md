# Provider Setup Boundary

Provider setup has three separate layers: application registration, encrypted credential/account binding, and verified runtime capability. Completing only one layer does not make a provider production-ready.

## Current implementation truth

| Provider | What exists now | What is still required |
|---|---|---|
| OpenAI | Responses API gateway and fixture fallback | Project key, live schema/eval validation, spend/retention policy |
| Canva | Typed capability contract and deterministic SVG fallback | OAuth routes/token storage, account entitlement probe, create/export adapter |
| Instagram/Facebook | Capability records and dry-run publisher shape | OAuth, Page/account binding, media hosting, real API adapter/webhooks, App Review where required |
| LinkedIn | Capability records and internal-scheduler policy | OAuth, organization authorization, vetted Community Management access, real adapter |
| TikTok | Manual draft-handoff policy | OAuth and audited upload-draft integration; unattended Direct Post remains policy-blocked |
| YouTube | Optional capability policy | OAuth, audited project, real upload/analytics adapter |
| Storage | Local files for demo assets | Private S3/R2 bucket, public delivery policy for providers that fetch media, signed admin access |
| Email | Notification records | Resend account/domain and delivery adapter |

The current publisher executable accepts only a publication plan explicitly classified as dry-run. Do not set production flags in an attempt to bypass that boundary.

## Environment isolation

Create separate development, staging, and production provider applications where the provider permits it. Use unique callback URLs, client secrets, encryption keys, databases, buckets, and notification recipients. Never reuse production tokens locally.

Production requires:

- `DEMO_MODE=false`
- a strong `OWNER_SESSION_SECRET`
- an owner password hash, not a plaintext password
- a managed `DATABASE_URL` with backup/restore testing
- a 32-byte-or-stronger `CREDENTIAL_ENCRYPTION_KEY` from the deployment secret store
- HTTPS `APP_URL` and exact HTTPS OAuth redirect URIs
- `DRY_RUN=true` through shadow validation
- `PRODUCTION_PUBLISHING_ENABLED=false` until the supervised-release approval

## Connection workflow

For each provider:

1. Register a dedicated SOCIAL_MEDIA_PLUGIN application and record its environment/owner without copying secret values into the repository.
2. Configure the exact callback URL from `.env.example` for that environment.
3. Request the least scopes required for the chosen formats, accounts, insights, and comments.
4. Complete OAuth as the SOCIAL_MEDIA_PLUGIN account owner and bind the returned identity to the intended Page, organization, or channel.
5. Encrypt access and refresh tokens before persistence; store provider token metadata separately from values.
6. Probe each capability independently. Record `AVAILABLE`, a precise unavailable state, or `MANUAL_HANDOFF_REQUIRED`, plus verification time and official source.
7. Run read-only identity and permission tests, then sandbox/create-only tests where supported.
8. Complete a dry-run payload capture and compare exact copy/assets/schedule/account against the approved plan.
9. Obtain owner approval for one supervised canary. Never treat OAuth success as canary approval.

## OpenAI

Set `OPENAI_API_KEY` only in the server/deployment secret store. Model routing defaults to `gpt-5.6-sol` for frontier judgment and `gpt-5.6-terra` for bounded efficient work. Before enabling live generations:

- validate every response against the versioned schema;
- run golden and adversarial evals for the affected skill;
- retain model/prompt/skill/schema/trace versions;
- set project budgets and rate limits;
- confirm data-retention and logging policy;
- verify that model tools cannot invoke publication mutations.

Without a key, the fixture gateway is expected and must remain visibly labelled.

## Storage and notifications

Instagram and similar APIs fetch media from a provider-reachable URL. Production therefore needs an S3/R2-compatible asset route with immutable object keys, content hashes, correct MIME types, controlled public exposure, and deletion/retention policy. An app-local URL is not production media hosting.

Notification delivery should begin with owner-only operational alerts. Treat comment content and provider error messages as untrusted data. Do not include access tokens, signed URLs, full provider payloads, or private analytics in email.

## Verification record

For every capability, preserve:

- provider and account ID (not token);
- environment;
- requested and granted scopes;
- verification timestamp and verifier;
- official documentation URL/version;
- positive and negative test IDs;
- rate-limit/audit state;
- token expiry/revocation state;
- manual fallback;
- next re-verification date.

The current first-party research is in [the capability matrix](../research/CAPABILITY_MATRIX.md). Re-check it before implementing or validating a provider because platform APIs and review rules change.
