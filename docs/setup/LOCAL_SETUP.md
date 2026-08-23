# Local Setup

This guide creates a safe local AURENDOR Content OS environment. It leaves external publication disabled and uses a local PGlite database.

## 1. Prerequisites

- macOS, Linux, or WSL with Node.js `>=22.13.0`; `.nvmrc` pins the tested Node.js `22.23.2` LTS release
- pnpm `11.19.0`
- Access to the canonical source tree at `/Users/muhammedjameel/Documents/AURENDOR` if you want to rerun discovery or import the historical queue
- Optional: `ffprobe` for richer video metadata during import

Confirm the runtime:

```bash
nvm install
nvm use
node --version
pnpm --version
```

## 2. Install and configure

```bash
pnpm install
cp .env.example .env.local
```

Keep these local defaults unchanged:

```dotenv
DEMO_MODE=true
DRY_RUN=true
PRODUCTION_PUBLISHING_ENABLED=false
AURENDOR_ENGINE_PAUSED=false
PGLITE_DATA_DIR=.data/pglite
```

Do not paste real credentials into `.env.example`, shell history, screenshots, tickets, or chat. `.env.local` is ignored, but operating-system keychain or a deployment secret store is preferable once a provider is connected.

## 3. Build the evidence index and database

```bash
pnpm discovery
pnpm brand:sync
pnpm db:migrate
pnpm db:seed
pnpm seed:import
```

Expected import facts for the canonical September source set:

- 33 content items
- 98 manifest-referenced rendered assets: 94 PNG and 4 MP4
- 107 top-level source media files in total; the 9 unreferenced legacy/duplicate files are intentionally not imported
- filename drift repaired by content-aware lookup and recorded in the audit trail
- every imported item remains `NEEDS_REVIEW`
- `W3-P5` remains a known hard-fail candidate and must not be approved without repair and fresh review

The discovery script records metadata and hashes, not credential values. The importer copies resolved demo assets to `apps/web/public/demo-content`, an ignored local directory.

## 4. Verify the dry-run path

```bash
pnpm simulate:dry-run
```

The fixture simulation uses `W1-P4`, persists an exact publication intent and provider-style receipt, and reports `remoteMutation: false`. It deliberately uses fixture approval/auth evidence and is not proof that Instagram is connected.

The same idempotency key can be exercised repeatedly without creating an external post. If the simulation asks for seed data, rerun `pnpm seed:import`.

## 5. Run the product

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Start the worker separately:

```bash
pnpm worker
```

The worker polls persisted workflow steps. Stop it with `Ctrl+C`. It does not gain provider authority by running.

## 6. Verify the codebase

```bash
pnpm exec tsx scripts/check-secrets.mts
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod
```

For browser tests:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Local reset

The local database lives only under this repository’s `.data/pglite`. Stop the web app and worker before resetting. Because deleting state is destructive, make a copy of `.data/pglite` first if you need its audit history, then remove only the explicit project-local database directory and rerun migration/seed/import. Never point a cleanup command at the AURENDOR source tree.

## Common failures

| Symptom | Check |
|---|---|
| Import cannot find a source post | Confirm the canonical AURENDOR path exists and has not moved; do not create fake replacement files |
| Video metadata is incomplete | Install `ffprobe`; the importer can still hash and ingest the file |
| PGlite lock/start issue | Stop duplicate web/worker processes that point to the same data directory |
| Provider says not configured | Expected in local mode; see the provider setup guides and do not override the capability state |
| Fixture analytics look successful | They are synthetic demo values, not real account performance |
| Secret scan reports a path | Rotate/revoke the credential first; never print the match while debugging |
