import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ReleaseSchema,releaseContentHash,verifySocialRelease,assertLiveGate,assertCompleteReceipt,dispatchReviewedRelease,isWithinScheduleWindow,type SocialRelease,type DispatchReceipt} from './social-release';
const sha=(x:string)=>createHash('sha256').update(x).digest('hex');
const platforms=['instagram','facebook','linkedin','x','tiktok'] as const;
let root:string,release:SocialRelease,identity:string;
const asset='apps/web/public/monthly-plan/2026-09/editorial/test-fixture.png';
beforeEach(async()=>{
 await mkdir(join(process.cwd(),'.data'),{recursive:true});root=await mkdtemp(join(process.cwd(),'.data/release-test-'));
 await mkdir(join(root,'apps/web/public/monthly-plan/2026-09/editorial'),{recursive:true});
 await writeFile(join(root,asset),'nonpublishable unit-test bytes');
 release=ReleaseSchema.parse({version:1,contentId:'U02',title:'TEST FIXTURE ONLY',pillar:'Practical AI',format:'carousel',scheduledAt:'2026-09-14T06:25:00Z',timeBand:'morning',review:{path:'test-review.json',sha256:'0'.repeat(64)},variants:platforms.map(platform=>({platform,accountId:'fixture-'+platform,title:'fixture',entries:[{caption:'Nonpublishable test fixture',assets:[{path:asset,sha256:sha('nonpublishable unit-test bytes'),mimeType:'image/png',width:1080,height:1350}]}]}))});
 identity=releaseContentHash(release);
 const review=JSON.stringify({contentHash:identity,passed:true,reviewer:'unit-test fixture reviewer',producer:'unit-test fixture producer',observations:['fixture one','fixture two','fixture three'],hardFailures:[]});
 release.review.sha256=sha(review);await writeFile(join(root,'test-review.json'),review);
});
afterEach(async()=>{await rm(root,{recursive:true,force:true});});
const receipts=():DispatchReceipt[]=>platforms.map(p=>({postId:'fixture-post-'+p,integration:'fixture-'+p}));
function callbacks(){return {checkLive:vi.fn(async()=>{}),beforeSend:vi.fn(async()=>{}),createPosts:vi.fn(async()=>receipts()),persistReceipt:vi.fn(async(receipt:DispatchReceipt[])=>{void receipt;})};}
describe('Automatic release boundary',()=>{
 it('requires configured production authentication, not merely enabled publishing',()=>{
  expect(()=>assertLiveGate({status:'ok',publishingEnabled:true},true,false)).toThrow('gate is closed');
  expect(()=>assertLiveGate({status:'ok',publishingEnabled:true,ownerAuthConfigured:false},true,false)).toThrow();
  expect(()=>assertLiveGate({status:'ok',publishingEnabled:true,ownerAuthConfigured:true},true,false)).not.toThrow();
  expect(()=>assertLiveGate({status:'ok',publishingEnabled:true,ownerAuthConfigured:true},true,true)).toThrow('paused');
 });
 it('rechecks a pause after preparation and makes no provider request',async()=>{
  const cb=callbacks();cb.checkLive.mockRejectedValue(Error('paused during uploads'));
  await expect(dispatchReviewedRelease({root,release,expectedHash:identity,...cb})).rejects.toThrow('paused');
  expect(cb.createPosts).not.toHaveBeenCalled();expect(cb.beforeSend).not.toHaveBeenCalled();
 });
 it('revalidates immutable asset bytes immediately before dispatch',async()=>{
  expect(await verifySocialRelease(root,release)).toBe(identity);
  await writeFile(join(root,asset),'changed during upload preparation');const cb=callbacks();
  await expect(dispatchReviewedRelease({root,release,expectedHash:identity,...cb})).rejects.toThrow('Asset hash mismatch');
  expect(cb.checkLive).not.toHaveBeenCalled();expect(cb.createPosts).not.toHaveBeenCalled();
 });
 it('refuses mutated review-bound content without sending',async()=>{
  const cb=callbacks();release.variants[0]!.entries[0]!.caption='Changed after initial review';
  await expect(dispatchReviewedRelease({root,release,expectedHash:identity,...cb})).rejects.toThrow('exact release');
  expect(cb.createPosts).not.toHaveBeenCalled();
 });
 it('retains partial receipts and does not resend uncertain acknowledgments',async()=>{
  const cb=callbacks(),partial=receipts().slice(0,2);cb.createPosts.mockResolvedValue(partial);
  await expect(dispatchReviewedRelease({root,release,expectedHash:identity,...cb})).rejects.toThrow('acknowledgment');
  expect(cb.persistReceipt).toHaveBeenCalledWith(partial);expect(cb.createPosts).toHaveBeenCalledTimes(1);
 });
 it('rejects duplicate post IDs even if every account appears once',()=>{
  expect(()=>assertCompleteReceipt(receipts().map(r=>({...r,postId:'same-post'})),release)).toThrow('acknowledgment');
 });
 it('never automatically retries a network timeout',async()=>{
  const cb=callbacks();cb.createPosts.mockRejectedValue(Error('network timeout after acceptance'));
  await expect(dispatchReviewedRelease({root,release,expectedHash:identity,...cb})).rejects.toThrow('timeout');
  expect(cb.createPosts).toHaveBeenCalledTimes(1);expect(cb.persistReceipt).not.toHaveBeenCalled();
 });
 it('persists intent, sends once and retains all receipts in order',async()=>{
  const order:string[]=[];
  const result=await dispatchReviewedRelease({root,release,expectedHash:identity,checkLive:async()=>{order.push('live');},beforeSend:async()=>{order.push('intent');},createPosts:async()=>{order.push('create');return receipts();},persistReceipt:async()=>{order.push('receipt');}});
  expect(result).toEqual(receipts());expect(order).toEqual(['live','intent','create','receipt']);
 });
});


