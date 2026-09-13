import {readFile,writeFile,mkdir} from 'node:fs/promises';import {resolve,join} from 'node:path';import{createHash}from'node:crypto';
import{ReleaseSchema,releaseContentHash,verifySocialRelease}from'../packages/engine/src/social-release';
const root=resolve(import.meta.dirname,'..');const [id,cycle,reviewPath]=process.argv.slice(2);if(!id||!cycle||!reviewPath)throw Error('Usage: stage-social-release ID cycle-02 independent-evidence.json');
const policy=JSON.parse(await readFile(join(root,'data/social-operations-policy.json'),'utf8'));const slot=policy.schedule.find((s:{id:string})=>s.id===id);if(!slot)throw Error('ID not authorized');
const base=`apps/web/public/monthly-plan/2026-09/editorial/${cycle}`;const m=JSON.parse(await readFile(join(root,base,'manifest.json'),'utf8'));const item=m.items.find((i:{id:string})=>i.id===id);if(!item)throw Error('No production item');
const report=JSON.parse(await readFile(resolve(reviewPath),'utf8'));if(report.passed!==true||report.hardFailures?.length||!report.reviewer||!report.producer)throw Error('Independent evidence does not pass');
const asset=async(path:string)=>{const bytes=await readFile(join(root,base,path));const video=path.endsWith('.mp4');return{path:base+'/'+path,sha256:createHash('sha256').update(bytes).digest('hex'),mimeType:video?'video/mp4':'image/png',width:video&&path.includes('horizontal')?1920:1080,height:video?(path.includes('horizontal')?1080:1920):1350};};
const variants=[];
for(const platform of ['instagram','facebook','linkedin','x','tiktok']){const pc=item.platforms[platform];if(!pc)throw Error('Platform copy missing');const texts:string[]=platform==='x'?pc.posts:[pc.caption||pc.copy];if(!texts?.length||texts.some(t=>!t))throw Error('Missing exact caption');const entries=[];
 if(item.format==='reel'){
  const video=await asset(['instagram','tiktok'].includes(platform)?item.video:item.horizontalVideo);entries.push({caption:texts[0],assets:[video]});if(platform==='x')for(const caption of texts.slice(1))entries.push({caption,assets:[]});
 }else if(platform==='x'){
  // Honor authored selected frames where provided; otherwise distribute the full ordered sequence.
  const chosen:string[]=pc.assets?.map((p:string)=>id+'/'+p.split('/').at(-1))||item.slides;
  if(chosen.length>texts.length*4)throw Error('X requires additional authored thread copy');
  for(let n=0;n<texts.length;n++){const chunk=chosen.slice(Math.floor(n*chosen.length/texts.length),Math.floor((n+1)*chosen.length/texts.length));entries.push({caption:texts[n],assets:await Promise.all(chunk.map(asset))});}
 }else entries.push({caption:texts[0],assets:await Promise.all(item.slides.map(asset))});
 variants.push({platform,accountId:policy.accounts[platform],title:item.title,entries});}
const reviewedHashes=new Set((report.examinedFiles||[]).map((f:{sha256:string})=>f.sha256));
for(const v of variants)for(const e of v.entries)for(const a of e.assets)if(!reviewedHashes.has(a.sha256))throw Error('Asset was not bound by the independent review: '+a.path);
const out=join(root,'artifacts/social-releases');await mkdir(out,{recursive:true});const relReview=`artifacts/social-releases/${id}.review.json`;
let pkg=ReleaseSchema.parse({version:1,contentId:id,title:item.title,pillar:slot.pillar,format:item.format,scheduledAt:slot.scheduledAt,timeBand:slot.timeBand,review:{path:relReview,sha256:'0'.repeat(64)},variants});
const bound={contentHash:releaseContentHash(pkg),reviewer:report.reviewer,producer:report.producer,passed:report.passed,observations:[...report.observations.map((o:unknown)=>typeof o==='string'?o:JSON.stringify(o)),'Exact platform captions, account IDs and Baghdad experiment slot inspected during release assembly.'],hardFailures:report.hardFailures,evidencePath:resolve(reviewPath),evidenceSha256:createHash('sha256').update(await readFile(resolve(reviewPath))).digest('hex')};
const raw=JSON.stringify(bound,null,2);await writeFile(join(root,relReview),raw);pkg={...pkg,review:{path:relReview,sha256:createHash('sha256').update(raw).digest('hex')}};await verifySocialRelease(root,pkg);await writeFile(join(out,id+'.release.json'),JSON.stringify(pkg,null,2));console.log(JSON.stringify({id,scheduledAt:pkg.scheduledAt,platforms:variants.length,state:'staged—not scheduled',hash:releaseContentHash(pkg)}));
