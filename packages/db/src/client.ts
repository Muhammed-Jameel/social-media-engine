import { existsSync } from "node:fs";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { Pool, type QueryResultRow } from "pg";

export type SqlRow = QueryResultRow;

export interface DatabaseClient {
  readonly kind: "pglite" | "postgres";
  query<T extends SqlRow = SqlRow>(sql: string, parameters?: readonly unknown[]): Promise<{ rows: T[]; rowCount: number }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

function findProjectRoot(start = process.cwd()): string {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, "pnpm-workspace.yaml"))) return current;
    const parent = resolve(current, "..");
    if (parent === current) throw new Error(`Unable to locate AURENDOR engine root from ${start}`);
    current = parent;
  }
}

export function projectRoot(): string {
  return process.env.AURENDOR_ENGINE_ROOT ? resolve(process.env.AURENDOR_ENGINE_ROOT) : findProjectRoot();
}

class PGliteClient implements DatabaseClient {
  readonly kind = "pglite" as const;
  constructor(private readonly client: PGlite) {}

  async query<T extends SqlRow = SqlRow>(sql: string, parameters: readonly unknown[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const result = await this.client.query<T>(sql, [...parameters]);
    return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
  }

  async exec(sql: string): Promise<void> {
    await this.client.exec(sql);
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

class PostgresClient implements DatabaseClient {
  readonly kind = "postgres" as const;
  constructor(private readonly pool: Pool) {}

  async query<T extends SqlRow = SqlRow>(sql: string, parameters: readonly unknown[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const result = await this.pool.query<T>(sql, [...parameters]);
    return { rows: result.rows, rowCount: result.rowCount ?? result.rows.length };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export async function createDatabase(options: { memory?: boolean } = {}): Promise<DatabaseClient> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl && !options.memory) {
    return new PostgresClient(new Pool({ connectionString: databaseUrl, max: 10 }));
  }

  const configuredDir = process.env.PGLITE_DATA_DIR?.trim() || ".data/pglite";
  const dataDir = options.memory
    ? "memory://"
    : isAbsolute(configuredDir)
      ? configuredDir
      : join(/* turbopackIgnore: true */ projectRoot(), configuredDir);
  if (!options.memory) await mkdir(dirname(dataDir), { recursive: true });
  const client = await PGlite.create(dataDir);
  return new PGliteClient(client);
}

export async function migrateDatabase(database: DatabaseClient): Promise<void> {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  const migrationDirectory = join(projectRoot(), "packages", "db", "src", "migrations");
  const migrationFiles = (await readdir(migrationDirectory)).filter((file) => file.endsWith(".sql")).sort();
  const applied = await database.query<{ version: string }>("SELECT version FROM schema_migrations");
  const versions = new Set(applied.rows.map((row) => row.version));

  for (const file of migrationFiles) {
    if (versions.has(file)) continue;
    const sql = await readFile(join(migrationDirectory, file), "utf8");
    await database.exec(sql);
    await database.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
  }
}

declare global {
  var __aurendorDatabase: Promise<DatabaseClient> | undefined;
}

export async function getDatabase(): Promise<DatabaseClient> {
  globalThis.__aurendorDatabase ??= createDatabase().then(async (database) => {
    await migrateDatabase(database);
    return database;
  });
  return globalThis.__aurendorDatabase;
}
