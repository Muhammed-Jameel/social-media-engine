import { describe, expect, it } from 'vitest';
import { cachedSocialMedia } from './social-media-cache';

describe('exact-media upload reuse', () => {
  const sha256 = 'a'.repeat(64);
  const receipt = { id: 'media-1', path: 'https://example.com/media.png' };
  it('reuses only the completed exact asset and misses changed content', () => {
    const journal = [{ sha256, state: 'UPLOADED', receipt }];
    expect(cachedSocialMedia(journal, sha256)).toEqual(receipt);
    expect(cachedSocialMedia(journal, 'b'.repeat(64))).toBeUndefined();
  });
  it('holds uncertain uploads instead of silently duplicating them', () => {
    for (const state of ['UPLOADING', 'UNCERTAIN']) {
      expect(() => cachedSocialMedia([{ sha256, state }], sha256)).toThrow(/reconcile/);
    }
    expect(() => cachedSocialMedia([{ sha256, state: 'UPLOADED' }], sha256)).toThrow(/reconcile/);
    expect(() => cachedSocialMedia([
      { sha256, state: 'UPLOADED', receipt }, { sha256, state: 'UPLOADED', receipt },
    ], sha256)).toThrow(/reconcile/);
  });
});
