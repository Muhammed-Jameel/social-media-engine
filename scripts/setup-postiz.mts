import { randomBytes } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { projectRoot } from "@aurendor/db";

const root = projectRoot();
const directory = join(root, ".postiz");
const path = join(directory, ".env");
const lock = process.argv.includes("--lock");

await mkdir(directory, { recursive: true, mode: 0o700 });

if (lock) {
  if (!existsSync(path)) throw new Error("Run pnpm postiz:setup before locking registration.");
  const existing = await readFile(path, "utf8");
  const updated = existing.match(/^POSTIZ_DISABLE_REGISTRATION=/m)
    ? existing.replace(/^POSTIZ_DISABLE_REGISTRATION=.*$/m, "POSTIZ_DISABLE_REGISTRATION=true")
    : `${existing.trimEnd()}\nPOSTIZ_DISABLE_REGISTRATION=true\n`;
  await writeFile(path, updated, { mode: 0o600 });
  await chmod(path, 0o600);
  console.log("Postiz registration is locked. Restart Postiz with pnpm postiz:up.");
  process.exit(0);
}

if (existsSync(path)) {
  const existing = await readFile(path, "utf8");
  const mainUrl = existing.match(/^POSTIZ_MAIN_URL=(.+)$/m)?.[1]?.trim();
  const localHttp = mainUrl ? /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(mainUrl) : false;
  if (localHttp && !existing.match(/^POSTIZ_NOT_SECURED=/m)) {
    await writeFile(path, `${existing.trimEnd()}\nPOSTIZ_NOT_SECURED=true\n`, { mode: 0o600 });
    await chmod(path, 0o600);
    console.log("Enabled Postiz localhost cookie compatibility at .postiz/.env.");
  } else {
    console.log("Postiz runtime configuration already exists at .postiz/.env; it was not overwritten.");
  }
  process.exit(0);
}

const secret = () => randomBytes(32).toString("hex");
const contents = `POSTIZ_IMAGE_TAG=v2.23.0
POSTIZ_MAIN_URL=http://localhost:4007
POSTIZ_PORT=4007
POSTIZ_NOT_SECURED=true
POSTIZ_JWT_SECRET=${secret()}
POSTIZ_DATABASE_PASSWORD=${secret()}
TEMPORAL_DATABASE_PASSWORD=${secret()}
POSTIZ_DISABLE_REGISTRATION=false
POSTIZ_API_LIMIT=90
X_API_KEY=
X_API_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
TIKTOK_CLIENT_ID=
TIKTOK_CLIENT_SECRET=
OPENAI_API_KEY=
`;

await writeFile(path, contents, { mode: 0o600 });
await chmod(path, 0o600);
console.log("Created private Postiz runtime configuration at .postiz/.env.");
console.log("Start the service with pnpm postiz:up, create the administrator, then run pnpm postiz:lock.");
