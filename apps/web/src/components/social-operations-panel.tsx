import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import Link from 'next/link';
import {projectRoot} from '@social-media-plugin/db/runtime';
import {Panel} from './panel';
async function optional(path:string){try{return JSON.parse(await readFile(path,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}}
export async function SocialOperationsPanel({liveEnabled}:{liveEnabled:boolean}){
 const root=projectRoot();const [policy,status,journal,stories]=await Promise.all([optional(join(root,'data/social-operations-policy.json')),optional(join(root,'.data/social-operations/scheduling-status.json')),optional(join(root,'.data/social-operations/dispatches.json')),optional(join(root,'.data/social-operations/story-dispatches.json'))]);if(!policy)return null;
 return <Panel title="September automatic publishing & learning" description="Owner-authorized workflow: varied Baghdad time slots, reviewed immutable releases and a first-week record for every platform post.">
 <div className={liveEnabled?'result-banner':'hard-fail-banner'}><div><strong>{policy.paused?'Automatic publishing paused':liveEnabled?'Live gate open':'Automatic dispatch blocked by production setup'}</strong><p>{liveEnabled?'Only independently reviewed, exact-hash releases can be scheduled.':'The hourly task is configured, but this console is in demonstration mode or lacks production authentication/switches. No automatic schedule has been sent through this workflow.'}</p></div></div>
 <p>New task: SOCIAL_MEDIA_PLUGIN publishing and first-week learning · hourly. Previous monthly-production task cancelled (paused). The local host must be awake for collection; accepted schedules run in hosted Postiz.</p>
 <p><Link href="/analytics">Open real engagement and first-week analytics ↗</Link></p>
 {status?<p>Last scheduling check: {status.at} · {status.mode} · {status.releaseCount} complete release manifests.</p>:<p>Release validation has not run yet.</p>}
 {(status?.reports||[]).map((r:{id:string;status:string;details?:string})=><p key={r.id}><strong>{r.id}: {r.status}</strong> {r.details}</p>)}
 <details><summary>30-post timing rotation · planned, not proof of scheduling</summary><div className="calendar-table-wrap"><table className="data-table"><thead><tr><th>Content</th><th>Baghdad date/time</th><th>Time band</th><th>Dispatch state</th></tr></thead><tbody>{policy.schedule.map((s:{id:string;date:string;time:string;timeBand:string;title:string})=><tr key={s.id}><td>{s.id} · {s.title}</td><td>{s.date} · {s.time}</td><td>{s.timeBand}</td><td>{journal?.find((j:{contentId:string})=>j.contentId===s.id)?.state||'Not scheduled'}</td></tr>)}</tbody></table></div></details>
 {stories?.length>0&&<><h3>Instagram and Facebook Stories</h3><p>Reviewed static versions follow each matching post by30minutes. Each acknowledgment is a schedule receipt, not proof of public delivery.</p><div className="calendar-table-wrap"><table className="data-table"><thead><tr><th>Story</th><th>Baghdad date/time</th><th>State</th><th>Account receipts</th></tr></thead><tbody>{stories.map((s:{contentId:string;scheduledAt:string;state:string;receipt?:unknown[]})=><tr key={s.contentId}><td>{s.contentId}</td><td>{new Date(s.scheduledAt).toLocaleString('en-GB',{timeZone:'Asia/Baghdad',dateStyle:'medium',timeStyle:'short'})}</td><td>{s.state}</td><td>{s.receipt?.length??0} /2</td></tr>)}</tbody></table></div></>}
 <p>TikTok currently requires inbox completion. An existing X post reports ERROR; connection alone is not a successful publishing test. Original interactive Story versions remain available for native stickers; the scheduled static versions contain no sticker placeholders.</p>
 </Panel>;
}
