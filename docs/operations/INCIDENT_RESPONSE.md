# Incident Response

Safety and containment outrank throughput. Do not retry uncertain mutations, erase audit records, or paste sensitive provider responses into chat or tickets.

## Severity

| Severity | Examples | Initial target |
|---|---|---|
| SEV-1 | Credential compromise; wrong-account or harmful publication; repeated unauthorized mutations; database exposure | Immediate containment and owner escalation |
| SEV-2 | Duplicate/malformed post; broken global pause; persistent ambiguous provider state; widespread analytics corruption | Pause affected capability and respond within the active operating window |
| SEV-3 | Single failed job; delayed metric collection; manual-handoff failure; non-sensitive UI degradation | Triage during normal operations |

## First 15 minutes

1. Name an incident lead and recorder; note detection time, environment, provider/account, and observed effect.
2. Set `SOCIAL_MEDIA_PLUGIN_ENGINE_PAUSED=true` and restart the affected web/worker runtime. Confirm the persisted/provider queues are not advancing.
3. Disable only the affected capability/account when narrower containment is reliable; otherwise keep the global pause.
4. If provider-side schedules exist, cancel them in the provider’s native interface. The engine pause cannot cancel remote schedules by itself.
5. Revoke exposed credentials at the provider before investigating their contents. Rotate downstream secrets that could have been reached.
6. Preserve logs, intent/outbox/provider IDs, hashes, timestamps, relevant audit rows, and screenshots. Redact tokens, cookies, signed URLs, and personal data.
7. If content is live and harmful/wrong, get owner authorization and remove/hide it through the provider interface. Record the action; do not erase the local record.

## Known credential action

A Gemini API-key-like value was detected in `/Users/muhammedjameel/Documents/SOCIAL_MEDIA_PLUGIN/.mcp.json`. Its value was not copied into this repository and must never be printed during remediation.

Required owner action:

1. revoke/rotate the corresponding Google/Gemini credential in the owning cloud project;
2. inspect provider audit logs and usage/billing for unexpected activity;
3. replace the local file value through a secure secret source or remove the integration if unused;
4. confirm the old credential is rejected;
5. run the repository secret scan and a separate approved scan of the source tree that reports only path/rule metadata;
6. record rotation time, owner, affected environments, and audit result without storing the key.

Until this is closed, production readiness remains no-go.

## Scenario playbooks

### Ambiguous publish response

- Do not retry automatically.
- Mark the intent `AMBIGUOUS`/reconciliation pending.
- Query provider state using account, time window, content fingerprint, and any request/provider ID.
- If a matching remote object exists, bind and verify it; if not, require an authorized decision before a new idempotency key/attempt.
- Preserve both the original intent and reconciliation evidence.

### Duplicate publication

- Pause the account/capability.
- Identify which remote object matches the approved intent and which is duplicate.
- With owner authorization, remove the duplicate in the provider interface.
- Audit idempotency reservation, outbox locking, timeout/retry sequence, and provider lookup behavior.
- Add a regression test before restoring the route.

### Wrong account, copy, asset, or schedule

- Pause globally and remove/hide the post if authorized.
- Compare the exact outbound payload hash against the approved plan and visible review.
- Check account binding, timezone, material-deviation detection, approval expiry/revocation, copy hash, and ordered asset hashes.
- Treat a hash/binding bypass as SEV-1 and invalidate affected approvals.

### Bad or unsafe creative/claim

- Preserve the visible evidence, then remove/hide with owner authorization.
- Route the item back to `REVISION_REQUESTED` or `BLOCKED`.
- Identify whether the failure was brand retrieval, bilingual copy, claims evidence, asset license, visual critique, owner review, or post-publish drift.
- Add the failure as an eval fixture; do not merely lower the approval threshold.

### Analytics corruption

- Stop derived-insight/experiment decisions while keeping immutable raw references.
- Mark the affected provider/window/metric version as quarantined.
- Reconcile metric definitions, denominators, timezone, post identity, duplicates, deletions, and provider schema changes.
- Recompute snapshots into a new version. Never rewrite previously reported values without an audit record.

## Communication template

Share only what is known:

```text
Incident: <short name / severity>
Detected: <timestamp and timezone>
Impact: <accounts/posts/data actually affected>
Contained: <yes/no and exact control>
Evidence confidence: <confirmed / likely / unknown>
Owner action needed: <specific decision>
Next update: <time>
```

Do not call an external post “deleted” until it is visibly verified, or a credential “rotated” until the old value is confirmed invalid.

## Recovery gate

Resume only when the incident lead and owner confirm:

- the root cause is supported by evidence;
- compromised credentials are invalid and replacements are secured;
- provider and persisted state are reconciled;
- the fix and regression test pass;
- queued jobs are reviewed for stale approvals/material deviations;
- monitoring and rollback are ready;
- scope and observation window are explicitly stated.

Begin at the narrowest safe stage, normally `OFFLINE` or `SHADOW`. Close with a blameless review, action owners/dates, and updates to the threat model, runbook, eval fixtures, and capability matrix where applicable.
