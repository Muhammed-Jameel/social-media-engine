import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, join, resolve } from 'node:path';
import { StoryReleaseSchema, StoryReviewSchema } from '../packages/engine/src/social-story-release';
import { getPostizClient, platformForPostizProvider, postizProviderType, readVerifiedAsset, type PostizCreateRequest, type PostizUpload } from '../packages/engine/src/postiz';
import { assertLiveGate, isWithinScheduleWindow } from '../packages/engine/src/social-release';
import { cachedSocialMedia } from '../packages/engine/src/social-media-cache';
import { atomicJson, withOperationsLock } from '../packages/engine/src/social-operations-store';
const root=resolve(import.meta.dirname,'..');process.loadEnvFile(join(root,'.env.local'));
const dir=join(root,'.data/social-operations'),live=process.argv.includes('--live');
const manifestPath=join(root,'artifacts/social-story-releases/cycle-01-02.json');
const reviewPath=join(root,'artifacts/social-story-releases/cycle-01-02.review.json');
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
type Receipt={postId:string;integration:string};
type Intent={contentId:string;manifestHash:string;scheduledAt:string;state:string;payload:PostizCreateRequest;at:string;receipt?:Receipt[]};
type Media={sha256:string;path:string;mimeType:string;state:'UPLOADING'|'UPLOADED'|'UNCERTAIN';at:string;receipt?:PostizUpload};
await withOperationsLock(root,async()=>{
 const initialRaw=await readFile(manifestPath);const identity=hash(initialRaw);
 const release=StoryReleaseSchema.parse(JSON.parse(initialRaw.toString()));
 if(new Set(release.items.map(i=>i.contentId)).size!==6)throw Error('Duplicate Story scope');
 const checkReview=async()=>{
  if(hash(await readFile(manifestPath))!==identity)throw Error('Story manifest changed');
  const review=StoryReviewSchema(identity).parse(JSON.parse(await readFile(reviewPath,'utf8')));
  if(review.producer===review.reviewer)throw Error('Independent Story review required');
  for(const e of review.evidence){if(!e.path.startsWith('artifacts/social-learning/qa/')||hash(await readFile(join(root,e.path)))!==e.sha256)throw Error('Story evidence changed');}
  for(const item of release.items){if(!item.asset.path.startsWith('apps/web/public/monthly-plan/2026-09/editorial/')||!item.asset.path.endsWith('.png'))throw Error('Story outside media scope');await readVerifiedAsset({root,sourcePath:item.asset.path,sha256:item.asset.sha256});}
 };
 await checkReview();
 const client=getPostizClient();if(!client)throw Error('Postiz unavailable');
 const channels=await client.listIntegrations();
 const checkPolicy=async(item:typeof release.items[number],requireLive:boolean)=>{
  const p=JSON.parse(await readFile(join(root,'data/social-operations-policy.json'),'utf8'));
  const parent=p.schedule.find((s:{id:string})=>s.id===item.contentId);
  if(!p.contentIds.includes(item.contentId)||!parent||Date.parse(item.scheduledAt)!==Date.parse(parent.scheduledAt)+30*60000||!isWithinScheduleWindow(item.scheduledAt,p.startsAt,p.endsAt))throw Error('Story schedule outside parent policy');
  for(const platform of ['instagram','facebook'] as const){if(p.accounts[platform]!==item.accounts[platform]||!channels.some(c=>c.id===item.accounts[platform]&&!c.disabled&&platformForPostizProvider(c.providerIdentifier)===platform))throw Error('Story account authorization changed');}
  if(requireLive){const response=await fetch(p.dashboardUrl+'/api/health',{signal:AbortSignal.timeout(10000),cache:'no-store'});if(!response.ok)throw Error('Live gate unavailable');assertLiveGate(await response.json(),p.enabled,p.paused);}
 };
 const journalPath=join(dir,'story-dispatches.json');
 const journal:Intent[]=existsSync(journalPath)?JSON.parse(await readFile(journalPath,'utf8')):[];
 const mediaPath=join(dir,'media-uploads.json');const media:Media[]=JSON.parse(await readFile(mediaPath,'utf8'));
 const reports=[];
 for(const item of release.items){
  const previous=journal.find(j=>j.contentId===item.contentId);if(previous){reports.push({id:item.contentId,status:previous.state,details:'Existing Story intent retained'});continue;}
  if(Date.parse(item.scheduledAt)<Date.now()+15*60000||Date.parse(item.scheduledAt)>Date.now()+7*86400000)throw Error('Story slot is not within future scheduling window');
  await checkPolicy(item,live);
  if(!live){reports.push({id:item.contentId,status:'VALIDATED',scheduledAt:item.scheduledAt});continue;}
  let upload=cachedSocialMedia(media,item.asset.sha256);
  if(!upload){
   const record:Media={...item.asset,state:'UPLOADING',at:new Date().toISOString()};media.push(record);await atomicJson(mediaPath,media);
   try{const bytes=await readVerifiedAsset({root,sourcePath:item.asset.path,sha256:item.asset.sha256});upload=await client.uploadFile({bytes,filename:item.contentId+'-'+basename(item.asset.path),mimeType:item.asset.mimeType});record.receipt=upload;record.state='UPLOADED';await atomicJson(mediaPath,media);}
   catch{record.state='UNCERTAIN';await atomicJson(mediaPath,media);throw Error('Uncertain Story media upload; do not retry blindly');}
  }
  const payload:PostizCreateRequest={type:'schedule',date:item.scheduledAt,shortLink:false,tags:[],posts:(['instagram','facebook'] as const).map(platform=>({integration:{id:item.accounts[platform]},value:[{content:item.caption,image:[upload!]}],settings:{__type:postizProviderType(channels.find(c=>c.id===item.accounts[platform])!.providerIdentifier),post_type:'story'}}))};
  await checkReview();await checkPolicy(item,true);
  const intent:Intent={contentId:item.contentId,manifestHash:identity,scheduledAt:item.scheduledAt,state:'INTENT_PERSISTED',payload,at:new Date().toISOString()};journal.push(intent);await atomicJson(journalPath,journal);
  let sent=false;
  try{
   await checkPolicy(item,true);await checkReview();intent.state='DISPATCHING';await atomicJson(journalPath,journal);sent=true;
   const receipt=await client.createPosts(payload);intent.receipt=receipt;intent.state='RECEIPT_RECEIVED';await atomicJson(journalPath,journal);
   const expected=Object.values(item.accounts);if(receipt.length!==2||new Set(receipt.map(r=>r.postId)).size!==2||new Set(receipt.map(r=>r.integration)).size!==2||receipt.some(r=>!expected.includes(r.integration)))throw Error('Incomplete Story receipt');
   intent.state='ACKNOWLEDGED';
   const indexPath=join(dir,'delivery-index.json');const index=JSON.parse(await readFile(indexPath,'utf8'));for(const r of receipt)index.push({contentId:item.contentId,postId:r.postId,format:'story',pillar:item.pillar,slot:item.timeBand});await atomicJson(indexPath,index);
  }catch{intent.state=sent?'AMBIGUOUS':'BLOCKED_BEFORE_DISPATCH';}
  await atomicJson(journalPath,journal);reports.push({id:item.contentId,status:intent.state,scheduledAt:item.scheduledAt});
 }
 const result={at:new Date().toISOString(),mode:live?'live':'validation',reports};await atomicJson(join(dir,'story-scheduling-status.json'),result);console.log(JSON.stringify(result,null,2));
});
