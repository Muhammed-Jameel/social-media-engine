import { createHash } from "node:crypto";
import type { DatabaseClient } from "./client";

export class DatabaseWebhookReplayStore {
  constructor(private readonly database: DatabaseClient) {}

  async reserve(key: string, expiresAt: Date): Promise<boolean> {
    const keyHash = createHash("sha256").update(key).digest("hex");
    const result = await this.database.query(
      `INSERT INTO webhook_replay_keys (key_hash, expires_at)
       VALUES ($1, $2)
       ON CONFLICT (key_hash) DO NOTHING`,
      [keyHash, expiresAt.toISOString()],
    );
    return result.rowCount === 1;
  }

  async purgeExpired(): Promise<number> {
    const result = await this.database.query("DELETE FROM webhook_replay_keys WHERE expires_at < now()");
    return result.rowCount;
  }
}
