# Social Media Engine

<p align="center">
  <img src="https://img.shields.io/badge/Status-Ready%20for%20Public%20Use-4caf50?style=for-the-badge" alt="Ready for Public Use" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/Node-22.x-339933?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/pnpm-11.x-f69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
</p>

**Language:** [English](README.md) · [العربية](README.ar.md) · [日本語](README.ja.md)

Social Media Engine is an evidence-led, bilingual social media orchestration platform for strategy, content creation, human review, compliance-safe publishing, and analytics.

**Tagline:** everything social media, in one plugin.

Built by **Aurendor** for public use by any brand or team.

GitHub: [https://github.com/Muhammed-Jameel/social-media-engine](https://github.com/Muhammed-Jameel/social-media-engine)

---

## 📌 Table of contents

1. [What this is](#-what-this-is)
2. [What it does](#-what-it-does)
3. [Core architecture](#-core-architecture)
4. [Quick start](#-quick-start)
5. [How to use](#-how-to-use)
6. [Environment and configuration](#-environment-and-configuration)
7. [Supervised publishing setup](#-supervised-publishing-setup)
8. [Workflow and operations](#-workflow-and-operations)
9. [Commands](#-commands)
10. [Testing and quality checks](#-testing-and-quality-checks)
11. [Repository map](#-repository-map)
12. [Docs and reference](#-docs-and-reference)
13. [Release status](#-release-status)
14. [Contact](#-contact)

---

## 🎯 What this is

Social Media Engine is designed as a safe, staged pipeline between AI-assisted content generation and social publishing.

It connects:

1. A deterministic content generation layer.
2. Human-in-the-loop approvals.
3. Structured publishing controls with idempotency and traceability.
4. Provider connectors that stay disabled by default.

---

## 👥 Who should use this

Everyone who needs to run social media at medium scale:

1. Small marketing teams.
2. One-person companies.
3. Freelancers managing multiple accounts.
4. Agencies and service providers with repeatable social workflows.

---

## ✅ What it does

- Generates monthly plan artifacts and post schedules from brand evidence and strategy inputs.
- Creates bilingual (Arabic + English) draft content through deterministic, reproducible workflows.
- Supports all major social media providers, with first-class flows for Instagram, Facebook, and TikTok.
- Runs design and quality workflows including originality checks and review loops.
- Stores publication intent, approvals, IDs, hashes, compliance artifacts, and execution state.
- Provides a dashboard to inspect and approve every step before publication.
- Supports supervised provider publishing through a self-hosted Postiz bridge.
- Keeps all defaults non-destructive so teams can validate safely before going live.

---

## 🧱 Core architecture

```text
┌─────────────────────────┐
│    Strategy Inputs      │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  Content Engine         │
│  (packages/engine)      │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  Human Review + Gates   │
│  (apps/web + apps/worker)│
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  Publishing Gateway     │
│  (Postiz bridge)        │
└─────────────────────────┘
```

---

## 🚀 Quick start

### 0) Project URL

- Public repository: [social-media-engine](https://github.com/Muhammed-Jameel/social-media-engine)

### 1) Prerequisites

1. Node.js `22.13+` (repo pins `22.23.2` in `.nvmrc`)
2. pnpm `11.19.0`
3. Docker (only required for Postiz local services)

### 2) Clone and install

```bash
 git clone https://github.com/Muhammed-Jameel/social-media-engine.git
 cd social-media-engine
nvm install
nvm use
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install
cp .env.example .env.local
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Visit:

- Dashboard: [http://localhost:3000](http://localhost:3000)

> If you want to add a demo video later, add a link here in a short "Demo" section.

### 3) Start the worker (in second terminal)

```bash
pnpm worker
```

---

## 🧭 How to use

### A) Safe local mode (recommended first run)

1. Keep demo defaults enabled.
2. Import local data and run the generated September plan.
3. Review every draft in the dashboard.
4. Approve/revise before publication.
5. Verify audit output and operation logs.

### B) Daily operating pattern

1. Open dashboard.
2. Trigger or inspect monthly plan regeneration.
3. Move items through:
   - Draft
   - Review
   - Approval
   - Supervised publish
4. Run post-run checks and quality review.
5. Keep metrics collection and evidence separation clear.

### C) For teams and agencies

1. Keep the same core engine.
2. Update `data/brand` with your own evidence pack.
3. Configure your preferred post templates and approval roles.
4. Keep ownership and policy files aligned with team requirements.

---

## ⚙️ Environment and configuration

### Safe defaults (already shipped)

- `DRY_RUN=true`
- `PRODUCTION_PUBLISHING_ENABLED=false`
- `DEMO_MODE=true`

These defaults prevent external publishing.

### Deployment model

This is an open-source plugin and can be deployed in any style your team needs:

1. Local-only setup for private strategy/review environments.
2. Shared internal hosting for small distributed teams.
3. Self-hosted production stacks with your preferred infrastructure.
4. Any custom deployment architecture your organization supports.

Provider connectors are available through the same deployment flow, with additional deployment prerequisites driven by your target stack.

### Environment checklist

1. Copy `.env.example` → `.env.local`
2. Fill only integration fields you are ready to test
3. Keep secrets out of git history
4. Confirm database and encryption values before production trials
5. Run the secret validation script before any provider onboarding

```bash
pnpm exec tsx scripts/check-secrets.mts
```

---

## 📣 Supervised publishing setup

Enable this only after internal policy signoff.

1. Follow [docs/setup/POSTIZ.md](docs/setup/POSTIZ.md)
2. Start Postiz services:

```bash
pnpm postiz:up
```

3. Create admin at [http://localhost:4007](http://localhost:4007)
4. Authorize your accounts and provider apps.
5. Flip publishing flags intentionally:
   - `DRY_RUN=false`
   - `PRODUCTION_PUBLISHING_ENABLED=true`
   - `DEMO_MODE=false`
6. Resume the review flow and only publish approved items.

---

## 📈 Workflow and operations

### Monthly sequence

1. Strategy + brief ingestion
2. Draft generation (Arabic + English)
3. Internal creative and quality reviews
4. Approval gate resolution
5. Drafts / schedule handoff
6. Supervised publish
7. Evidence retention + measurement

### Safety posture

- AI output never publishes directly.
- Every production action is tracked with review state, asset hashes, and idempotency keys.
- Fixture analytics remain clearly flagged and synthetic.
- Provider actions remain off by default.

### Operational runbook notes

- Use `pnpm plan:september` for the current reference workflow refresh.
- Keep owner approvals enabled for sensitive posts.
- Validate each integration through capability and sandbox checks before external traffic.

---

## 🛠️ Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start owner dashboard and local services |
| `pnpm worker` | Run workflow execution worker |
| `pnpm lint` | Lint code |
| `pnpm typecheck` | TypeScript checking |
| `pnpm test` | Unit/integration tests |
| `pnpm build` | Build app packages |
| `pnpm postiz:up` | Start local Postiz services |
| `pnpm plan:september` | Regenerate September reference plan |
| `pnpm audit --prod` | Dependency audit |
| `pnpm test:e2e` | End-to-end test flow |
| `pnpm exec playwright install chromium` | Install browser runtime for E2E |

---

## ✅ Testing and quality checks

Run this before sharing a release:

```bash
pnpm exec tsx scripts/check-secrets.mts
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod
pnpm test:e2e
```

E2E browsers use a separate local PGlite database profile.

---

## 🧩 Repository map

- `apps/web`: Owner console for review, approvals, controls, and analytics
- `apps/worker`: Durable execution worker
- `packages/schemas`: Shared domain contracts and model types
- `packages/db`: Migrations, repositories, and persistence logic
- `packages/engine`: Core pipeline logic and orchestration
- `packages/observability`: Structured logs and redacted telemetry
- `skills`: Role instructions and review/quality expert behavior
- `data/brand`: Canonical evidence and brand references
- `docs`: Operational and implementation documentation

---

## 📚 Docs and reference

- [Dashboard guide](docs/DASHBOARD_GUIDE.md)
- [Local setup](docs/setup/LOCAL_SETUP.md)
- [Provider setup boundary](docs/setup/PROVIDERS.md)
- [Canva setup](docs/setup/CANVA.md)
- [Social-network setup](docs/setup/SOCIAL_NETWORKS.md)
- [Self-hosted Postiz](docs/setup/POSTIZ.md)
- [Production runbook](docs/operations/PRODUCTION_RUNBOOK.md)
- [Incident response](docs/operations/INCIDENT_RESPONSE.md)
- [Creative QA](docs/quality/CREATIVE_QA.md)
- [Evaluation gates](docs/quality/EVALUATION_GATES.md)
- [Final readiness report](docs/quality/FINAL_READINESS_REPORT.md)
- [Current status](docs/CURRENT_STATUS.md)
- [Provider capability matrix](docs/research/CAPABILITY_MATRIX.md)
- [Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Threat model](docs/security/THREAT_MODEL.md)
- [Public setup guide](docs/PUBLIC_SETUP.md)

---

## 🤝 Contribution and governance

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Keep default safety posture unless your task explicitly changes it.
3. Add focused, reviewable changes.
4. Include tests and migration notes for behavior that touches contracts.
5. Run quality checks before creating PRs.

---

## 📄 License

MIT — see [LICENSE](LICENSE).  
Security: [SECURITY.md](SECURITY.md).  
Code of conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## 🏷️ Release status

- Current release: First release.
- Distribution state: Public-first open source (GitHub linked above).
- Default posture: Safe demo mode until you explicitly enable production publishing.

---

## 📞 Contact

- Instagram: [@aurendor](https://www.instagram.com/aurendor/)
- Email: [mohammedj@aurendor.io](mailto:mohammedj@aurendor.io)
