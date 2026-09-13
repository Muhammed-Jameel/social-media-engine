# Public Setup Guide

This guide is for users who want to download and run this repository from GitHub.

## 1) Download

Clone the repository URL you received and open the project root.

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd <REPO_DIRECTORY>
```

## 2) Install runtime

Use a Node.js 22.x environment and pnpm 11.19.0 (or a compatible lockfile toolchain).

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install
```

## 3) Configure local environment

```bash
cp .env.example .env.local
```

The repository starts in safe demo mode by default:

- `DEMO_MODE=true`
- `DRY_RUN=true`
- `PRODUCTION_PUBLISHING_ENABLED=false`
- `SOCIAL_MEDIA_PLUGIN_ENGINE_PAUSED=false`

## 4) Validate your environment

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec tsx scripts/check-secrets.mts
```

## 5) Run locally

```bash
pnpm dev
```

Run the worker in another terminal if you want queued workflows to progress:

```bash
pnpm worker
```

## 6) What to expect before publishing

- Dashboard and workflow logic are runnable in local dry-run mode.
- External publishing is disabled until explicit production enablement and provider setup are completed.
- The included setup is designed to protect against accidental remote mutation by default.

## 7) Publish safely (optional)

If you later connect provider integrations:

- verify account scopes before enabling publishing
- keep idempotency and approval records
- confirm staging and replay behavior before removing dry-run flags
