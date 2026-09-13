# Provider Capability Matrix

**Verified:** 2026-08-23  
**Method:** Official first-party documentation only. Runtime capability probing still determines account-level availability.

## Summary policy

- Canva is a creative/edit/export provider, not a social scheduler.
- Facebook Pages, Instagram professional accounts, and LinkedIn organization pages can be automated after OAuth, scopes, review, storage, sandbox, and first-publish validation.
- TikTok is draft upload/manual handoff for this internal SOCIAL_MEDIA_PLUGIN utility. Its current Direct Post guidelines reject private/internal upload utilities as an acceptable audited public client.
- YouTube stays optional until account need and audit readiness are confirmed.
- Every adapter exposes granular capability state and never maps “not configured” to “supported in production.”

## Postiz gateway

Account setup recheck — 2026-09-08: X OAuth succeeded for `@social_media_plugin_io`; no live post was tested, and its developer console showed zero credits. LinkedIn organization OAuth completed after the owner obtained Advertising API access, and Postiz saved the Social Media Plugin Page. TikTok sandbox is saved for target `social-media-plugin.io`, with only `user.info.basic` and `video.upload`; private credentials are installed. A pinned, hash-guarded upload-only Postiz patch prevents upstream's broad-scope request and rejects Direct Post in both backend and worker. Its 11 contract checks and 10 existing gateway/executor tests passed. Live sandbox OAuth and a two-photo inbox handoff succeeded on Postiz's side; owner mobile confirmation remains pending. Production upload access is not yet approved. See [setup evidence](../setup/POSTIZ.md). These are configuration/sandbox observations, not production capability grants.

| Area | Verified capability | Engine behavior |
|---|---|---|
| Deployment | Postiz supports self-hosting and exposes a Public API | Pin the container version and bind the local instance to loopback by default |
| Provider coverage | Postiz integrations cover Instagram, Facebook, LinkedIn, TikTok, and X | Use one server-side gateway while retaining platform-specific copy and settings |
| Public API | Integration listing, media upload, and post creation are documented | Validate every response, keep the API key server-side, and store the exact request before dispatch |
| Scheduling | The post-create request supports draft, schedule, and immediate modes | Default to draft; live modes require independent SOCIAL_MEDIA_PLUGIN gates |
| Policy | Postiz cannot remove provider app review, scopes, rate limits, or TikTok audit requirements | Keep provider restrictions explicit and require supervised account-level validation |

