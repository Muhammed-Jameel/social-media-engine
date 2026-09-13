# Runtime contracts

Resolve `scripts/sme.py` inside the installed plugin. Run using Python 3.10+.
Every stateful command uses:
`python3 PATH/sme.py --workspace ABSOLUTE_WORKING_FOLDER --brand BRAND COMMAND`.
Use `python` instead if appropriate for the host. Quote paths containing spaces.
Keep temporary input JSON in the user's PRIVATE working area and out of public Git.

Commands output JSON; failures exit nonzero with an error object. Never continue as if
a failed mutation succeeded. `--help` on a subcommand lists required switches.

## Brand
- `brands`: list brand IDs in this working folder.
- `questionnaire`: field groups.
- `status`: state, missing fields, next group, and profile if it exists.
- `brand-update --file answers.json --actor "Owner"`: merge actual questionnaire answers.
- `brand-approve --hash HASH --actor "Owner"`: hash is `status.profile.hash`.
- `context`: approved profile, brand_hash, rules, assets, context_hash.
- `snapshot`: brand status, plans, items, revisions, reviews, assets, rules, dispatches,
  metric snapshots and latest audit events.
- `asset-import --file ABSOLUTE_FILE --role logo --rights owned --note "Owner supplied" --actor "Owner"`.
  Roles: logo/font/guideline/reference/product/output/audio.
  Rights: owned/licensed/reference-only/unknown. Non-output imports invalidate the brief.
  Returned asset record includes ID, workspace-relative path, SHA-256, and rights.

Answers are JSON objects. List fields: offers, competitors, audiences, markets, languages,
preferred_terms, forbidden_words, colors, fonts, references, avoid, goals, platforms.
All other questionnaire fields are strings. Colors use six-digit hex. Languages use
tags such as en, ar-IQ, ja. Platform identifiers are lowercase. Use IANA time zones,
not ambiguous abbreviations. No passwords or provider keys in these files.

## Monthly plan
`plan-import --file plan.json --actor "Owner"`
```json
{
  "id": "october-workshops",
  "brand_hash": "COPY_FROM_CONTEXT",
  "month": "2026-10",
  "strategy": "Build practical brewing trust before inviting people to the workshop.",
  "items": [{
    "id": "brew-one-variable",
    "title": "Change one thing, learn something",
    "objective": "Help home brewers diagnose their next cup",
    "audience": "Busy home brewers",
    "message": "A repeatable baseline makes an adjustment easier to understand.",
    "pillar": "Practical education",
    "format": "carousel",
    "language": "en",
    "platforms": ["instagram"],
    "cta": "Save the checklist for your next brew.",
    "scheduled_at": "2026-10-05T10:00:00+01:00",
    "evidence": []
  }]
}
```
Dates must fall within the requested month in the brand timezone. IDs are immutable;
use a new plan ID for changes and preserve the prior plan.

## Content
Create an item skeleton with ID, optional plan_id, and actual variants.
Run `context --item-file item.json`; copy its brand_hash and context_hash into the item.
Use `item-save --file item.json`. Do not include runtime-produced hash/status/revision
fields when saving a revision. Recompute context before each generation/revision.

```json
{
  "id": "brew-one-variable",
  "plan_id": "october-workshops",
  "title": "Change one thing, learn something",
  "producer": "ACTUAL_PRODUCER_ID",
  "brand_hash": "COPY_FROM_ITEM_CONTEXT",
  "context_hash": "COPY_FROM_ITEM_CONTEXT",
  "variants": [{
    "platform": "instagram",
    "language": "en",
    "caption": "Your next brew is easier to understand when you change one thing at a time.",
    "format": "carousel",
    "asset_ids": ["ACTUAL_FIRST_ASSET_ID", "ACTUAL_SECOND_ASSET_ID"],
    "alt_text": ["Description of the first slide", "Description of the second slide"],
    "adaptation": "A saveable visual checklist, with a caption that adds context."
  }],
  "evidence": [],
  "claims": [],
  "creative": {"idea": "A calm, practical experiment", "editable_source": "PRIVATE_SOURCE_REFERENCE"}
}
```
These are schema illustrations, NOT approved content, genuine evidence, or usable hashes.
Formats: text/image/carousel/video/story/document. A text variant cannot carry hidden
media. Assets must match the format, have publication rights and unmodified bytes.
Claims, if supplied, need text, source, and verified:true only after actual verification.
Configured forbidden_words are checked against caption text with Unicode normalization.

