import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, join, resolve } from 'node:path';
import { getPostizClient, readVerifiedAsset, type PostizUpload } from '../packages/engine/src/postiz';
import { ReleaseSchema, verifySocialRelease } from '../packages/engine/src/social-release';
import { atomicJson, withOperationsLock } from '../packages/engine/src/social-operations-store';

// Explicitly authorized media-library upload only. This command cannot create,
// schedule, or publish posts, and does not change any production/authentication gate.
const root = resolve(import.meta.dirname, '..');
if (existsSync(join(root, '.env.local'))) process.loadEnvFile(join(root, '.env.local'));
const allowed = new Set(['S01', 'B01', 'U01', 'S02', 'B02', 'U02']);
const apply = process.argv.includes('--upload');
type Asset = { path: string; sha256: string; mimeType: string };
type UploadRecord = Asset & { state: 'UPLOADING' | 'UPLOADED' | 'UNCERTAIN'; at: string; receipt?: PostizUpload };
await withOperationsLock(root, async () => {
  const assets = new Map<string, Asset>();
  for (const name of (await readdir(join(root, 'artifacts/social-releases'))).filter(n => n.endsWith('.release.json'))) {
    const release = ReleaseSchema.parse(JSON.parse(await readFile(join(root, 'artifacts/social-releases', name), 'utf8')));
    if (!allowed.has(release.contentId)) continue;
    await verifySocialRelease(root, release);
    for (const variant of release.variants) for (const entry of variant.entries) for (const asset of entry.assets) assets.set(asset.sha256, asset);
  }
  for (const cycle of ['cycle-01', 'cycle-02']) {
    const base = `apps/web/public/monthly-plan/2026-09/editorial/${cycle}`;
    const manifest = JSON.parse(await readFile(join(root, base, 'manifest.json'), 'utf8'));
    for (const item of manifest.items) {
      if (!allowed.has(item.id) || item.storyAsset !== `${item.id}/story-01.png`) throw Error('Unexpected story scope');
      const path = `${base}/${item.storyAsset}`;
      const bytes = await readFile(join(root, path));
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      assets.set(sha256, { path, sha256, mimeType: 'image/png' });
    }
  }
  const journalPath = join(root, '.data/social-operations/media-uploads.json');
  const journal: UploadRecord[] = existsSync(journalPath) ? JSON.parse(await readFile(journalPath, 'utf8')) : [];
  console.log(JSON.stringify({ mode: apply ? 'media-upload-only' : 'validation', uniqueAssets: assets.size, stories: 6 }));
  if (!apply) return;
  const client = getPostizClient();
  if (!client || !(await client.isConnected())) throw Error('Postiz connection unavailable');
  for (const asset of assets.values()) {
    const prior = journal.find(r => r.sha256 === asset.sha256);
    if (prior) {
      if (prior.state !== 'UPLOADED' || !prior.receipt) throw Error('Uncertain previous media upload; reconcile before retrying');
      continue;
    }
    const bytes = await readVerifiedAsset({ root, sourcePath: asset.path, sha256: asset.sha256 });
    const record: UploadRecord = { ...asset, at: new Date().toISOString(), state: 'UPLOADING' };
    journal.push(record);
    await atomicJson(journalPath, journal);
    try {
      record.receipt = await client.uploadFile({ bytes, filename: `${asset.path.split('/').at(-2)}-${basename(asset.path)}`, mimeType: asset.mimeType });
      record.state = 'UPLOADED';
      await atomicJson(journalPath, journal);
      console.log(JSON.stringify({ asset: asset.path.split('/').slice(-2).join('/'), state: record.state, uploaded: journal.filter(r => r.state === 'UPLOADED').length, total: assets.size }));
    } catch {
      record.state = 'UNCERTAIN';
      await atomicJson(journalPath, journal);
      throw Error('Media upload failed or uncertain. Receipt journal retained; no post request was made.');
    }
  }
});
