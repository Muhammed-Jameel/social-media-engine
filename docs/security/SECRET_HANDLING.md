# Secret Handling

- Keep actual credentials only in `.env.local`, the operating-system keychain, or the deployment provider’s encrypted secret store.
- Commit `.env.example` with names and explanations only.
- Never expose provider tokens through `NEXT_PUBLIC_*` variables.
- Logs must pass through central redaction for authorization headers, cookies, access/refresh tokens, API keys, signed URLs, and common secret patterns.
- Separate OpenAI, Canva, Meta, LinkedIn, TikTok, storage, and notification credentials by environment and use the least scopes available.
- Production token persistence requires application-layer encryption with `CREDENTIAL_ENCRYPTION_KEY` and key rotation support.
- A credential appearing in source, logs, tests, screenshots, or a committed local-settings file is considered compromised and must be rotated.
- Provider setup screens show connection state and last verification time, never secret values.

