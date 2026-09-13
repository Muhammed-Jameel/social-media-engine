import {z} from 'zod';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolveWithinRoot} from './security';
import {readVerifiedAsset} from './postiz';
const text=z.string().min(1),hash=z.string().regex(/^[a-f0-9]{64}$/);
export const ReleaseSchema=z.object({version:z.literal(1),contentId:z.string().regex(/^[SBU]\d{2}$/),title:text,pillar:text,format:z.enum(['carousel','reel']),scheduledAt:z.string().datetime(),timeBand:z.enum(['morning','afternoon','evening']),review:z.object({path:text,sha256:hash}),variants:z.array(z.object({platform:z.enum(['instagram','facebook','linkedin','x','tiktok']),accountId:text,title:text,entries:z.array(z.object({caption:text,assets:z.array(z.object({path:text,sha256:hash,mimeType:z.enum(['image/png','image/jpeg','video/mp4']),width:z.number().min(720),height:z.number().min(720)}))})).min(1)})).length(5)}).superRefine((p,c)=>{
 const fail=(message:string)=>c.addIssue({code:'custom',message});if(new Set(p.variants.map(v=>v.platform)).size!==5)fail('All five platform variants required.');
 for(const v of p.variants){if(v.entries.some((e,index)=>e.assets.length===0&&(v.platform!=='x'||index===0)))fail('Media is required except in X continuation entries');const max=v.platform==='x'?280:v.platform==='linkedin'?3000:2200;if(v.entries.some(e=>Array.from(e.caption).length>max))fail('Caption exceeds platform limit');if(v.platform!=='x'&&v.entries.length!==1)fail('Only X supports multiple thread entries');if(v.platform==='x'&&v.entries.some(e=>e.assets.length>4))fail('X limit: four media per entry');const a=v.entries.flatMap(e=>e.assets);if(p.format==='reel'&&(a.length!==1||a[0]?.mimeType!=='video/mp4'))fail('Reel requires one MP4 per platform');if(p.format==='carousel'&&a.some(x=>x.mimeType==='video/mp4'))fail('Carousel needs images');if(p.format==='reel'){const ratio=['instagram','tiktok'].includes(v.platform)?9/16:16/9;if(a.some(x=>Math.abs(x.width/x.height-ratio)>.01))fail('Wrong native aspect ratio');}}
});
export type SocialRelease=z.infer<typeof ReleaseSchema>;
export const releaseContentHash=(p:SocialRelease)=>createHash('sha256').update(JSON.stringify({...p,review:undefined})).digest('hex');
export async function verifySocialRelease(root:string,p:SocialRelease){
 const contentHash=releaseContentHash(p);const raw=await readFile(resolveWithinRoot(root,p.review.path));if(createHash('sha256').update(raw).digest('hex')!==p.review.sha256)throw Error('Review evidence changed.');
 const r=z.object({contentHash:hash,passed:z.literal(true),reviewer:text,producer:text,observations:z.array(text).min(3),hardFailures:z.array(text).length(0)}).parse(JSON.parse(raw.toString()));if(r.contentHash!==contentHash||r.reviewer===r.producer)throw Error('Independent review must bind this exact release.');
 for(const v of p.variants)for(const e of v.entries)for(const a of e.assets){if(!a.path.startsWith('apps/web/public/monthly-plan/2026-09/editorial/'))throw Error('Outside authorized September asset scope');await readVerifiedAsset({root,sourcePath:a.path,sha256:a.sha256});}
 return contentHash;
}
export function assertLiveGate(h:{status?:string;publishingEnabled?:boolean;ownerAuthConfigured?:boolean},enabled:boolean,paused:boolean){if(enabled!==true||paused!==false)throw Error('Automatic publishing is paused.');if(h.status!=='ok'||h.publishingEnabled!==true||h.ownerAuthConfigured!==true)throw Error('Live dashboard publishing gate is closed. Production authentication and runtime switches must be configured; nothing was dispatched.');}

export interface DispatchReceipt {postId:string;integration:string}
/** An acknowledgment must identify every expected account and distinct provider post. */
export function assertCompleteReceipt(receipt:DispatchReceipt[],release:SocialRelease){
 const accounts=new Set(release.variants.map(v=>v.accountId));
 if(receipt.length!==accounts.size||new Set(receipt.map(r=>r.integration)).size!==accounts.size||new Set(receipt.map(r=>r.postId)).size!==receipt.length||receipt.some(r=>!r.postId.trim()||!accounts.has(r.integration)))throw Error('Incomplete or conflicting acknowledgment');
}
/** Revalidate exact artifacts and current live authorization immediately before sending.
 * Persist even a partial receipt before validating it: recovery must not lose known IDs.
 */
export async function dispatchReviewedRelease(input:{root:string;release:SocialRelease;expectedHash:string;checkLive:()=>Promise<void>;beforeSend:()=>Promise<void>;createPosts:()=>Promise<DispatchReceipt[]>;persistReceipt:(receipt:DispatchReceipt[])=>Promise<void>}){
 if(await verifySocialRelease(input.root,input.release)!==input.expectedHash)throw Error('Release changed after initial verification.');
 await input.checkLive();
 await input.beforeSend();
 const receipt=await input.createPosts();
 await input.persistReceipt(receipt);
 assertCompleteReceipt(receipt,input.release);
 return receipt;
}

export function isWithinScheduleWindow(scheduledAt:string,startsAt:string,endsAt:string){
 const time=Date.parse(scheduledAt),start=Date.parse(startsAt),end=Date.parse(endsAt);
 return [time,start,end].every(Number.isFinite)&&start<end&&time>=start&&time<end;
}
