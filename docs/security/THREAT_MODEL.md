# Threat Model

## Protected assets

Social account tokens, Canva/OpenAI credentials, approval state, brand truth, unpublished content, licensed assets, audience/comment data, publication idempotency keys, and audit history.

## Principal threats and controls

| Threat | Control |
|---|---|
| Unauthorized publication | Owner session, explicit approval state, production flag, kill switch, account binding, idempotency reservation |
| OAuth/token theft | Server-only secret store, encrypted-at-rest production requirement, least scopes, redacted logs, refresh rotation |
| Prompt injection from files/web/comments | Treat external content as data; instruction-like content flagged; role tool boundaries; models cannot publish |
| Poisoned brand sources | Authority/recency scoring, hashes, provenance, conflict surfacing, owner-confirmed version changes |
| SSRF/malicious assets | URL allowlists, DNS/IP validation before fetch, MIME/size checks, no browser-side secret fetches |
| SVG/HTML script payload | Sanitize or rasterize before preview; never inject untrusted raw markup |
| Webhook spoofing/replay | Provider signature verification, timestamp window, replay ID storage |
| Duplicate posting | Transactional idempotency key plus persisted provider request/publication IDs |
| Token leakage in traces | Structured redaction; never log headers, tokens, raw secret config, or signed URLs |
| Broken access control | Server-side organization/account checks for every mutation and review |
| Third-party skill compromise | Registry, license/security review, pinned version, no unreviewed script execution |
| Dependency compromise | Lockfile, CI audit, secret scan, controlled upgrades |

## Trust boundaries

The owner session and internal policy/configuration are trusted after authentication. Model output, provider payloads, documents, comments, web pages, file metadata, design markup, and third-party skills are untrusted and validated at their boundary.

