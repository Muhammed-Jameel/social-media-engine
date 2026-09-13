import {mkdir,readFile,writeFile,rename,open,unlink,lstat,type FileHandle} from 'node:fs/promises';
import {join} from 'node:path';
import type {LearningState} from './social-learning';
export const emptyLearning=():LearningState=>({version:1,updatedAt:null,syncError:null,posts:[],channels:[],runs:[]});
export async function readLearning(root:string):Promise<LearningState>{try{return JSON.parse(await readFile(join(root,'.data/social-operations/learning.json'),'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return emptyLearning();throw e;}}
export async function atomicJson(path:string,value:unknown){const tmp=path+'.'+process.pid+'.tmp';await writeFile(tmp,JSON.stringify(value,null,2));await rename(tmp,path);}
function busy(message:string){return Object.assign(new Error(message),{code:'EEXIST'});}
const metadata=()=>JSON.stringify({pid:process.pid,at:new Date().toISOString()});
async function unlinkOwned(path:string,file:FileHandle){
 const expected=await file.stat();
 try{const current=await lstat(path);if(current.dev!==expected.dev||current.ino!==expected.ino)throw busy('Operations lock changed; replacement retained.');await unlink(path);}
 catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
}
async function acquireOperationsLock(path:string):Promise<FileHandle>{
 try{return await open(path,'wx');}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;}
 // Serialize recovery attempts. A live runner's normal acquisition can win the
 // gap after unlink; our following wx then fails rather than deleting its lock.
 const recoveryPath=path+'.recovery';let recovery:FileHandle;
 try{recovery=await open(recoveryPath,'wx');}
 catch(e){if((e as NodeJS.ErrnoException).code==='EEXIST')throw busy('Operations lock recovery is already reserved. If its runner stopped, reconcile the recovery file manually; it was retained.');throw e;}
 try{
  await recovery.writeFile(metadata());
  let original:FileHandle;
  try{original=await open(path,'r');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return await open(path,'wx');throw e;}
  try{
   let owner:{pid?:unknown;at?:unknown};
   try{owner=JSON.parse(await original.readFile('utf8'));}catch{throw busy('Malformed operations lock retained; inspect before recovery.');}
   if(!owner||typeof owner.pid!=='number'||!Number.isInteger(owner.pid)||owner.pid<=0||typeof owner.at!=='string'||!Number.isFinite(Date.parse(owner.at)))throw busy('Malformed operations lock retained; inspect before recovery.');
   let dead=false;
   try{process.kill(owner.pid,0);}catch(e){if((e as NodeJS.ErrnoException).code==='ESRCH')dead=true;else throw busy('Operations runner may still be active or inaccessible; lock retained.');}
   if(!dead)throw busy(`Operations runner PID ${owner.pid} is active; lock retained.`);
   // Under the recovery reservation, compare the opened inode immediately
   // before removal. Never unlink a replacement path or a live/EPERM owner.
   await unlinkOwned(path,original);
  }finally{await original.close();}
  return await open(path,'wx');
 }finally{try{await unlinkOwned(recoveryPath,recovery);}finally{await recovery.close();}}
}
export async function withOperationsLock<T>(root:string,fn:()=>Promise<T>):Promise<T>{
 const dir=join(root,'.data/social-operations');await mkdir(dir,{recursive:true});const lock=join(dir,'runner.lock');const file=await acquireOperationsLock(lock);
 try{await file.writeFile(metadata());return await fn();}
 finally{try{await unlinkOwned(lock,file);}finally{await file.close();}}
}
