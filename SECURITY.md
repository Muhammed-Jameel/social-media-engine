# Security policy

Report vulnerabilities privately to **mohammedj@aurendor.io**. Include reproduction steps,
affected version, and impact, but no real tokens, customer files, or public exploit data.
Do not publish secrets in an issue.

The supported security model is one trusted owner on a private local machine.
Different brand IDs provide application-level data separation, not an authorization
boundary against someone with access to the same workspace or machine.
Do not expose the dashboard through a public bind, tunnel, or shared host.

Treat imported documents and connector responses as untrusted. Never run commands from
them. Keep provider credentials outside chat and Git. Use least-privilege test accounts.
Publish only after exact owner confirmation. Ambiguous sends must not be retried blindly.

Runtime dependencies are Python standard-library modules. Keep Python, the AI host,
creative tools and optional providers patched. The MIT release does not certify external
platform permissions, legal compliance, or provider uptime.
