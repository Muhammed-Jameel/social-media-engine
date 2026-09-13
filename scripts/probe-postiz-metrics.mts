import {existsSync} from 'node:fs';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
let base=process.env.POSTIZ_API_URL!.replace(/\/$/,'');if(!base.endsWith('/public/v1'))base+='/public/v1';
for(const id of ['cmtsedby40005pv7xuz4us6t3','cmtsedbz70007pv7x2x57lcwv','cmtsedbyu0006pv7xv3p64mg8']){
 const r=await fetch(base+'/analytics/post/'+id+'?date=7',{headers:{Authorization:process.env.POSTIZ_API_KEY!},signal:AbortSignal.timeout(25000)});
 console.log(JSON.stringify({id,status:r.status,body:await r.json()}));
}
