import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { projectRoot } from "@social-media-plugin/db";

const POSTIZ_APP_CONTAINER = "postiz-postiz-1";
const POSTIZ_DATABASE_CONTAINER = "postiz-postiz-postgres-1";

function docker(args: string[], input?: string): string {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    input,
    maxBuffer: 1024 * 1024,
  });

  if (result.status !== 0) {
    const detail = result.stderr.trim().split("\n").at(-1) || "Docker command failed.";
    throw new Error(detail);
  }

  return result.stdout.trim();
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

const root = projectRoot();
const privateDirectory = join(root, ".postiz");
const credentialsPath = join(privateDirectory, "admin-credentials");
const dashboardEnvironmentPath = join(root, ".env.local");

const accountRow = docker([
  "exec",
  POSTIZ_DATABASE_CONTAINER,
  "psql",
  "-U",
  "postiz-user",
  "-d",
  "postiz-db",
  "-At",
  "-F",
  "\t",
  "-c",
  `SELECT u.id, u.email, o."apiKey"
   FROM "User" u
   JOIN "UserOrganization" uo ON uo."userId" = u.id
   JOIN "Organization" o ON o.id = uo."organizationId"
   WHERE u."providerName" = 'LOCAL'
   ORDER BY u."createdAt" DESC
   LIMIT 1;`,
]);

const [userId, email, apiKey] = accountRow.split("\t");
if (!userId || !/^[A-Za-z0-9_-]+$/.test(userId) || !email || !email.includes("@") || !apiKey) {
  throw new Error("Could not resolve the newest local Postiz administrator and organization API key.");
}

const temporaryPassword = `Postiz-${randomBytes(18).toString("base64url")}`;
const passwordHash = docker([
  "exec",
  "-i",
  POSTIZ_APP_CONTAINER,
  "node",
  "-e",
  `const bcrypt = require('bcrypt');
   let password = '';
   process.stdin.setEncoding('utf8');
   process.stdin.on('data', (chunk) => { password += chunk; });
   process.stdin.on('end', async () => process.stdout.write(await bcrypt.hash(password, 10)));`,
], temporaryPassword);

if (!/^\$2[aby]\$10\$/.test(passwordHash)) throw new Error("Postiz did not return a valid bcrypt password hash.");

const updateResult = docker([
  "exec",
  "-i",
  POSTIZ_DATABASE_CONTAINER,
  "psql",
  "-U",
  "postiz-user",
  "-d",
  "postiz-db",
  "-At",
  "-v",
  "ON_ERROR_STOP=1",
], `UPDATE "User"
    SET password = ${sqlLiteral(passwordHash)}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${sqlLiteral(userId)};
    SELECT COUNT(*) FROM "User" WHERE id = ${sqlLiteral(userId)} AND password = ${sqlLiteral(passwordHash)};
`);

if (updateResult.split("\n").at(-1) !== "1") throw new Error("The Postiz administrator password was not updated.");

await mkdir(privateDirectory, { recursive: true, mode: 0o700 });
await writeFile(credentialsPath, [
  `POSTIZ_ADMIN_EMAIL=${email}`,
  `POSTIZ_ADMIN_TEMPORARY_PASSWORD=${temporaryPassword}`,
  `POSTIZ_API_KEY=${apiKey}`,
  "",
].join("\n"), { mode: 0o600 });
await chmod(credentialsPath, 0o600);

const dashboardEnvironment = await readFile(dashboardEnvironmentPath, "utf8");
const updatedDashboardEnvironment = dashboardEnvironment.match(/^POSTIZ_API_KEY=/m)
  ? dashboardEnvironment.replace(/^POSTIZ_API_KEY=.*$/m, `POSTIZ_API_KEY=${apiKey}`)
  : `${dashboardEnvironment.trimEnd()}\nPOSTIZ_API_KEY=${apiKey}\n`;
await writeFile(dashboardEnvironmentPath, updatedDashboardEnvironment, { mode: 0o600 });
await chmod(dashboardEnvironmentPath, 0o600);

console.log("The newest local Postiz administrator password was reset.");
console.log("Temporary credentials were stored privately at .postiz/admin-credentials (mode 0600).");
console.log("The matching organization API key was added to .env.local without being printed.");
