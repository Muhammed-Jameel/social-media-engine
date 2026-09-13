import { existsSync } from "node:fs";

type PostRecord = {
  id?: string;
  state?: string;
  error?: unknown;
  errorMessage?: unknown;
};

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

let base = (process.env.POSTIZ_API_URL ?? "").replace(/\/$/u, "");
if (!base.endsWith("/public/v1")) {
  base += "/public/v1";
}

const response = await fetch(
  base + "/posts?" + new URLSearchParams({ startDate: "2026-09-01T00:00:00Z", endDate: "2026-10-01T00:00:00Z" }),
  { headers: { Authorization: process.env.POSTIZ_API_KEY ?? "" } },
);

const payload = (await response.json()) as { posts?: unknown[] };
const posts = Array.isArray(payload.posts) ? payload.posts : [];

for (const post of posts) {
  if (typeof post !== "object" || post === null) continue;
  const p = post as PostRecord;
  if (p.state === "ERROR") {
    console.log(JSON.stringify({ id: p.id, error: p.error, errorMessage: p.errorMessage, keys: Object.keys(p) }));
  }
}