Official sources: [Self-hosting](https://docs.postiz.com/installation/docker-compose), [Public API](https://docs.postiz.com/public-api/introduction), [Create posts](https://docs.postiz.com/public-api/posts/create), [Upload](https://docs.postiz.com/public-api/uploads/upload-file), [Integrations](https://docs.postiz.com/public-api/integrations/list).

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
| Auth | Three-legged OAuth; organization publish/read/community scopes are vetted | Prioritize SOCIAL_MEDIA_PLUGIN organization page |
| Formats | Text, single image/video, document, article, poll and MultiImage (2–20 images) | Convert organic “carousel” execution to MultiImage or document as appropriate |
| Carousel | Organic carousel is unsupported; carousel is sponsored-only | Never submit an organic carousel media type |
| Scheduling | Creation accepts `PUBLISHED`; no future scheduler | Internal durable scheduler publishes at due time |
| Analytics | Organization page/follower/share/video stats; member post stats vary by scope | Account-specific metric registry |
| Comments | Comments, replies and reactions through Community Management APIs | Ingest/classify; no auto public replies |
| Access | Development then vetted Standard tier with working integration/screencast | `UNAVAILABLE_PERMISSION` until approved |

Official sources: [OAuth](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow), [Permissions](https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access?view=li-lms-2026-07), [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-06), [Community Management](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview?view=li-lms-2026-06).

## TikTok

**Sandbox canary — 2026-09-08:** Social Media Plugin OAuth is connected. One owner-authorized two-photo `MEDIA_UPLOAD` test completed through Postiz at 06:07:21 UTC, with an inbox release URL and no error. This verifies the sandbox photo handoff on Postiz's side; owner mobile-inbox confirmation is pending. Postiz's `PUBLISHED` label is not public-publication evidence for `UPLOAD`. Video, production review, and unattended public posting remain unverified/disabled. [Audit record](../operations/TIKTOK-SANDBOX-CANARY-20260908.json).

| Area | Official capability | Engine behavior |
|---|---|---|
| Auth | Upload uses `video.upload`; basic identity uses `user.info.basic` | Request only these two sandbox scopes; no Direct Post permission |
| Direct Post | Video/photo direct post with current creator info, editable metadata, and explicit consent | Disabled for this internal utility |
| Unaudited state | Posts are `SELF_ONLY`; maximum five active posting users in 24 hours | Never represent as public automation |
| Audit policy | Client must target a wide creator audience; internal/private account-management uploader is explicitly not acceptable | Hard capability state `UNAVAILABLE_POLICY` for unattended public post |
| Draft upload | Uploads content to TikTok for creator completion | Supported manual handoff route |
| Scheduling | No future-time parameter documented | Notification/manual completion |
| Analytics | Owned video counts require additional scopes | Unavailable in this basic/upload-only sandbox; return no data |
| Comments | General comment bodies are not part of ordinary creator management; Research API is separately restricted | Mark unsupported for this product |

Official sources: [Content Posting get started](https://developers.tiktok.com/docs/en/content-posting-api-get-started), [Direct Post](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post), [Upload draft](https://developers.tiktok.com/docs/en/content-posting-api-get-started-upload-content), [Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines/), [Video query](https://developers.tiktok.com/docs/en/tiktok-api-v2-video-query).

Upload-only implementation review (2026-09-08): [User info field scopes](https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info/), [media transfer requirements](https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide/), and [Postiz TikTok setup](https://docs.postiz.com/self-host/providers/tiktok). Video uploads use `FILE_UPLOAD` in deployed v2.23.0; photo URLs must belong to the verified media domain. Inbox completion still requires the user to review and post in TikTok. No typed SOCIAL_MEDIA_PLUGIN contract change: existing `UPLOAD` manual-handoff semantics remain in force.

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
# Five-platform campaign package — 2026-09-08

The new campaign bridge requires an exact owner-approved variant for Instagram, Facebook, TikTok, X and LinkedIn at one shared schedule time. Partial batches and post-approval caption/account/media changes are blocked. Each native media set is uploaded independently (cached by verified content hash). Provider acknowledgements are not public-delivery confirmations.

- LinkedIn document-style image carousel uses `post_as_images_carousel: true` plus `carousel_name`; false is a collage. Sources: https://docs.postiz.com/public-api/providers/linkedin and https://docs.postiz.com/public-api/providers/linkedin-page (checked 2026-09-08).
- Instagram single-video Reel delivery uses `post_type: post`; Story delivery is separate. Source: https://docs.postiz.com/public-api/providers/instagram (checked 2026-09-08).
- The campaign bridge explicitly keeps TikTok in UPLOAD mode. Sandbox inbox handoff was tested separately; public direct delivery is not claimed. Interactive Stories remain a native handoff.
- Platform dimension targets are editorial composition choices, not a replacement for current account/API capability checks. No live all-five canary has been performed for this new bridge.

## Live learning adapter — 10 September2026

Added schema-validated GET /posts (UTC startDate/endDate) and GET /analytics/post/{postId}?date=7. Read-only deployed probes returned real Instagram and LinkedIn data; Facebook returned no values for tested posts. Preserve unavailable metrics as null, unknown labels/series raw, and actual timestamps. No automatic extrapolation of provider coverage. TikTok inbox URLs are excluded from public-post totals; existing X ERROR requires diagnosis. Source and operating detail: docs/operations/SOCIAL_PUBLISHING_AND_LEARNING.md. This is deployed read evidence, not a successful all-five publishing canary.