describe('Native X continuation',()=>{
 it('keeps complete reel thread copy with media on the first entry only',()=>{
  const reel={...release,format:'reel',variants:release.variants.map(v=>({...v,entries:[{caption:'First complete post',assets:[{...v.entries[0]!.assets[0]!,mimeType:'video/mp4',width:['instagram','tiktok'].includes(v.platform)?1080:1920,height:['instagram','tiktok'].includes(v.platform)?1920:1080}]},...(v.platform==='x'?[{caption:'Full educational continuation',assets:[]},{caption:'Relevant final CTA',assets:[]}]:[])]}))};
  const parsed=ReleaseSchema.parse(reel);expect(parsed.variants.find(v=>v.platform==='x')?.entries).toHaveLength(3);
 });
 it('still requires media on the first X entry and every non-X entry',()=>{
  const noFirst={...release,variants:release.variants.map(v=>v.platform==='x'?{...v,entries:[{caption:'Text only first entry',assets:[]}]}:v)};
  expect(ReleaseSchema.safeParse(noFirst).success).toBe(false);
  const noInstagram={...release,variants:release.variants.map(v=>v.platform==='instagram'?{...v,entries:[{caption:'No required image',assets:[]}]}:v)};
  expect(ReleaseSchema.safeParse(noInstagram).success).toBe(false);
 });
});


describe('Owner authorization time boundary',()=>{
 it('compares UTC instants rather than ISO formatting',()=>{
  const start='2026-09-10T21:00:00Z',end='2026-09-30T21:00:00Z';
  expect(isWithinScheduleWindow('2026-09-10T21:00:00.000Z',start,end)).toBe(true);
  expect(isWithinScheduleWindow('2026-09-30T21:00:00.000Z',start,end)).toBe(false);
  expect(isWithinScheduleWindow('2026-09-30T20:59:59.999Z',start,end)).toBe(true);
  expect(isWithinScheduleWindow('2026-09-14T00:00:00Z','malformed',end)).toBe(false);
 });
});
