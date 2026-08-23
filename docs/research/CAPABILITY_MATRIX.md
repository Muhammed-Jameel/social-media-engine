# Provider Capability Matrix

**Verified:** 2026-08-23  
**Method:** Official first-party documentation only. Runtime capability probing still determines account-level availability.

## Summary policy

- Canva is a creative/edit/export provider, not a social scheduler.
- Facebook Pages, Instagram professional accounts, and LinkedIn organization pages can be automated after OAuth, scopes, review, storage, sandbox, and first-publish validation.
- TikTok is draft upload/manual handoff for this internal AURENDOR utility. Its current Direct Post guidelines reject private/internal upload utilities as an acceptable audited public client.
- YouTube stays optional until account need and audit readiness are confirmed.
- Every adapter exposes granular capability state and never maps “not configured” to “supported in production.”

## OpenAI

| Capability | Current finding | Engine policy |
|---|---|---|
| Model | `gpt-5.6-sol` is the frontier model; the `gpt-5.6` alias routes to it | Pin task policy centrally; benchmark snapshots before production changes |
| API | Responses API supports reasoning, tools, persisted reasoning, and structured outputs | Use Responses API; JSON Schema for agent contracts |
| Input | Text and image input are supported | Use image input for rendered-creative critique when configured |
| Tools | Web/file search, image generation, code interpreter, functions, skills, MCP and more are listed for GPT-5.6 Sol | Expose only role-appropriate tools; models never receive publish authority |
| Reasoning | `none`, `low`, `medium`, `high`, `xhigh`, and `max` | Frontier judgment defaults to intentional policy, then eval for quality/cost |
| Live state | No project key verified | Fixture adapter and offline evals; capability `NOT_CONFIGURED` |

