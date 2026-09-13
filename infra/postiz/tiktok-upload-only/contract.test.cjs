const test = require('node:test');
const assert = require('node:assert/strict');
const { patch } = require('./patch.cjs');

test('upstream drift fails closed', () => assert.throws(() => patch('changed source'), /Unrecognized/));

for (const service of ['backend', 'orchestrator']) {
  const { TiktokProvider } = require(`/app/apps/${service}/dist/libraries/nestjs-libraries/src/integrations/social/tiktok.provider.js`);
  test(`${service}: exact upload-only OAuth scope and secure state`, async () => {
    const p = new TiktokProvider();
    const auth = await p.generateAuthUrl();
    assert.deepEqual(new URL(auth.url).searchParams.get('scope').split(','), ['user.info.basic', 'video.upload']);
    assert.match(auth.state, /^[a-f0-9]{48}$/);
    assert.notEqual(auth.state, (await p.generateAuthUrl()).state);
    assert.throws(() => p.checkScopes(p.scopes, 'user.info.basic'));
  });
  test(`${service}: direct, omitted, and malformed methods rejected before I/O`, async () => {
    const p = new TiktokProvider();
    p.mediaSize = p.fetch = () => { throw new Error('Unexpected I/O'); };
    for (const method of ['DIRECT_POST', undefined, '', 'upload']) {
      const first = { settings: { content_posting_method: method } };
      assert.throws(() => p.contentPostingMethod(first));
      await assert.rejects(p.postPending('id', 'fake', [first], {}), error => !String(error).includes('Unexpected I/O'));
    }
    assert.throws(() => p.postingMethod('DIRECT_POST', false));
  });
  test(`${service}: photos use MEDIA_UPLOAD and inbox status never claims a public URL`, async () => {
    const p = new TiktokProvider();
    const first = { settings: { content_posting_method: 'UPLOAD', title: 'Review' }, media: [{ path: 'https://postiz.social-media-plugin.io/uploads/test.jpg' }], message: 'Test' };
    assert.equal(p.contentPostingMethod(first), 'UPLOAD');
    assert.equal(p.postingMethod('UPLOAD', false), '/inbox/video/init/');
    assert.equal(p.postingMethod('UPLOAD', true), '/content/init/');
    assert.equal(p.buildTikokSourceInfoBody(first).post_mode, 'MEDIA_UPLOAD');
    assert.equal(p.buildTikokSourceInfoBody(first).source_info.source, 'PULL_FROM_URL');
    assert.equal(p.buildTikokPostInfoBody(first).post_info.privacy_level, undefined);
    p.fetch = async () => ({ json: async () => ({ data: { status: 'SEND_TO_USER_INBOX' } }) });
    assert.equal((await p.checkPostStatus('fake', { publishId: 'fake' }, {})).releaseURL, 'https://www.tiktok.com/messages?lang=en');
  });
  test(`${service}: basic-only authentication and refresh do not request profile scope`, async () => {
    const originalFetch = global.fetch;
    const requested = [];
    global.fetch = async url => {
      requested.push(url);
      return { json: async () => url.includes('/oauth/token/')
        ? { access_token: 'fake', refresh_token: 'fake-refresh', scope: 'user.info.basic,video.upload' }
        : { data: { user: { open_id: 'test-id', avatar_url: '', display_name: 'Test creator' } } } };
    };
    try {
      const p = new TiktokProvider();
      for (const result of [await p.authenticate({ code: 'fake', codeVerifier: 'fake' }), await p.refreshToken('fake')]) {
        assert.equal(result.id, 'testid');
        assert.equal(result.name, 'Test creator');
        assert.equal(result.username, '');
      }
      assert.equal(requested.filter(u => u.includes('fields=')).length, 2);
      assert.ok(requested.every(u => !u.includes('username')));
    } finally { global.fetch = originalFetch; }
  });
  test(`${service}: unavailable metadata returns without unauthorized API calls`, async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => { throw new Error('Unexpected I/O'); };
    try {
      const p = new TiktokProvider();
      assert.deepEqual(await p.analytics(), []);
      assert.deepEqual(await p.postAnalytics(), []);
      assert.deepEqual(await p.missing(), []);
      assert.deepEqual(await p.maxVideoLength(), { maxDurationSeconds: 600 });
    } finally { global.fetch = originalFetch; }
  });
}
