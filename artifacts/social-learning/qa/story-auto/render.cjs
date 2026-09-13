const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('/Users/muhammedjameel/Documents/AURENDOR/apps/social-media-engine/node_modules/@playwright/test');
const sharp=require('/Users/muhammedjameel/Documents/Aurendor-website-redeisgn/aurendor-launch-1109/node_modules/sharp');
const base='/Users/muhammedjameel/Documents/Aurendor-website-redeisgn/content-system-v8/production';
const publicBase='/Users/muhammedjameel/Documents/AURENDOR/apps/social-media-engine/apps/web/public/monthly-plan/2026-09/editorial';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--allow-file-access-from-files']});
 const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
 const c=await page.context().newCDPSession(page);await c.send('DOM.enable');await c.send('CSS.enable');const rows=[];
 try {for(const [cycle,id] of [['cycle-01','B01'],['cycle-02','B02'],['cycle-02','U02'],['cycle-02','S02']]){
  const dir=path.join(base,cycle,id),source=path.join(dir,'story-auto.html'),png=path.join(dir,'story-auto.png');
  await page.goto('file://'+source);await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:png});const mobile=path.join(__dirname,id+'-mobile.png');await sharp(png).resize(360).png().toFile(mobile);
  const proof=await page.evaluate(()=>{
   const sel='h1,p,.series,.label,.title-sample,.kicker,.question,.auto-takeaway,.head,.english,.arabic,.eyebrow,.disclosure';
   const nodes=[...document.querySelectorAll(sel)].filter(e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden');
   return {images:[...document.images].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})),text:nodes.map(e=>{const range=document.createRange();range.selectNodeContents(e);const r=range.getBoundingClientRect();return {text:e.innerText,fontFamily:getComputedStyle(e).fontFamily,fontSize:getComputedStyle(e).fontSize,lineHeight:getComputedStyle(e).lineHeight,x:r.x,y:r.y,right:r.right,bottom:r.bottom,overflow:e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2}}),documentOverflow:document.documentElement.scrollWidth>1080||document.documentElement.scrollHeight>1920};
  });
  const doc=await c.send('DOM.getDocument');const ids=await c.send('DOM.querySelectorAll',{nodeId:doc.root.nodeId,selector:'h1,p,.series,.label,.title-sample,.kicker,.question,.auto-takeaway,.english,.arabic,.eyebrow,.disclosure'});const fonts=[];
  for(const nodeId of ids.nodeIds)fonts.push(...(await c.send('CSS.getPlatformFontsForNode',{nodeId})).fonts.filter(f=>f.glyphCount));
  const destination=path.join(publicBase,cycle,id,'story-auto.png');fs.copyFileSync(png,destination);
  rows.push({contentId:id,source,sourceSha256:hash(source),png,publicPath:destination,sha256:hash(png),dimensions:{width:1080,height:1920},mobileProof:mobile,mobileProofSha256:hash(mobile),...proof,fonts,fallbacks:fonts.filter(f=>!/Ghroob|Ranclo/i.test(f.familyName)),reviewStatus:'PRODUCER_QA_REQUIRES_INDEPENDENT_REVIEW'});
 }}finally{await browser.close();}
 await sharp({create:{width:1440,height:640,channels:3,background:'#003f35'}}).composite(rows.map((r,i)=>({input:r.mobileProof,left:i*360,top:0}))).png().toFile(path.join(__dirname,'contact-mobile.png'));
 fs.writeFileSync(path.join(__dirname,'producer-proof.json'),JSON.stringify({producer:'/root/story_publish_review',createdAt:new Date().toISOString(),method:'Separate HTML source variants derived from original editable Story layouts, rendered in Chrome; actual platform font glyph runs measured by CDP. Original source and PNG files retained.',items:rows},null,2));
 console.log(JSON.stringify(rows.map(r=>({id:r.contentId,hash:r.sha256,images:r.images.every(i=>i.loaded),overflow:r.text.filter(t=>t.overflow),fallbacks:r.fallbacks,documentOverflow:r.documentOverflow})),null,2));
})().catch(e=>{console.error(e);process.exit(1)});
