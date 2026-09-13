# Social Media Engine

**Everything social media, in one plugin.**

Ask your agent: **"Use Social Media Engine to set up my brand."**

The first run collects brand information and assets, saves progress locally, and asks you
to approve the brand brief before generating content. Later runs resume that brand's
workspace. Use a separate brand identifier for each brand.

## Requirements
- Codex or Claude with local skill execution and access to your chosen working folder.
- Python 3.10 or newer; `python3` on macOS/Linux, `python` on Windows.
- An IANA time-zone database. If missing on your machine, install Python's `tzdata`.
- Creative tools are optional, but actual image/video production requires an available
  renderer or generation tool. The plugin does not include model credits.

## What is included
Brand memory, scoped feedback, monthly plans, platform/language variants, asset records,
revision-bound reviews, owner approval, a loopback review dashboard, manual export,
an optional Postiz publishing adapter, and evidence-backed analytics records.

The agent performs creative work using your host's model and available tools.
The runtime stores and checks the workflow. It does not generate media by itself.
Remote accounts, real publishing, analytics permissions, and inbox access require your
own authorized providers. No provider or platform is silently connected.

## Dashboard
Ask: "Open my Social Media Engine review dashboard."
The agent runs `scripts/sme.py --workspace /absolute/working/folder --brand my-brand dashboard`
using Python. Keep that process running. Open the printed URL on the same machine.
Treat its token-bearing URL as private. This is a single-owner local dashboard, not a
publicly deployable multi-user web app.

## Safety and ownership
All data is local under `.social-media-engine/` in the working folder. Keep this folder
out of public repositories. Back up the whole folder while the dashboard is stopped.
Provider calls send selected assets/captions to that provider only after explicit consent.
Do not put credentials in brand answers. Use environment variables outside chat.

A passed review is not a guarantee of quality or platform acceptance. Inspect actual
outputs and approve them. Published content cannot be recalled by deleting local files.
See the bundled skill references for complete workflow and command contracts.

Built by [Aurendor](https://www.instagram.com/aurendor/).
MIT licensed. Support: [mohammedj@aurendor.io](mailto:mohammedj@aurendor.io).
