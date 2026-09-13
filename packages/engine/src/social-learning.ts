import { z } from 'zod';
export const MetricSeriesSchema=z.array(z.object({label:z.string(),data:z.array(z.object({total:z.union([z.string(),z.number()]),date:z.string()})),percentageChange:z.number().optional()}));
export type MetricSeries=z.infer<typeof MetricSeriesSchema>;
export const metricNames=['views','reach','impressions','likes','comments','shares','saves','clicks','watchTime','completionRate'] as const;
export type MetricName=typeof metricNames[number];
export type Counts=Record<MetricName,number|null>;
const aliases:Record<string,MetricName>={views:'views','video views':'views',reach:'reach',impressions:'impressions',likes:'likes',comments:'comments',shares:'shares',saves:'saves',clicks:'clicks','link clicks':'clicks','watch time':'watchTime','completion rate':'completionRate'};
/** Preserve unknown series semantics rather than manufacture lifetime totals. */
export function normalizePostMetrics(raw:MetricSeries):{metrics:Counts;unmapped:string[];ambiguous:string[]}{
 const metrics=Object.fromEntries(metricNames.map(k=>[k,null])) as Counts;
 const unmapped:string[]=[],ambiguous:string[]=[];
 const seen=new Set<MetricName>();
 for(const series of raw){
  const key=aliases[series.label.trim().toLowerCase()];
  if(!key){unmapped.push(series.label);continue;}
  // Duplicate labels/aliases are not additive and neither is authoritative.
  if(seen.has(key)){metrics[key]=null;ambiguous.push(series.label);continue;}
  seen.add(key);
  if(series.data.length>1){ambiguous.push(series.label);continue;}
  const point=series.data[0];
  if(!point||typeof point.total==='string'&&!point.total.trim())continue;
  const value=Number(point.total);
  if(Number.isFinite(value)&&value>=0)metrics[key]=value;
 }
 return {metrics,unmapped,ambiguous};
}
export function basicEngagement(m:Counts){return m.likes!==null&&m.comments!==null?m.likes+m.comments:null;}
export function engagementPerReach(m:Counts){const n=basicEngagement(m);return n!==null&&m.reach!==null&&m.reach>0?n/m.reach:null;}
export function isPublicPost(p:{state:string;releaseURL?:string|null;platform:string;settings?:Record<string,unknown>}){
 if(p.state!=='PUBLISHED'||!p.releaseURL)return false;
 let url:URL;try{url=new URL(p.releaseURL);}catch{return false;}
 if(url.protocol!=='https:'||url.username||url.password||url.port)return false;
 const host=url.hostname.toLowerCase();
 const belongs=(domain:string)=>host===domain||host.endsWith('.'+domain);
 const path=url.pathname;
 switch(p.platform){
  case 'instagram':return belongs('instagram.com')&&(/^\/(?:p|reel|tv)\/[^/]+\/?$/.test(path)||/^\/stories\/[^/]+\/\d+\/?$/.test(path));
  case 'tiktok':return p.settings?.content_posting_method!=='UPLOAD'&&belongs('tiktok.com')&&/^\/@[^/]+\/(?:video|photo)\/\d+\/?$/.test(path);
  case 'x':return (belongs('x.com')||belongs('twitter.com'))&&/^\/[^/]+\/status\/\d+\/?$/.test(path);
  case 'linkedin':return belongs('linkedin.com')&&(/^\/feed\/update\/urn:li:(?:activity|share|ugcPost):\d+\/?$/.test(path)||/^\/posts\/[^/]+\/?$/.test(path));
  case 'facebook':return belongs('facebook.com')&&(
   /^\/(?:[^/]+\/)?posts\/[^/]+\/?$/.test(path)||
   /^\/(?:reel|videos)\/[^/]+\/?$/.test(path)||/^\/[^/]+\/videos\/[^/]+\/?$/.test(path)||
   path==='/permalink.php'&&Boolean(url.searchParams.get('story_fbid')&&url.searchParams.get('id'))||
   path==='/story.php'&&Boolean(url.searchParams.get('story_fbid')&&url.searchParams.get('id'))||
   /^\/watch\/?$/.test(path)&&Boolean(url.searchParams.get('v'))||
   /^\/photo(?:\.php)?\/?$/.test(path)&&Boolean(url.searchParams.get('fbid')));
  default:return false;
 }
}
export const checkpoints=[2,24,48,72,96,120,144,168] as const;
export interface Observation {observedAt:string;ageHours:number;metrics:Counts;raw:MetricSeries;unmapped:string[];ambiguous:string[];error:string|null;checkpointHours:number|null}
export interface TrackedPost {id:string;platform:string;accountId:string;title:string;state:string;releaseURL:string|null;publishedAt:string;publicConfirmed:boolean;contentId:string|null;format:string|null;pillar:string|null;slot:string|null;observations:Observation[];lastAttemptAt?:string;nextCheckAt:string|null;lastError:string|null}
export interface LearningState {version:1;updatedAt:string|null;syncError:string|null;posts:TrackedPost[];channels:Array<{id:string;platform:string;name:string;disabled:boolean}>;runs:Array<{at:string;status:string;details:string}>}
export function nextCheckpoint(publishedAt:string,observations:Observation[],now:number){
 const start=Date.parse(publishedAt);if(!Number.isFinite(start)||!Number.isFinite(now))return null;const recorded=new Set(observations.filter(o=>!o.error&&o.raw.length>0).map(o=>o.checkpointHours));
 for(const h of checkpoints){if(recorded.has(h))continue;const due=start+h*3600000;const grace=h===2?2:8;if(now>due+grace*3600000)continue;return new Date(due).toISOString();}return null;
}
export function checkpointForAge(age:number):number|null{for(const h of [...checkpoints].reverse())if(age>=h&&age<=h+(h===2?2:8))return h;return null;}
export function timingReadout(posts:TrackedPost[],checkpoint=168){
 const groups=new Map<string,{platform:string;format:string;slot:string;posts:number;likesComments:number;reach:number;views:number;withReach:number;withViews:number;rates:number[]}>();
 for(const p of posts){if(!p.contentId||!p.slot||!p.format||!p.publicConfirmed)continue;
 const o=p.observations.find(o=>o.checkpointHours===checkpoint&&!o.error&&o.raw.length>0);if(!o)continue;
 const key=[p.platform,p.format,p.slot].join(':');const g=groups.get(key)??{platform:p.platform,format:p.format,slot:p.slot,posts:0,likesComments:0,reach:0,views:0,withReach:0,withViews:0,rates:[]};
 const engagement=basicEngagement(o.metrics);const validReach=engagement!==null&&o.metrics.reach!==null&&o.metrics.reach>0;if(!validReach&&o.metrics.views===null)continue;g.posts++;if(validReach){g.likesComments+=engagement!;g.reach+=o.metrics.reach!;g.withReach++;g.rates.push(engagement!/o.metrics.reach!);}if(o.metrics.views!==null){g.views+=o.metrics.views;g.withViews++;}groups.set(key,g);
 }
 return [...groups.values()].map(g=>({...g,engagementRate:g.reach>0?g.likesComments/g.reach:null,meanViews:g.withViews?g.views/g.withViews:null,evidence:Math.max(g.withViews,g.withReach)<5?'Insufficient sample':'Directional observation',decision:'Keep testing; topic and audience can confound timing.'}));
}

export const PostSchema=z.object({id:z.string(),content:z.string().nullish(),publishDate:z.string(),releaseURL:z.string().nullish(),state:z.string(),settings:z.record(z.string(),z.unknown()).optional(),integration:z.object({id:z.string(),providerIdentifier:z.string(),name:z.string().optional()})});
export const PostListSchema=z.object({posts:z.array(PostSchema)});
