import { z } from 'zod';
import type { PostizUpload } from './postiz';

const cacheSchema = z.array(z.object({
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  state: z.enum(['UPLOADING', 'UPLOADED', 'UNCERTAIN']),
  receipt: z.object({ id: z.string().min(1), path: z.string().min(1), name: z.string().optional() }).optional(),
}));

/** Reuse only a completed upload for the exact verified local media hash. */
export function cachedSocialMedia(raw: unknown, sha256: string): PostizUpload | undefined {
  const matches = cacheSchema.parse(raw).filter(item => item.sha256 === sha256);
  if (!matches.length) return undefined;
  const match = matches[0];
  if (!match || matches.length !== 1 || match.state !== "UPLOADED" || !match.receipt) {
    throw Error('Uncertain or conflicting media upload; reconcile before retrying.');
  }
  return match.receipt;
}
