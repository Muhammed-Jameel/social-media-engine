import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {mkdir,mkdtemp,readFile,rm,writeFile,access} from 'node:fs/promises';
import {unlinkSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {withOperationsLock} from './social-operations-store';
let root:string,lock:string;
const deadPid=2147483000;
beforeEach(async()=>{await mkdir(join(process.cwd(),'.data'),{recursive:true});root=await mkdtemp(join(process.cwd(),'.data/lock-test-'));const dir=join(root,'.data/social-operations');await mkdir(dir,{recursive:true});lock=join(dir,'runner.lock');});
afterEach(async()=>{vi.restoreAllMocks();await rm(root,{recursive:true,force:true});});
function mockPidCheck(code:'ESRCH'|'EPERM'){
 const original=process.kill.bind(process);vi.spyOn(process,'kill').mockImplementation((pid,signal)=>{if(pid===deadPid)throw Object.assign(new Error(code),{code});return original(pid,signal);});
}
describe('Durable operation lock recovery',()=>{
 it('recovers only a confirmed dead PID and releases the new lock',async()=>{
  await writeFile(lock,JSON.stringify({pid:deadPid,at:'2026-09-10T00:00:00Z'}));mockPidCheck('ESRCH');
  await expect(withOperationsLock(root,async()=>42)).resolves.toBe(42);await expect(access(lock)).rejects.toHaveProperty('code','ENOENT');
 });
 it('preserves a live runner lock',async()=>{
  const content=JSON.stringify({pid:process.pid,at:new Date().toISOString()});await writeFile(lock,content);
  await expect(withOperationsLock(root,async()=>{throw Error('must not run');})).rejects.toThrow('active');expect(await readFile(lock,'utf8')).toBe(content);
 });
 it('preserves EPERM owners rather than assuming they are dead',async()=>{
  const content=JSON.stringify({pid:deadPid,at:'2026-09-10T00:00:00Z'});await writeFile(lock,content);mockPidCheck('EPERM');
  await expect(withOperationsLock(root,async()=>{})).rejects.toThrow('inaccessible');expect(await readFile(lock,'utf8')).toBe(content);
 });
 it('preserves malformed locks for explicit reconciliation',async()=>{
  await writeFile(lock,'');await expect(withOperationsLock(root,async()=>{})).rejects.toThrow('Malformed');expect(await readFile(lock,'utf8')).toBe('');
 });
 it('does not unlink a replacement inode appearing during stale recovery',async()=>{
  await writeFile(lock,JSON.stringify({pid:deadPid,at:'2026-09-10T00:00:00Z'}));const live=JSON.stringify({pid:process.pid,at:new Date().toISOString()});
  vi.spyOn(process,'kill').mockImplementation(()=>{unlinkSync(lock);writeFileSync(lock,live);throw Object.assign(new Error('gone'),{code:'ESRCH'});});
  await expect(withOperationsLock(root,async()=>{})).rejects.toThrow('changed');expect(await readFile(lock,'utf8')).toBe(live);
 });
 it('allows at most one concurrent worker to enter a dead-lock recovery',async()=>{
  await writeFile(lock,JSON.stringify({pid:deadPid,at:'2026-09-10T00:00:00Z'}));mockPidCheck('ESRCH');let entered=0,maximum=0;let release:()=>void=()=>{};const hold=new Promise<void>(r=>{release=r;});
  const action=async()=>{entered++;maximum=Math.max(maximum,entered);await hold;entered--;};
  const a=withOperationsLock(root,action);const b=withOperationsLock(root,action);
  // A rejected competing acquisition unlocks the held successful test worker.
  void a.catch(()=>release());void b.catch(()=>release());
  const results=await Promise.allSettled([a,b]);expect(maximum).toBe(1);expect(results.filter(x=>x.status==='fulfilled')).toHaveLength(1);
 });
 it('cleans up its own lock after an operation error',async()=>{
  await expect(withOperationsLock(root,async()=>{throw Error('fixture failure');})).rejects.toThrow('fixture failure');await expect(access(lock)).rejects.toHaveProperty('code','ENOENT');
 });
});
