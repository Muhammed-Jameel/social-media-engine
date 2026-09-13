# Contributing to SOCIAL_MEDIA_PLUGIN Content OS

Thanks for contributing. This project is now prepared as a public repository, and we follow the workflow below for all external and internal contributors.

## How to get started

1. Fork or clone the repository.
1. Install dependencies with `pnpm install`.
1. Copy `.env.example` to `.env.local` and keep secrets local only.
1. Run the main checks before opening a pull request:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`

## Development commands

```bash
pnpm dev          # run web app
pnpm worker       # run worker in a second terminal
pnpm postiz:up    # optional local Postiz stack
pnpm test:e2e     # optional end-to-end checks
pnpm check        # full local verification command
```

## Code quality expectations

- Prefer strict types and schema validation for new inputs.
- Keep evidence artifacts in place: hashes, IDs, and explicit rationale should be preserved for policy-sensitive changes.
- Avoid adding credentials in code, logs, or docs.

## Pull requests

- Keep PRs focused to one change area.
- Include a short validation section listing the checks you ran.
- Mention any behavior impact, migration change, or operational risk.

## Branching

- Use short, descriptive branch names.
- Rebase on latest `main` before requesting review.