Official sources: [GPT-5.6 guidance](https://developers.openai.com/api/docs/guides/latest-model), [GPT-5.6 Sol model](https://developers.openai.com/api/docs/models/gpt-5.6-sol), [Responses API](https://developers.openai.com/api/reference/resources/responses).

## Canva Connect

| Area | Official capability | State before account verification |
|---|---|---|
| Auth | OAuth 2.0 Authorization Code with PKCE S256 and granular scopes | `NOT_CONFIGURED` |
| Design | Create/copy designs, asset upload, Brand Templates/Autofill where entitled | `UNAVAILABLE_PLAN` until probed |
| Export | JPG, PNG, GIF, MP4, PDF, PPTX, CSV and HTML export routes | `NOT_CONFIGURED` |
| Social scheduling | No documented social-network publish/schedule endpoint | `MANUAL_HANDOFF_REQUIRED` |
| Comments/analytics | Design comments and design-view analytics are preview; they are not social comments/performance | `PREVIEW` |
| Entitlement | Brand Template/Autofill and analytics require Canva Enterprise; preview APIs cannot support public-integration review | Probe account; deterministic renderer stays available |

Official sources: [Authentication](https://www.canva.dev/docs/connect/authentication/), [Designs](https://www.canva.dev/docs/connect/api-reference/designs/), [Exports](https://www.canva.dev/docs/connect/api-reference/exports/), [Autofill](https://www.canva.dev/docs/connect/autofill-guide/), [Integration review](https://www.canva.dev/docs/connect/submitting-integrations/).

## Instagram

| Area | Official capability | Engine behavior |
|---|---|---|
| Accounts/auth | Professional accounts; Business Login for Instagram or linked-Page Facebook Login routes with publish/insight/comment scopes | OAuth adapter and explicit account binding |
| Formats | JPEG image, video/Reel, up-to-10-item mixed carousel, and Stories where login/account route supports them | Validate format and account capability per job |
| Scheduling | No future publish field is documented | Internal durable scheduler calls create + publish at due time |
| Media access | Provider must fetch public media URLs | Production requires verified S3/R2 public media delivery |
| Analytics | Account/media insights | Preserve raw payload and normalize supported metric registry |
| Comments | Retrieval, replies, moderation and webhooks supported with scopes | Ingest/classify only; no auto public replies |
| Limit | Current documented API-published content limit is 100 per rolling 24 hours | Preflight rate budget |

Official sources: [Meta’s official Instagram API workspace](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api), [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/).

## Facebook Pages

| Area | Official capability | Engine behavior |
|---|---|---|
| Auth | User token to Page access token with Page tasks and scopes | Least-scope account adapter |
| Formats | Feed, photo, video and Reel endpoints | Format-specific adapter |
| Scheduling | Feed supports `published=false` and `scheduled_publish_time`; documented window 10 minutes–30 days | Prefer native scheduling only after contract tests; otherwise internal scheduler |
| Analytics | Page/post insights | Metric registry tolerates deprecation/drift |
| Comments | Read, reply and moderate with appropriate scopes | Ingest only by default |
| Access | External-client assets need Advanced Access/App Review | Owned-account status must still be verified |

Official sources: [Page Posts](https://developers.facebook.com/docs/pages-api/posts/), [Page Insights](https://developers.facebook.com/docs/graph-api/reference/page/insights/), [Comments](https://developers.facebook.com/docs/graph-api/reference/object/comments/), [Meta official Facebook API workspace](https://www.postman.com/meta/facebook/documentation/r56bjfd/facebook-api).

## LinkedIn

| Area | Official capability | Engine behavior |
|---|---|---|
| Auth | Three-legged OAuth; organization publish/read/community scopes are vetted | Prioritize AURENDOR organization page |
| Formats | Text, single image/video, document, article, poll and MultiImage (2–20 images) | Convert organic “carousel” execution to MultiImage or document as appropriate |
| Carousel | Organic carousel is unsupported; carousel is sponsored-only | Never submit an organic carousel media type |
| Scheduling | Creation accepts `PUBLISHED`; no future scheduler | Internal durable scheduler publishes at due time |
| Analytics | Organization page/follower/share/video stats; member post stats vary by scope | Account-specific metric registry |
| Comments | Comments, replies and reactions through Community Management APIs | Ingest/classify; no auto public replies |
| Access | Development then vetted Standard tier with working integration/screencast | `UNAVAILABLE_PERMISSION` until approved |

Official sources: [OAuth](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow), [Permissions](https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access?view=li-lms-2026-07), [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-06), [Community Management](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview?view=li-lms-2026-06).

## TikTok

| Area | Official capability | Engine behavior |
|---|---|---|
| Auth | User OAuth; `video.publish`, `video.upload`, and related approved scopes | Connect only for user-authorized draft handoff |
| Direct Post | Video/photo direct post with current creator info, editable metadata, and explicit consent | Disabled for this internal utility |
| Unaudited state | Posts are `SELF_ONLY`; maximum five active posting users in 24 hours | Never represent as public automation |
| Audit policy | Client must target a wide creator audience; internal/private account-management uploader is explicitly not acceptable | Hard capability state `UNAVAILABLE_POLICY` for unattended public post |
| Draft upload | Uploads content to TikTok for creator completion | Supported manual handoff route |
| Scheduling | No future-time parameter documented | Notification/manual completion |
| Analytics | Owned video counts via creator/video APIs | Limited normalized metrics where authorized |
| Comments | General comment bodies are not part of ordinary creator management; Research API is separately restricted | Mark unsupported for this product |

Official sources: [Content Posting get started](https://developers.tiktok.com/docs/en/content-posting-api-get-started), [Direct Post](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post), [Upload draft](https://developers.tiktok.com/docs/en/content-posting-api-get-started-upload-content), [Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines/), [Video query](https://developers.tiktok.com/docs/en/tiktok-api-v2-video-query).

## YouTube (optional)

| Area | Official capability | Engine behavior |
|---|---|---|
| Auth | OAuth 2.0 with upload/read/analytics scopes | Not configured |
| Upload | `videos.insert`; Shorts eligibility is classified by YouTube | Video adapter can remain format-neutral |
| Scheduling | Private upload plus `status.publishAt`, provided the video was never public | Native schedule after audit validation |
| Analytics/comments | Channel/video analytics and comment threads/moderation | Optional future adapter |
| Audit | Unaudited API projects force uploaded videos private | Manual handoff until audit readiness |

Official sources: [OAuth](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps), [Videos API](https://developers.google.com/youtube/v3/docs/videos), [Upload](https://developers.google.com/youtube/v3/docs/videos/insert), [Analytics](https://developers.google.com/youtube/analytics/channel_reports).

## Capability-state vocabulary

`AVAILABLE`, `UNAVAILABLE_PERMISSION`, `UNAVAILABLE_PLAN`, `UNAVAILABLE_POLICY`, `PREVIEW`, `MANUAL_HANDOFF_REQUIRED`, and `NOT_CONFIGURED`. These states are stored by capability, not only by provider.

