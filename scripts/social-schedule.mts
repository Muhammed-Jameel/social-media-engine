import{existsSync}from'node:fs';import{mkdir,readFile,readdir}from'node:fs/promises';import{resolve,join,basename}from'node:path';
import{getPostizClient,platformForPostizProvider,postizSettings,readVerifiedAsset,PostizApiError,type PostizCreateRequest}from'../packages/engine/src/postiz';
import{ReleaseSchema,verifySocialRelease,assertLiveGate,dispatchReviewedRelease,isWithinScheduleWindow,type DispatchReceipt}from'../packages/engine/src/social-release';
import{atomicJson,withOperationsLock}from'../packages/engine/src/social-operations-store';
import{cachedSocialMedia}from'../packages/engine/src/social-media-cache';
interface DispatchJournal{contentId:string;hash:string;scheduledAt:string;state:string;at:string;payload:PostizCreateRequest;receipt?:DispatchReceipt[];error?:string}
interface ScheduleReport{id:string;status:string;details?:string;scheduledAt?:string;hash?:string}
interface DeliveryIndexEntry{contentId:string;postId:string;format:string;pillar:string;slot:string}
const root=resolve(import.meta.dirname,'..');if(existsSync(join(root,'.env.local')))process.loadEnvFile(join(root,'.env.local'));const dir=join(root,'.data/social-operations');await mkdir(dir,{recursive:true});
const live=process.argv.includes('--live');
await withOperationsLock(root,async()=>{
 const policy=JSON.parse(await readFile(join(root,'data/social-operations-policy.json'),'utf8'));
 const journals:DispatchJournal[]=existsSync(join(dir,'dispatches.json'))?JSON.parse(await readFile(join(dir,'dispatches.json'),'utf8')):[];
 const releases=join(root,'artifacts/social-releases');await mkdir(releases,{recursive:true});
 const files=(await readdir(releases)).filter(f=>f.endsWith('.release.json')).sort();
 const reports:ScheduleReport[]=[];
 const client=getPostizClient();if(!client)throw Error('Postiz not configured');
 const mediaCachePath=join(dir,'media-uploads.json');
 const mediaCache:unknown=existsSync(mediaCachePath)?JSON.parse(await readFile(mediaCachePath,'utf8')):[];
 const channels=await client.listIntegrations();
 for(const file of files){const pkg=ReleaseSchema.parse(JSON.parse(await readFile(join(releases,file),'utf8')));const identity=await verifySocialRelease(root,pkg);
 if(!policy.contentIds.includes(pkg.contentId)||!isWithinScheduleWindow(pkg.scheduledAt,policy.startsAt,policy.endsAt))throw Error('Release outside owner-authorized scope');
 const previous=journals.find(j=>j.contentId===pkg.contentId);if(previous){reports.push({id:pkg.contentId,status:previous.state,details:'Existing intent retained; never auto-resend.'});continue;}
 if(Date.parse(pkg.scheduledAt)<Date.now()+15*60000){reports.push({id:pkg.contentId,status:'EXPIRED_SLOT',details:'Needs a new reviewed future schedule; no catch-up burst.'});continue;}
 if(Date.parse(pkg.scheduledAt)>Date.now()+7*86400000){reports.push({id:pkg.contentId,status:'LATER',details:'Schedule only within seven days, after source refresh.'});continue;}
 for(const v of pkg.variants){if(!channels.some(c=>c.id===v.accountId&&!c.disabled&&platformForPostizProvider(c.providerIdentifier)===v.platform))throw Error('Connected account does not match release');if(policy.accounts[v.platform]!==v.accountId)throw Error('Account differs from standing authorization');}
 if(!live){reports.push({id:pkg.contentId,status:'VALIDATED',scheduledAt:pkg.scheduledAt,hash:identity});continue;}
 const checkLive=async()=>{
  const currentPolicy=JSON.parse(await readFile(join(root,'data/social-operations-policy.json'),'utf8'));
  if(!currentPolicy.contentIds.includes(pkg.contentId)||!isWithinScheduleWindow(pkg.scheduledAt,currentPolicy.startsAt,currentPolicy.endsAt)||pkg.variants.some(v=>currentPolicy.accounts[v.platform]!==v.accountId))throw Error('Current owner authorization no longer covers this release.');
  const response=await fetch((currentPolicy.dashboardUrl||process.env.APP_URL||'http://127.0.0.1:3010').replace(/\/$/,'')+'/api/health',{signal:AbortSignal.timeout(10000),cache:'no-store'});
  if(!response.ok)throw Error('Live dashboard gate unavailable.');
  assertLiveGate(await response.json(),currentPolicy.enabled,currentPolicy.paused);
 };
 try{await checkLive();}
 catch(e){reports.push({id:pkg.contentId,status:'BLOCKED',details:e instanceof Error?e.message:'Live gate unavailable'});continue;}
 const posts:PostizCreateRequest['posts']=[];
 for(const v of pkg.variants){const channel=channels.find(c=>c.id===v.accountId)!;const value=[];
 for(const e of v.entries){const image=[];for(const a of e.assets){const bytes=await readVerifiedAsset({root,sourcePath:a.path,sha256:a.sha256});image.push(cachedSocialMedia(mediaCache,a.sha256)??await client.uploadFile({bytes,filename:basename(a.path),mimeType:a.mimeType}));}value.push({content:e.caption,image});}
 posts.push({integration:{id:v.accountId},value,settings:postizSettings(channel.providerIdentifier,{tiktokDirectPostVerified:false,linkedinDocumentCarousel:pkg.format==='carousel',carouselName:pkg.title})});}
 const payload:PostizCreateRequest={type:'schedule',date:pkg.scheduledAt,shortLink:false,tags:[],posts};
 const intent:DispatchJournal={contentId:pkg.contentId,hash:identity,scheduledAt:pkg.scheduledAt,state:'INTENT_PERSISTED',at:new Date().toISOString(),payload};journals.push(intent);await atomicJson(join(dir,'dispatches.json'),journals);
 let sent=false;
 try{const receipt=await dispatchReviewedRelease({root,release:pkg,expectedHash:identity,checkLive,
  beforeSend:async()=>{intent.state='DISPATCHING';await atomicJson(join(dir,'dispatches.json'),journals);sent=true;},
  createPosts:()=>client.createPosts(payload),
  persistReceipt:async(receipt)=>{intent.receipt=receipt;intent.state='RECEIPT_RECEIVED';await atomicJson(join(dir,'dispatches.json'),journals);}
 });intent.state='ACKNOWLEDGED';
 const indexFile=join(dir,'delivery-index.json');const index:DeliveryIndexEntry[]=existsSync(indexFile)?JSON.parse(await readFile(indexFile,'utf8')):[];for(const r of receipt)index.push({contentId:pkg.contentId,postId:r.postId,format:pkg.format,pillar:pkg.pillar,slot:pkg.timeBand});await atomicJson(indexFile,index);
 }catch(e){intent.state=!sent?'BLOCKED_BEFORE_DISPATCH':'AMBIGUOUS';intent.error=!sent?'Live authorization or exact asset verification failed before dispatch; no post request was sent.':e instanceof PostizApiError?`Postiz HTTP ${e.status??'network'}`:'Incomplete or uncertain response. Reconcile every account before any retry.';}
 await atomicJson(join(dir,'dispatches.json'),journals);reports.push({id:pkg.contentId,status:intent.state,scheduledAt:pkg.scheduledAt});
 }
 const result={at:new Date().toISOString(),mode:live?'live':'validation',reports,releaseCount:files.length};await atomicJson(join(dir,'scheduling-status.json'),result);console.log(JSON.stringify(result,null,2));
});
