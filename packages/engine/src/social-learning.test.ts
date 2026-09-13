import {describe,it,expect} from 'vitest';
import {normalizePostMetrics,isPublicPost,nextCheckpoint,checkpointForAge,engagementPerReach,timingReadout,type TrackedPost} from './social-learning';
describe('Live social measurement',()=>{
 it('preserves unavailable counts and genuine zero',()=>{const {metrics}=normalizePostMetrics([{label:'Views',data:[{date:'2026-09-10',total:'28'}]},{label:'Comments',data:[{date:'2026-09-10',total:0}]}]);expect(metrics.views).toBe(28);expect(metrics.comments).toBe(0);expect(metrics.reach).toBeNull();expect(engagementPerReach(metrics)).toBeNull();});
 it('does not sum or silently pick daily series of unknown semantics',()=>{const n=normalizePostMetrics([{label:'Views',data:[{date:'2026-09-09',total:20},{date:'2026-09-10',total:28}]}]);expect(n.metrics.views).toBeNull();expect(n.ambiguous).toEqual(['Views']);});
 it('never counts TikTok inbox acknowledgment as public',()=>{expect(isPublicPost({state:'PUBLISHED',releaseURL:'https://www.tiktok.com/messages?lang=en',platform:'tiktok'})).toBe(false);expect(isPublicPost({state:'PUBLISHED',releaseURL:'https://www.instagram.com/reel/a/',platform:'instagram'})).toBe(true);});
 it('does not backfill missed early checkpoints with older data',()=>{const at='2026-09-11T06:00:00Z';expect(nextCheckpoint(at,[],Date.parse(at)+30*3600000)).toBe('2026-09-12T06:00:00.000Z');expect(checkpointForAge(30)).toBe(24);expect(checkpointForAge(40)).toBeNull();expect(nextCheckpoint(at,[],Date.parse(at)+200*3600000)).toBeNull();});
 it('declares no winner without comparable observations',()=>{expect(timingReadout([])).toEqual([]);});
});

describe('Measurement regression checks',()=>{
 it('does not coerce a blank provider count to a real zero',()=>{
  const r=normalizePostMetrics([{label:'Views',data:[{date:'2026-09-10',total:' \t '}]},{label:'Likes',data:[{date:'2026-09-10',total:'0'}]}]);
  expect(r.metrics.views).toBeNull();expect(r.metrics.likes).toBe(0);
 });
 it('does not choose between conflicting aliases or hide multiple-point semantics by filtering invalid values',()=>{
  const r=normalizePostMetrics([{label:'Clicks',data:[{date:'2026-09-10',total:12}]},{label:'Link clicks',data:[{date:'2026-09-10',total:5}]},{label:'Views',data:[{date:'2026-09-09',total:''},{date:'2026-09-10',total:8}]}]);
  expect(r.metrics.clicks).toBeNull();expect(r.metrics.views).toBeNull();expect(r.ambiguous).toEqual(['Link clicks','Views']);
 });
 it.each(['https://tiktok.com/messages','https://tiktok.com/messages/','https://tiktok.com/@aurendor','https://not-tiktok.com/@a/video/123','https://tiktok.com.evil.example/@a/video/123','https://evil.example/post/123','not a URL'])('rejects non-public TikTok link %s',releaseURL=>{
  expect(isPublicPost({state:'PUBLISHED',platform:'tiktok',releaseURL})).toBe(false);
 });
 it.each([
  ['instagram','https://www.instagram.com/reel/a/'],['instagram','https://www.instagram.com/stories/aurendor/123/'],['facebook','https://www.facebook.com/aurendor/posts/123'],['facebook','https://www.facebook.com/permalink.php?story_fbid=123&id=456'],['linkedin','https://www.linkedin.com/feed/update/urn:li:ugcPost:123'],['x','https://x.com/aurendor/status/123'],['tiktok','https://www.tiktok.com/@aurendor.io/video/123']
 ])('recognizes a provider post permalink for %s',(platform,releaseURL)=>expect(isPublicPost({state:'PUBLISHED',platform,releaseURL})).toBe(true));
 it('retains TikTok inbox method as nonpublic even if it contains a post-shaped URL',()=>expect(isPublicPost({state:'PUBLISHED',platform:'tiktok',releaseURL:'https://www.tiktok.com/@a/video/123',settings:{content_posting_method:'UPLOAD'}})).toBe(false));
 it('handles invalid publication timestamps without crashing the collector',()=>expect(nextCheckpoint('invalid',[],Date.now())).toBeNull());
 it('retains first-week gaps and stops after the final grace window',()=>{
  const at='2026-09-11T06:00:00Z',start=Date.parse(at);
  expect(nextCheckpoint(at,[],start+168*3600000)).toBe(new Date(start+168*3600000).toISOString());
  expect(checkpointForAge(176)).toBe(168);expect(checkpointForAge(176.01)).toBeNull();
  expect(nextCheckpoint(at,[],start+176.01*3600000)).toBeNull();
 });
});

function measuredPost(id:string,metrics:Partial<TrackedPost['observations'][number]['metrics']>):TrackedPost{
 const normalized=normalizePostMetrics([]).metrics;
 return {id,platform:'instagram',accountId:'fixture-account',title:'fixture',state:'PUBLISHED',releaseURL:'https://instagram.com/p/fixture/',publishedAt:'2026-09-01T00:00:00Z',publicConfirmed:true,contentId:id,format:'carousel',pillar:'Practical AI',slot:'morning',nextCheckAt:null,lastError:null,observations:[{observedAt:'2026-09-08T00:00:00Z',ageHours:168,metrics:{...normalized,...metrics},raw:[{label:'Fixture',data:[{date:'2026-09-08',total:1}]}],unmapped:[],ambiguous:[],error:null,checkpointHours:168}]};
}
describe('Comparable timing evidence',()=>{
 it('does not count raw-but-unusable responses toward directional evidence',()=>{
  const rows=[...Array.from({length:5},(_,i)=>measuredPost(String(i),{})),measuredPost('measured',{views:0})];
  const [g]=timingReadout(rows);expect(g?.posts).toBe(1);expect(g?.withViews).toBe(1);expect(g?.meanViews).toBe(0);expect(g?.evidence).toBe('Insufficient sample');
 });
 it('requires five observations of the same comparable metric rather than mixing denominators',()=>{
  const rows=[...Array.from({length:3},(_,i)=>measuredPost('v'+i,{views:10})),...Array.from({length:3},(_,i)=>measuredPost('r'+i,{likes:2,comments:1,reach:100}))];
  const [g]=timingReadout(rows);expect(g?.posts).toBe(6);expect(g?.evidence).toBe('Insufficient sample');
 });
 it('does not inflate reach-weighted engagement with engagement from zero-reach posts',()=>{
  const [g]=timingReadout([measuredPost('zero',{likes:50,comments:10,reach:0,views:20}),measuredPost('valid',{likes:8,comments:2,reach:100})]);
  expect(g?.engagementRate).toBe(.1);expect(g?.withReach).toBe(1);expect(g?.likesComments).toBe(10);
 });
});
