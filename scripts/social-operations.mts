import {existsSync} from 'node:fs';
import {mkdir,readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {getPostizClient,platformForPostizProvider,PostizApiError} from '../packages/engine/src/postiz';
import {PostListSchema,MetricSeriesSchema,normalizePostMetrics,isPublicPost,nextCheckpoint,checkpointForAge} from '../packages/engine/src/social-learning';
import {readLearning,atomicJson,withOperationsLock} from '../packages/engine/src/social-operations-store';
const root=resolve(import.meta.dirname,'..');if(existsSync(join(root,'.env.local')))process.loadEnvFile(join(root,'.env.local'));
const dir=join(root,'.data/social-operations');await mkdir(dir,{recursive:true});

const cli=process.argv.slice(2);const mode=cli[0]||'sync';
if(!['sync','status'].includes(mode))throw Error('Supported: sync | status');
if(mode==='status'){const s=await readLearning(root);console.log(JSON.stringify({updatedAt:s.updatedAt,syncError:s.syncError,channels:s.channels,posts:s.posts.map(p=>({id:p.id,state:p.state,platform:p.platform,publicConfirmed:p.publicConfirmed,observations:p.observations.length,nextCheckAt:p.nextCheckAt,lastError:p.lastError})),runs:s.runs.slice(-3)},null,2));}
else await withOperationsLock(root,async()=>{
 const client=getPostizClient();if(!client)throw Error('Postiz is not configured');const s=await readLearning(root);const now=Date.now();const at=new Date(now).toISOString();
 try{
 const channels=await client.listIntegrations();s.channels=channels.map(i=>({id:i.id,platform:platformForPostizProvider(i.providerIdentifier)||i.providerIdentifier,name:i.name,disabled:!!i.disabled}));
 const listing=PostListSchema.parse(await client.listPosts(new Date(now-35*86400000).toISOString(),new Date(now+35*86400000).toISOString()));
 let deliveries:{contentId:string;postId:string;format:string;pillar:string;slot:string}[]=[];
 try{deliveries=JSON.parse(await readFile(join(dir,'delivery-index.json'),'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 for(const p of listing.posts){const platform=platformForPostizProvider(p.integration.providerIdentifier)||p.integration.providerIdentifier;const linked=deliveries.find(x=>x.postId===p.id);let row=s.posts.find(x=>x.id===p.id);
 if(!row){row={id:p.id,platform,accountId:p.integration.id,title:(p.content||'Untitled').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,140),state:p.state,releaseURL:p.releaseURL||null,publishedAt:p.publishDate,publicConfirmed:false,contentId:linked?.contentId||null,format:linked?.format||null,pillar:linked?.pillar||null,slot:linked?.slot||null,observations:[],nextCheckAt:null,lastError:null};s.posts.push(row);}
 Object.assign(row,{state:p.state,releaseURL:p.releaseURL||null,publishedAt:p.publishDate,publicConfirmed:isPublicPost({...p,platform}),...(linked?{contentId:linked.contentId,format:linked.format,pillar:linked.pillar,slot:linked.slot}:{})});
 if(platform==='tiktok'&&!row.publicConfirmed){row.lastError='Inbox delivery is not public publication. Native completion and a verified public post ID are required.';continue;}
 if(!row.publicConfirmed){row.lastError=p.state==='ERROR'?'Postiz reports a delivery error. Inspect and reconcile before retrying.':null;continue;}
 const age=(now-Date.parse(p.publishDate))/3600000;row.nextCheckAt=nextCheckpoint(p.publishDate,row.observations,now);
 const fresh=row.observations.length===0&&age>=0&&age<=176;
 const due=row.nextCheckAt&&Date.parse(row.nextCheckAt)<=now;
 const cooldown=row.lastAttemptAt&&now-Date.parse(row.lastAttemptAt)<3600000;
 if((!fresh&&!due)||cooldown)continue;
 row.lastAttemptAt=at;
 try{const raw=MetricSeriesSchema.parse(await client.postAnalytics(p.id,7));const normalized=normalizePostMetrics(raw);row.observations.push({observedAt:at,ageHours:age,...normalized,raw,error:null,checkpointHours:checkpointForAge(age)});row.lastError=raw.length?'': 'Provider returned no metrics; unavailable, not zero.';}
 catch(e){row.lastError=e instanceof PostizApiError?`Postiz analytics HTTP ${e.status??'network'}; check provider permission or availability.`:'Analytics response failed validation or request.';row.observations.push({observedAt:at,ageHours:age,...normalizePostMetrics([]),raw:[],error:row.lastError,checkpointHours:checkpointForAge(age)});}
 row.nextCheckAt=nextCheckpoint(p.publishDate,row.observations,now);await atomicJson(join(dir,'learning.json'),s);
 }
 s.updatedAt=at;s.syncError=null;s.runs.push({at,status:'completed',details:`${listing.posts.length} posts reconciled; ${s.posts.filter(p=>p.publicConfirmed).length} public links verified by provider response.`});
 }catch(e){s.syncError=e instanceof PostizApiError?`Postiz sync HTTP ${e.status??'network'}`:'Postiz sync failed validation or connection.';s.runs.push({at,status:'failed',details:s.syncError});}
 s.runs=s.runs.slice(-100);await atomicJson(join(dir,'learning.json'),s);console.log(JSON.stringify({updatedAt:s.updatedAt,error:s.syncError,posts:s.posts.length,observations:s.posts.reduce((n,p)=>n+p.observations.length,0)}));if(s.syncError)process.exitCode=1;
});
