"use strict";
const token = location.hash.slice(1) || sessionStorage.getItem("sme-token");
if (token) sessionStorage.setItem("sme-token", token);
history.replaceState(null, "", location.pathname);
let state;
const blobs = [];
const previewObservers = [];
const $ = id => document.getElementById(id);
function node(tag, value, cls) { const n = document.createElement(tag); if (value !== undefined) n.textContent = value; if (cls) n.className = cls; return n; }
function notice(message, error=false) { $("notice").textContent=message; $("notice").className=error?"error":""; }
async function api(route, body) {
  const response = await fetch(route, {method:body?"POST":"GET",headers:{Authorization:"Bearer "+token,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const result = await response.json(); if(!response.ok) throw Error(result.error); return result;
}
function action(label, fn, secondary=false) { const b=node("button",label,secondary?"secondary":""); b.type="button"; b.onclick=async()=>{b.disabled=true;try {await fn(); await refresh();}catch(e){notice(e.message,true);}finally{b.disabled=false;}}; return b; }
function actor() { return state.brand.profile?.answers.approval_owner || "workspace owner"; }
function card(title, body) { const c=node("article",undefined,"card"); c.append(node("h3",title)); if(body)c.append(node("p",body)); return c; }
function tab(name) {document.querySelectorAll(".tab").forEach(n=>n.hidden=n.id!==name); document.querySelectorAll("nav button").forEach(n=>n.setAttribute("aria-current",n.dataset.tab===name?"page":"false"));}
document.querySelectorAll("nav button").forEach(n=>n.onclick=()=>tab(n.dataset.tab));
async function refresh() {
  previewObservers.splice(0).forEach(observer=>observer.disconnect());
  blobs.splice(0).forEach(URL.revokeObjectURL);
  state=await api("/api/state");
  $("brand-name").textContent=state.brand.profile?.answers.name || "Make it unmistakably yours.";
  $("state").textContent=state.brand.state.replaceAll("_"," ");
  overview(); brandForm(); content(); learning(); activity();
}
function overview() {
  const root=$("overview");root.replaceChildren();
  const intro=card(state.brand.state==="READY"?"Your next good idea starts here.":"Let's get to know your brand.", state.brand.state==="READY"?"Return to Codex or Claude to plan, write, and produce content using your saved brand. Review the results here.":"Your identity, audience, and creative preferences shape every brief. Complete the questionnaire with your assistant or use Brand & assets.");
  intro.append(action("Open brand profile",()=>tab("brand"),true));root.append(intro);
  const grid=node("div",undefined,"grid");
  [[state.plans.length,"Plans"],[state.items.filter(i=>(i.effective_status||i.status)!=="APPROVED").length,"Awaiting review"],[state.items.filter(i=>(i.effective_status||i.status)==="APPROVED").length,"Approved"]].forEach(([n,t])=>{const c=card(t);c.append(node("div",String(n),"number"));grid.append(c);});root.append(grid);
  if(state.plans.length){const p=card("Content calendar");state.plans.forEach(plan=>{const d=node("details");d.append(node("summary",plan.month+" / "+plan.strategy));plan.items.forEach(i=>d.append(node("p",new Date(i.scheduled_at).toLocaleString(undefined,{timeZone:state.brand.profile.answers.timezone})+" · "+i.title+" · "+i.platforms.join(", "))));p.append(d);});root.append(p);}
}
function brandForm() {
  const form=$("brand-form");form.replaceChildren();const answers=state.brand.profile?.answers||{};
  Object.entries(state.questionnaire).forEach(([group,fields])=>{const set=node("fieldset");set.append(node("legend",group));fields.forEach(f=>{const label=node("label",f.replaceAll("_"," ")+(state.required.includes(f)?" *":"")); const input=node(["name","industry","website","timezone","approval_owner"].includes(f)?"input":"textarea");input.name=f;input.value=Array.isArray(answers[f])?answers[f].join("\n"):answers[f]||"";input.dir="auto";label.append(input);set.append(label);});form.append(set);});
  const actions=node("div",undefined,"actions");const save=node("button","Save progress");save.type="submit";actions.append(save);
  if(state.brand.state==="BRAND_REVIEW")actions.append(action("Approve this brand profile",async()=>{await api("/api/brand-approve",{hash:state.brand.profile.hash,actor:actor()});notice("Brand approved. Your assistant can now use this profile.");}));
  form.append(actions);
  form.onsubmit=async e=>{e.preventDefault();try{const values={};new FormData(form).forEach((v,k)=>{if(v.trim())values[k]=state.list_fields.includes(k)?v.split("\n").map(s=>s.trim()).filter(Boolean):v.trim();else if(state.list_fields.includes(k)&&!state.required.includes(k))values[k]=[];});await api("/api/brand",{answers:values,actor:values.approval_owner||actor()});notice("Progress saved. Review your answers before approval.");await refresh();}catch(err){notice(err.message,true);}};
  const list=$("asset-list");list.replaceChildren();state.assets.filter(a=>a.role!=="output").forEach(a=>list.append(node("p",a.name+" · "+a.role+" · "+a.rights)));
}
$("upload-form").onsubmit=async e=>{e.preventDefault();try{const f=new FormData(e.target),file=f.get("file");if(file.size>20*1024*1024)throw Error("Browser uploads are limited to 20 MB. Ask your assistant to import larger files.");const bytes=new Uint8Array(await file.arrayBuffer());let binary="";for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));await api("/api/asset",{name:file.name,base64:btoa(binary),role:f.get("role"),rights:f.get("rights"),note:f.get("note"),actor:actor()});e.target.reset();notice("Asset added. Review and approve the updated brand profile.");await refresh();}catch(err){notice(err.message,true);}};
async function preview(asset, container) {
  const ext=asset.path.split(".").pop();if(!["png","jpg","jpeg","webp","mp4","webm"].includes(ext))return;
  const slot=node("div",undefined,"media-slot");container.append(slot);
  slot.textContent="Preview loads when visible.";
  await new Promise(resolve=>{const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();resolve();}},{rootMargin:"150px"});previewObservers.push(observer);observer.observe(slot);});
  try{const r=await fetch("/api/asset?id="+encodeURIComponent(asset.id),{headers:{Authorization:"Bearer "+token}});if(!r.ok)throw Error("Preview unavailable");const url=URL.createObjectURL(await r.blob());if(!slot.isConnected){URL.revokeObjectURL(url);return;}blobs.push(url);const n=node(["mp4","webm"].includes(ext)?"video":"img");n.src=url;slot.replaceChildren();if(n.tagName==="VIDEO"){n.controls=true;n.preload="metadata";slot.append(n);}else{n.alt=asset.name;const link=node("a");link.href=url;link.target="_blank";link.rel="noopener";link.title="Open original-size image";link.append(n);slot.append(link);}}catch{slot.textContent="Preview unavailable. Ask your assistant to inspect the local file.";}
}
function content() {
  const root=$("content");root.replaceChildren(node("h2","The work, ready for your eye."));if(!state.items.length)root.append(node("p","Ask your assistant to create the first content package. Finished drafts will appear here.","empty"));
  state.items.forEach(item=>{const c=card(item.title);const effective=item.effective_status||item.status;c.append(node("p",effective.replaceAll("_"," ")+" · Revision "+item.revision,"meta"));if(item.blocked_reason)c.append(node("p",item.blocked_reason));item.variants.forEach(v=>{const d=node("div",undefined,"entry");d.append(node("strong",v.platform+" / "+v.language+" / "+v.format));const caption=node("p",v.caption,"caption");caption.dir="auto";d.append(caption);const media=node("div",undefined,"media");v.asset_ids?.forEach(id=>{const a=state.assets.find(a=>a.id===id);if(a)preview(a,media);});d.append(media);c.append(d);});
    const revisions=(state.revisions||[]).filter(r=>r.id===item.id).sort((a,b)=>b.revision-a.revision);
    if(revisions.length){const history=node("details");history.append(node("summary","Revision history"));revisions.forEach(r=>{history.append(node("strong","Revision "+r.revision+" / "+r.status));r.variants.forEach(v=>{const old=node("p",v.platform+" / "+v.language+": "+v.caption);old.dir="auto";history.append(old);});});c.append(history);}
    const reviews=state.reviews.filter(r=>r.item_id===item.id&&r.item_hash===item.hash);c.append(node("p","Reviews: "+(reviews.map(r=>r.role+" "+r.decision).join(" · ")||"Awaiting independent review"),"meta"));
    const release=action(effective==="APPROVED"?"Export approved package":"Approve this revision",async()=>{if(effective==="APPROVED"){const r=await api("/api/export",{id:item.id});notice("Package exported: "+r.directory);}else{await api("/api/item-approve",{id:item.id,hash:item.hash,actor:actor()});notice("Content approved. Publishing still requires a separate confirmed schedule.");}});release.disabled=effective==="STALE";c.append(release);
    c.append(feedbackForm(item));root.append(c);});
}
function feedbackForm(item){
  const form=node("form");const label=node("label","Your feedback");const note=node("textarea");note.required=true;note.name="feedback";label.append(note);form.append(label);
  const kindLabel=node("label","Decision");const kind=node("select");kind.name="disposition";[["change-request","Request changes"],["rejected","Reject this draft"],["note","Note only"]].forEach(([value,title])=>{const option=node("option",title);option.value=value;kind.append(option);});kindLabel.append(kind);form.append(kindLabel);
  const ratingLabel=node("label","Rating (optional)");const rating=node("select");rating.name="rating";[["","Not rated"],["1","1 / 5"],["2","2 / 5"],["3","3 / 5"],["4","4 / 5"],["5","5 / 5"]].forEach(([value,title])=>{const option=node("option",title);option.value=value;rating.append(option);});ratingLabel.append(rating);form.append(ratingLabel);
  const b=node("button","Save feedback","secondary");b.type="submit";form.append(b);
  form.onsubmit=async e=>{e.preventDefault();b.disabled=true;try{await api("/api/feedback",{id:"feedback-"+crypto.randomUUID(),instruction:note.value,actor:actor(),category:"preference",scope:{item:item.id},disposition:kind.value,...(rating.value?{rating:Number(rating.value)}:{})});notice("Feedback saved. Change requests block unsent content approval; ask your assistant to revise it.");await refresh();}catch(err){notice(err.message,true);}finally{b.disabled=false;}};
  return form;
}
function learning(){const root=$("learning");root.replaceChildren(node("h2","Teach it what matters."));root.append(node("p","Feedback starts as a proposal. Approve a rule only when its scope matches what you want future work to follow."));if(!state.rules.length)root.append(node("p","No feedback saved yet.","empty"));state.rules.forEach(r=>{const c=card(r.instruction);c.append(node("p",r.category+" · "+(Object.keys(r.scope).length?JSON.stringify(r.scope):"All brand content")+" · "+(r.retired?"Retired":r.approved?"Approved":"Proposed"),"meta"));if(!r.retired){const actions=node("div",undefined,"rule-actions");if(!r.approved)actions.append(action("Approve rule",()=>api("/api/rule-approve",{id:r.id,actor:actor()})));actions.append(action("Retire rule",()=>api("/api/rule-retire",{id:r.id,actor:actor()}),true));c.append(actions);}root.append(c);});}
function activity(){const root=$("activity");root.replaceChildren(node("h2","Follow the evidence."));const d=card("Publishing");if(!state.dispatches.length)d.append(node("p","No publication intents. Ask your assistant to connect your provider or export an approved package."));state.dispatches.forEach(r=>{const e=node("div",undefined,"entry");e.append(node("strong",r.item_id+" · "+r.status));e.append(node("p",r.operation+" · "+r.date+" · "+(r.publication_status||"Not sent")));d.append(e);});root.append(d);const m=card("Performance snapshots");if(!state.metrics.length)m.append(node("p","No metrics collected. Unavailable metrics are never filled with invented numbers."));state.metrics.forEach(r=>{const e=node("details");e.append(node("summary",r.platform+" · "+r.captured_at+" · "+(r.synthetic?"SYNTHETIC":"Provider evidence")));e.append(node("pre",JSON.stringify(r.metrics,null,2)));m.append(e);});root.append(m);const events=card("Activity log");state.events.forEach(e=>events.append(node("p",e.created+" · "+e.action+" · "+e.subject,"meta")));root.append(events);}
refresh().catch(e=>notice(e.message,true));
