// Audited compatibility patch for the pinned Postiz v2.23.0 image only.
// Fail closed on upstream drift. No credentials or API calls during build.
const { readFileSync, writeFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const expected = '85677e2190c493570c241c2bfb50fc98b96251a3ef600e9bc1497b44bf5e1458';

function patch(source) {
  if (createHash('sha256').update(source).digest('hex') !== expected) {
    throw new Error('Unrecognized Postiz TikTok provider; review upstream before upgrading');
  }
  const replace = (from, to, count = 1) => {
    if (source.split(from).length - 1 !== count) throw new Error('Patch anchor mismatch');
    source = source.split(from).join(to);
  };
  replace("this.scopes = [\n            'video.list',\n            'user.info.basic',\n            'video.publish',\n            'video.upload',\n            'user.info.profile',\n            'user.info.stats',\n        ];", "this.scopes = ['user.info.basic', 'video.upload'];");
  replace("this.name = 'Tiktok';", "this.name = 'TikTok (inbox only)';");
  replace('fields=open_id,avatar_url,display_name,union_id,username', 'fields=open_id,avatar_url,display_name,union_id', 2);
  // Do not invent a username from display_name or open_id. Account identity uses
  // the provider's open_id; the basic-only API does not return a profile handle.
  replace('username: username,', "username: '',", 2);
  replace('const state = Math.random().toString(36).substring(2);', "const state = require('node:crypto').randomBytes(24).toString('hex');");
  replace('async postPending(id, accessToken, postDetails, integration) {', 'async postPending(id, accessToken, postDetails, integration) {\n        this.contentPostingMethod(postDetails?.[0]);');
  replace('Use DIRECT_POST unless the user explicitly asks to review or edit the post inside the TikTok app first.', 'This AURENDOR deployment supports UPLOAD only. Direct Post is disabled.');
  // Overrides are attached after decorator evaluation, in BOTH the HTTP backend
  // and Temporal worker bundles. No frontend-only safety assumption.
  return source + `
// AURENDOR_UPLOAD_ONLY_V1
Object.assign(exports.TiktokProvider.prototype, {
    contentPostingMethod(firstPost) {
        if (firstPost?.settings?.content_posting_method !== 'UPLOAD') {
            throw new social_abstract_1.BadBody('tiktok-upload-only', '{}', '{}',
                'Direct Post is disabled. Select Upload content to TikTok without posting it, then finish in the TikTok app.');
        }
        return 'UPLOAD';
    },
    postingMethod(method, isPhoto) {
        if (method !== 'UPLOAD') throw new Error('TikTok Direct Post is disabled');
        return isPhoto ? '/content/init/' : '/inbox/video/init/';
    },
    async maxVideoLength() {
        // Conservative upload preflight cap, not a claim about creator rights.
        // Creator-info query requires video.publish, which we do not request.
        return { maxDurationSeconds: 600 };
    },
    async analytics() { return []; },
    async postAnalytics() { return []; },
    async missing() { return []; },
});
`;
}

module.exports = { patch };
if (require.main === module) {
  for (const service of ['backend', 'orchestrator']) {
    const path = `/app/apps/${service}/dist/libraries/nestjs-libraries/src/integrations/social/tiktok.provider.js`;
    writeFileSync(path, patch(readFileSync(path, 'utf8')));
    console.log(`Patched ${service}: TikTok upload-only`);
  }
}