## Reviews and approval
`review-add --id ITEM --file review.json`
Review fields: role, reviewer, item_hash, decision, observations (nonempty string array),
hard_fails (string array), scores (all eight numeric dimensions 0-20).
For visual/Arabic roles: actual_pixels_inspected:true, scales:["original","mobile"],
asset_hashes:{ASSET_ID:ACTUAL_SHA256}, checks:{CHECK_NAME:true}.
See review.md for exact applicable checks and truthful evidence requirements.
Each role's latest review for the current hash is authoritative; old revisions remain
in history. Never create passing review fixtures in a real brand workspace.

`item-approve --id ITEM --hash CURRENT_ITEM_HASH --actor "Owner"`
`export --id ITEM` returns an absolute export directory and MANUAL_HANDOFF, not publication.
`dashboard --port 0` starts a local owner UI and prints its private URL.

## Feedback
`feedback --file feedback.json`
```json
{
  "id": "concise-instagram-covers",
  "instruction": "Keep Instagram captions concise without losing the useful instruction.",
  "category": "mandatory",
  "scope": {"platform": "instagram"},
  "constraints": {"max_caption_chars": 900, "forbidden_terms": ["miracle"]},
  "actor": "Owner"
}
```
Categories: fact/mandatory/preference/performance. Scope: item/campaign/platform/language;
empty object is brand-wide. Optional expires_at is offset-aware ISO datetime.
Optional deterministic constraints: forbidden_terms, required_terms, max_caption_chars.
These apply to captions only, not visual text, source media, or arbitrary natural-language
instructions. Scope restrictions are conjunctive; unset dimensions match all.
`rule-approve --id RULE --actor "Owner"` activates; `rule-retire` retires.
Conflicting constraints block content instead of silently choosing a winner.

## Postiz
Read only: `accounts`; `provider-posts --start ISO_DATETIME --end ISO_DATETIME`.
Prepare: `dispatch-prepare --file intent.json`.
```json
{
  "id": "october-brew-dispatch",
  "item_id": "brew-one-variable",
  "operation": "schedule",
  "date": "2026-10-05T10:00:00+01:00",
  "bindings": [{
    "platform": "instagram",
    "language": "en",
    "account_id": "ACTUAL_CONNECTED_ACCOUNT_ID",
    "settings": {"__type": "instagram", "post_type": "post"},
    "capability_evidence": "ACTUAL_CURRENT_PROVIDER_CAPABILITY_CHECK"
  }]
}
```
Provider-specific required settings may be more extensive; consult the selected provider.
Use the exact provider identifier (for example instagram-standalone where returned).
The examples are not a current capability guarantee or permission to send.

After showing intent and receiving explicit confirmation, run with
`SOCIAL_ENGINE_ALLOW_PUBLISH=true` in the command environment:
`dispatch-send --id INTENT --hash CONFIRMATION_HASH --actor "Owner" --send`.
Without either gate, no send. Never retry SENDING/UNKNOWN/ACCEPTED.
`dispatch-cancel-local --id INTENT --actor "Owner"` is allowed only before a posts call.
It does NOT cancel a provider schedule.
`dispatch-reconcile --id INTENT --file evidence.json --actor "Owner"` records source,
explanation, post_ids, and state. Supported states: SCHEDULED/PUBLISHED/FAILED/CANCELLED/
DRAFT/MANUAL_COMPLETION/NOT_FOUND. TikTok UPLOAD publication needs tiktok_public_url.
Use real provider evidence, never infer publication from a submitted request.

## Analytics
`metrics-import --file metrics.json`
Required fields: id, item_id, source, platform, provider_post_id, captured_at (ISO),
synthetic (explicit boolean), metrics (name:number or null), definitions (name:string),
raw_evidence (source reference). Snapshot IDs are immutable.
No provider data is fetched implicitly by this command. Real exports/API responses must
be gathered separately with authorization. Never turn synthetic fixtures into a report.
