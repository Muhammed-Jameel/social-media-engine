import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import { parseEnv } from 'node:util';
import { join, resolve } from 'node:path';
import net from 'node:net';
import { getDatabase } from '../packages/db/src/client';
import { SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, SOCIAL_MEDIA_PLUGIN_OWNER_ID, isEnginePaused } from '../packages/db/src/ids';
import { atomicJson, withOperationsLock } from '../packages/engine/src/social-operations-store';

// One-time activation expressly requested by the owner after personally creating
// their password. Never overwrite a password or a valid existing session secret.
const root = resolve(import.meta.dirname, '..');
if (!process.argv.includes('--owner-setup-complete')) throw Error('Owner setup completion is required.');
await withOperationsLock(root, async () => {
  const listening = await new Promise<boolean>(done => {
    const socket = net.connect(3010, '127.0.0.1');
    socket.once('connect', () => { socket.destroy(); done(true); });
    socket.once('error', () => done(false));
  });
  if (listening) throw Error('Stop the local dashboard before opening its embedded database.');
  const file = join(root, '.env.local');
  const original = await readFile(file, 'utf8');
  const env = parseEnv(original);
  if (!env.OWNER_EMAIL?.trim() || !/^scrypt:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/.test(env.OWNER_PASSWORD_HASH || '') || env.DEMO_MODE !== 'false') throw Error('Real owner password setup is incomplete.');
  if (isEnginePaused(env)) throw Error('Global pause is active; preserved.');
  const initializedSession = (env.OWNER_SESSION_SECRET?.trim().length || 0) < 32;
  const changes: Record<string, string> = { DEMO_MODE: 'false', DRY_RUN: 'false', PRODUCTION_PUBLISHING_ENABLED: 'true' };
  if (initializedSession) changes.OWNER_SESSION_SECRET = randomBytes(48).toString('base64url');
  let updated = original;
  for (const [key, value] of Object.entries(changes)) {
    const pattern = new RegExp(`^${key}[ \\t]*=.*$`, 'gm');
    updated = pattern.test(updated) ? updated.replace(pattern, () => `${key}="${value}"`) : `${updated.trimEnd()}\n${key}="${value}"\n`;
  }
  Object.assign(process.env, env, changes);
  const database = await getDatabase();
  let previous: unknown;
  try {
    await database.transaction(async db => {
      const rows = await db.query('SELECT dry_run, production_publishing_enabled, paused FROM engine_settings WHERE organization_id=$1', [SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID]);
      const before = rows.rows[0];
      if (!before || before.paused) throw Error('Database pause is active or settings missing; preserved.');
      previous = before;
      await db.query('UPDATE engine_settings SET dry_run=false, production_publishing_enabled=true, updated_at=now() WHERE organization_id=$1', [SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID]);
      await db.query(`INSERT INTO audit_logs (id,organization_id,actor_id,action,entity_type,entity_id,previous_state,new_state,reason,trace_id) VALUES ($1,$2,$3,'ACTIVATE_REVIEWED_PUBLISHING','engine_settings',$2,$4::jsonb,$5::jsonb,$6,$7)`, [randomUUID(), SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, SOCIAL_MEDIA_PLUGIN_OWNER_ID, JSON.stringify(before), JSON.stringify({dry_run:false,production_publishing_enabled:true,paused:false}), 'Owner requested automatic scheduling of six reviewed September pieces, supplied email, and personally completed password setup. Independent release hashes and global pause remain enforced.', randomUUID()]);
    });
  } finally { await database.close(); }
  // A failure before this write leaves runtime publication flags closed.
  const temporary = `${file}.activation-${randomUUID()}`;
  await writeFile(temporary, updated, { mode: 0o600, flag: 'wx' });
  await rename(temporary, file);
  const report = { at: new Date().toISOString(), previous, ownerPasswordPreserved:true, initializedMissingSessionKey:initializedSession, liveFlagsRequested:true, pausePreserved:true, publicationRequestsSent:0 };
  await atomicJson(join(root, 'artifacts/social-learning/qa/production-activation.json'), report);
  console.log(JSON.stringify(report));
});
