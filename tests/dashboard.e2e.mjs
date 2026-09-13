/**
 * Real browser and media exercise. Writes only inside .data/browser-*.
 * Requires Playwright, installed Chromium/Chrome, Python and ffmpeg.
 * All content and accounts in this test are fictional; no external API calls.
 */
import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const workspace = path.join(root, '.data', 'browser-' + Date.now());
fs.mkdirSync(workspace, {recursive: true});
const env = {...process.env, TMPDIR: workspace};
delete env.POSTIZ_API_KEY;
delete env.POSTIZ_API_URL;
delete env.SOCIAL_ENGINE_ALLOW_PUBLISH;
const python = process.env.PYTHON || 'python3';
const cli = path.join(root, 'plugins/social-media-engine/scripts/sme.py');
let seq = 0;
function command(name, args = [], body, brand = 'northstar') {
  const argv = [cli, '--workspace', workspace, '--brand', brand, name, ...args];
  if (body) {
    const input = path.join(workspace, 'input-' + (++seq) + '.json');
    fs.writeFileSync(input, JSON.stringify(body));
    argv.push('--file', input);
  }
  const result = spawnSync(python, argv, {encoding: 'utf8', env, timeout: 15000});
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}
const profile = {
  name: 'Northstar Coffee', description: 'A fictional independent roaster helping home brewers improve their daily cup.',
  industry: 'Specialty coffee', offers: ['Coffee beans', 'Small-group brewing workshops'],
  audiences: ['Busy home brewers'], markets: ['United Kingdom'], languages: ['en', 'ar'],
  voice: 'Warm, useful and specific. Clear Modern Standard Arabic for Arabic variants.',
  forbidden_words: ['miracle'], claims_policy: 'No invented health claims or results.',
  colors: ['#173C34', '#F6EEDF'], fonts: ['Owner-approved editorial serif and Arabic type'],
  logo_policy: 'Use the name as text only; no invented logo.',
  visual_style: 'Calm editorial typography with tactile paper and forest-green contrast.',
  imagery_style: 'Original instructional diagrams and honest product images.',
  goals: ['Build trust through useful brewing education'], platforms: ['instagram', 'facebook', 'tiktok'],
  cadence: 'Three useful posts per week', timezone: 'Europe/London', approval_owner: 'Demo Owner'
};

