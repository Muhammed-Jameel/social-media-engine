import { existsSync } from "node:fs";
import { getPostizClient } from "../packages/engine/src/postiz";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

type PostRecord = {
  id?: string;
  state?: string;
  publishDate?: string;
  releaseURL?: string;
  integration?: {
    providerIdentifier?: string;
  };
  settings?: unknown;
  content?: string;
};

const client = getPostizClient();
if (!client) throw new Error("Postiz unavailable");

const integrations = await client.listIntegrations();
console.log(
  JSON.stringify({
    channels: integrations.map((i) => ({ id: i.id, name: i.name, provider: i.providerIdentifier, disabled: i.disabled })),
  }),
);

// Use configured API authentication in memory only; no credential output.
let base = (process.env.POSTIZ_API_URL ?? "").replace(/\/$/u, "");
if (!base.endsWith("/public/v1")) base += "/public/v1";

const response = await fetch(
  `${base}/posts?${new URLSearchParams({ startDate: "2026-09-01T00:00:00Z", endDate: "2026-10-01T00:00:00Z" })}`,
  { headers: { Authorization: process.env.POSTIZ_API_KEY ?? "" }, signal: AbortSignal.timeout(20_000) },
);

const body = (await response.json()) as { posts?: unknown[] };
const posts = Array.isArray(body.posts) ? (body.posts as PostRecord[]) : [];
console.log(
  JSON.stringify({
    status: response.status,
    posts: posts.map((post) => ({
      id: post.id,
      state: post.state,
      publishDate: post.publishDate,
      releaseURL: post.releaseURL,
      provider: post.integration?.providerIdentifier,
      settings: post.settings,
      contentPrefix: post.content?.slice(0, 90),
    })),
    keys: Object.keys(body),
  }),
);