let server, browser;
const errors = [];
try {
  server = spawn(python, [cli, '--workspace', workspace, '--brand', 'northstar', 'dashboard'],
                 {env, stdio: ['ignore', 'pipe', 'pipe']});
  const url = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Dashboard start timeout: ' + output)), 10000);
    server.stdout.on('data', chunk => {
      output += chunk;
      const found = output.match(/http:\/\/127\.0\.0\.1:\d+\/#[^\s"]+/);
      if (found) { clearTimeout(timer); resolve(found[0]); }
    });
    server.stderr.on('data', chunk => { output += chunk; });
    server.on('exit', code => { clearTimeout(timer); reject(new Error('Dashboard exited: ' + code + ' ' + output)); });
  });
  const origin = new URL(url).origin;
  const token = new URL(url).hash.slice(1);
  const anonymous = await fetch(origin + '/api/state');
  assert.ok([401, 403].includes(anonymous.status), 'Private state must require a token');
  const cross = await fetch(origin + '/api/state', {headers: {Authorization: 'Bearer ' + token, Origin: 'https://evil.invalid'}});
  assert.equal(cross.status, 403, 'Cross-origin request must be refused');
  browser = await chromium.launchPersistentContext(path.join(workspace, 'browser-profile'), {
    headless: true, ...(process.platform === 'darwin' ? {channel: 'chrome'} : {}),
    viewport: {width: 1440, height: 1000}, env
  });
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.getByRole('button', {name: /Brand.*assets/i}).click();
  await page.locator('[name="name"]').fill(profile.name);
  await page.getByRole('button', {name: /Save.*progress/i}).click();
  await page.waitForFunction(() => document.body.textContent.includes('saved'), {timeout: 5000});
  assert.equal(command('status').profile.answers.name, profile.name, 'UI answers must persist');
  command('brand-update', ['--actor', 'Demo Owner'], profile);
  await page.reload();
  await page.getByRole('button', {name: /Brand.*assets/i}).click();
  await page.getByRole('button', {name: /Approve.*brand/i}).click();
  await page.waitForFunction(() => document.body.textContent.includes('READY'));
  assert.equal(command('status').state, 'READY');

  const art = await browser.newPage();
  await art.setViewportSize({width: 1080, height: 1350});
  function poster(kicker, headline, body, number, arabic = false) {
    return '<!doctype html><html lang="' + (arabic ? 'ar' : 'en') + '"><meta charset="utf-8"><style>' +
      '*{box-sizing:border-box}body{margin:0;background:#f6eedf;color:#173c34;width:1080px;height:1350px;' +
      'font-family:Georgia,serif;padding:88px;position:relative;overflow:hidden}' +
      'body:before{content:"";position:absolute;right:-180px;top:500px;width:640px;height:640px;border:1px solid #aa7752;border-radius:50%;box-shadow:0 0 0 50px #aa775211,0 0 0 100px #aa775208}' +
      '.top{display:flex;justify-content:space-between;font:22px Verdana,sans-serif;letter-spacing:3px;border-bottom:2px solid #173c34;padding-bottom:26px}' +
      '.kicker{margin-top:105px;font:22px Verdana,sans-serif;letter-spacing:3px;text-transform:uppercase;color:#8b5134}' +
      'h1{font-size:' + (arabic ? '94' : '108') + 'px;line-height:1.04;letter-spacing:-4px;font-weight:400;max-width:820px;margin:36px 0 54px}' +
      'p{font-size:36px;line-height:1.55;max-width:710px;position:relative}' +
      '.footer{position:absolute;bottom:76px;left:88px;right:88px;display:flex;justify-content:space-between;font:20px Verdana,sans-serif;border-top:1px solid #173c3455;padding-top:28px}' +
      (arabic ? '.copy{direction:rtl;font-family:"Geeza Pro",serif}h1{letter-spacing:0;line-height:1.5}' : '') +
      '</style><div class="top"><span>NORTHSTAR COFFEE</span><span>BREW NOTES</span></div><div class="copy">' +
      '<div class="kicker">' + kicker + '</div><h1>' + headline + '</h1><p>' + body +
      '</p></div><div class="footer"><span>Make your next cup a useful experiment.</span><span>' + number + '</span></div></html>';
  }
  const frames = [
    ['ONE USEFUL EXPERIMENT', 'Change one thing.<br>Learn something.', 'Keep your coffee, water and method consistent. Then adjust one variable in your next brew.', '01 / 03'],
    ['START WITH A BASELINE', 'A small note.<br>A better question.', 'Write down your dose, grind setting and brew time. Add one honest sentence about the taste.', '02 / 03'],
    ['MAKE THE NEXT MOVE', 'Keep what works.<br>Change what doesn’t.', 'Choose one adjustment. Taste again. The aim is not a perfect score, but a more useful comparison.', '03 / 03'],
    ['THE DAILY PRACTICE', 'Your notes are<br>an upgrade.', 'Before buying another gadget, notice what your current setup can teach you.', 'BREW NOTE 04'],
    ['ملاحظة للتحضير', 'غيّر عاملًا واحدًا.<br>وتعلّم من النتيجة.', 'دوّن كمية القهوة ودرجة الطحن ووقت التحضير، ثم اختر تعديلًا واحدًا للتجربة التالية.', '05']
  ];
  const assets = [];
  for (let i = 0; i < frames.length; i++) {
    await art.setContent(poster(...frames[i], i === 4));
    await art.evaluate(() => document.fonts.ready);
    const file = path.join(workspace, 'brew-' + i + '.png');
    await art.screenshot({path: file});
    assets.push(command('asset-import', ['--file', file, '--role', 'output', '--rights', 'owned',
      '--note', 'Original fictional-brand test render, not customer content or a quality certification.', '--actor', 'Demo Owner']));
  }
  const concat = path.join(workspace, 'frames.txt');
  fs.writeFileSync(concat, [0, 1, 2].map(i => "file 'brew-" + i + ".png'\nduration 2\n").join('') + "file 'brew-2.png'\n");
  const video = path.join(workspace, 'brew-experiment.mp4');
  const render = spawnSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concat,
    '-vf', 'scale=720:900,format=yuv420p', '-r', '24', '-t', '6', '-c:v', 'libx264', '-preset', 'fast', '-movflags', '+faststart', video],
    {env, encoding: 'utf8', timeout: 45000});
  assert.equal(render.status, 0, render.stderr);
  const videoAsset = command('asset-import', ['--file', video, '--role', 'output', '--rights', 'owned',
    '--note', 'Original six-second silent technical test video; no licensed audio.', '--actor', 'Demo Owner']);
  function save(id, title, format, selected, language, caption, platform) {
    const item = {id, title, producer: 'fixture-producer-not-a-real-reviewer', variants: [{
      platform, language, caption, format, asset_ids: selected.map(a => a.id),
      alt_text: selected.map((_, i) => title + ', panel ' + (i + 1)),
      adaptation: 'A concrete brewing lesson adapted to this fictional brand and destination.'
    }], claims: [], evidence: [], creative: {idea: title, test_only: true, audio: format === 'video' ? 'Intentionally silent test' : 'not applicable'}};
    const file = path.join(workspace, 'item-context-' + id + '.json');
    fs.writeFileSync(file, JSON.stringify(item));
    const context = command('context', ['--item-file', file]);
    item.brand_hash = context.brand_hash;
    item.context_hash = context.context_hash;
    return command('item-save', [], item);
  }
  save('brew-carousel', 'Change one thing', 'carousel', assets.slice(0, 3), 'en',
       'Save a baseline before changing the next brew. Record your dose, grind setting, time and an honest taste note. Then change one variable.', 'instagram');
  save('brew-notes', 'Your notes are an upgrade', 'image', [assets[3]], 'en',
       'What did you notice in your last cup? A small brew note can give your next experiment a clearer purpose. Share the one variable you want to try.', 'facebook');
  save('brew-video', 'A six-second brewing experiment', 'video', [videoAsset], 'en',
       'Same method. One adjustment. A useful comparison. Keep a short brew note and try it next time.', 'tiktok');
  save('brew-arabic', 'A practical Arabic brewing note', 'image', [assets[4]], 'ar',
       'ابدأ بملاحظة بسيطة عن مذاق قهوتك. دوّن إعدادات التحضير، ثم غيّر عاملًا واحدًا في التجربة التالية.', 'instagram');
  await page.reload();
  await page.getByRole('button', {name: /Content review/i}).click();
  await page.getByText('Change one thing', {exact: true}).waitFor();
  for (const article of await page.locator('#content article').all()) {
    await article.scrollIntoViewIfNeeded();
    await article.locator('img,video').first().waitFor();
  }
  await page.waitForFunction(() => document.querySelectorAll('img').length >= 5 &&
    [...document.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0));
  assert.deepEqual(await page.locator('#content article').first().locator('img').evaluateAll(nodes=>nodes.map(n=>n.alt)),
    ['brew-0.png','brew-1.png','brew-2.png'], 'Carousel order must follow the approved sequence');
  await page.screenshot({path: path.join(workspace, 'dashboard-desktop.png'), fullPage: true});
  const videoElement = page.locator('video').first();
  await videoElement.scrollIntoViewIfNeeded();
  await videoElement.evaluate(element => new Promise((resolve, reject) => {
    element.muted = true;
    element.addEventListener('ended', resolve, {once: true});
    element.addEventListener('error', () => reject(new Error('Video decode failed')), {once: true});
    element.play().catch(reject);
  }));
  await page.setViewportSize({width: 390, height: 844});
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Mobile page overflows');
  await page.screenshot({path: path.join(workspace, 'dashboard-mobile.png'), fullPage: true});
  const firstCard=page.locator('#content article').first();
  await firstCard.locator('textarea[name="feedback"]').fill('Shorten the cover while keeping the useful instruction.');
  await firstCard.locator('select[name="rating"]').selectOption('4');
  await firstCard.getByRole('button',{name:'Save feedback',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Feedback saved'}).waitFor();
  const feedbackState=command('snapshot');
  assert.equal(feedbackState.items.find(i=>i.id==='brew-carousel').status,'CHANGES_REQUESTED');
  assert.equal(feedbackState.rules[0].rating,4);
  for (const label of [/Overview/i, /Brand.*assets/i, /Feedback.*learning/i, /Publishing.*evidence/i]) {
    await page.getByRole('button', {name: label}).click();
  }
  assert.deepEqual(errors, [], 'Browser runtime errors');
  const final = command('snapshot');
  assert.equal(final.items.length, 4);
  assert.ok(final.items.every(i => ['DRAFT','CHANGES_REQUESTED'].includes(i.status)), 'Demo must never fabricate reviews or owner content approval');
  fs.writeFileSync(path.join(workspace, 'RESULT.json'), JSON.stringify({
    status: 'PASS', tests: ['unauthorized state refused', 'cross-origin refused', 'onboarding saved via UI',
      'brand approval via UI', 'four actual media drafts', 'desktop previews', 'full video playback',
      'mobile overflow', 'navigation', 'no page errors'], workspace,
    limitation: 'Fictional technical samples. No live accounts, no genuine owner quality approval.'
  }, null, 2));
  console.log(JSON.stringify({status: 'PASS', workspace, screenshot: path.join(workspace, 'dashboard-desktop.png'),
    video, items: 4}, null, 2));
} catch (error) {
  if (browser) {
    for (const [index, page] of browser.pages().entries()) {
      fs.writeFileSync(path.join(workspace, 'failure-' + index + '.html'), await page.content().catch(() => ''));
      await page.screenshot({path: path.join(workspace, 'failure-' + index + '.png'), fullPage: true}).catch(() => {});
    }
  }
  console.error(error);
  console.error('Failure artifacts: ' + workspace);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) server.kill('SIGINT');
}
