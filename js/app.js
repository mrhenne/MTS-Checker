let pendingServiceWorker=null;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').then(reg=>{
    if(reg.waiting){
      pendingServiceWorker=reg.waiting;
      showUpdateBanner();
    }
    reg.addEventListener('updatefound',()=>{
      const worker=reg.installing;
      if(!worker)return;
      worker.addEventListener('statechange',()=>{
        if(worker.state==='installed' && navigator.serviceWorker.controller){
          pendingServiceWorker=worker;
          showUpdateBanner();
        }
      });
    });
  }).catch(err=>{
    console.warn('[TriageAssist] Service Worker registration failed', err);
  });
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(sessionStorage.getItem('mts_reloading_update')==='1'){
      sessionStorage.removeItem('mts_reloading_update');
      location.reload();
    }
  });
}

function showUpdateBanner(){
  document.getElementById('updateBanner')?.classList.add('show');
}
function dismissAppUpdate(){
  document.getElementById('updateBanner')?.classList.remove('show');
}
function applyAppUpdate(){
  if(!pendingServiceWorker){
    location.reload();
    return;
  }
  sessionStorage.setItem('mts_reloading_update','1');
  pendingServiceWorker.postMessage({type:'SKIP_WAITING'});
}

let hist=JSON.parse(localStorage.getItem('mts_h')||'[]'),aCat='';
let curDiag=null,selR=[],selI=[];
let manualPriority={level:null,source:'',label:''};
let restoredAssessment=null;
let curVit = { gcs: '', spo2: '', temp: '', nrs: '' };
let curPed = '2'; 
let gcsS = { e: 4, v: 5, m: 6 };
let qsfS = { af: false, rr: false };

function toggleTheme(){
  document.body.classList.toggle('dark');
  const dk=document.body.classList.contains('dark');
  localStorage.setItem('mts_theme',dk?'dark':'light');
  document.getElementById('themeBtn').innerHTML=dk?'<i class="fa-solid fa-sun"></i>':'<i class="fa-solid fa-moon"></i>';
}

function toggleFocus(){
  document.body.classList.toggle('focus-mode');
  const fm=document.body.classList.contains('focus-mode');
  localStorage.setItem('mts_focus',fm?'on':'off');
  document.getElementById('focusBtn').innerHTML=fm?'<i class="fa-solid fa-expand"></i>':'<i class="fa-solid fa-compress"></i>';
}

(function(){
  if(localStorage.getItem('mts_theme')==='dark'){document.body.classList.add('dark');document.getElementById('themeBtn').innerHTML='<i class="fa-solid fa-sun"></i>'}
  if(localStorage.getItem('mts_focus')==='on'){document.body.classList.add('focus-mode');document.getElementById('focusBtn').innerHTML='<i class="fa-solid fa-expand"></i>'}
})();

document.querySelectorAll('.nt').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.nt').forEach(x=>x.classList.remove('on'));
  t.classList.add('on');
  document.querySelectorAll('.pnl').forEach(p=>p.classList.remove('on'));
  document.getElementById('p-'+t.dataset.t).classList.add('on');
  if(t.dataset.t==='body')initBM();
  if(t.dataset.t==='diag')rDiag();
  if(t.dataset.t==='validate')initValidationCenter();
  if(t.dataset.t==='tox')rTox();
  if(t.dataset.t==='lvl')rLvl();
  if(t.dataset.t==='cs')rCS();
  if(t.dataset.t==='train')initTrain();
  if(t.dataset.t==='hist')rHist();
  if(t.dataset.t==='health')runSystemHealth();
  window.scrollTo({top:0,behavior:'smooth'});
}));

const SI_=document.getElementById('SI');

function quickSearch(term){
  SI_.value=term;
  SI_.focus();
  SI_.dispatchEvent(new Event('input',{bubbles:true}));
}

function renderRecentDiagrams(){
  const el=document.getElementById('recentDiagrams');
  if(!el)return;
  const ids=[];
  hist.forEach(h=>{if(!ids.includes(h.id))ids.push(h.id)});
  const recent=ids.slice(0,4).map(id=>D.find(d=>d.id===id)).filter(Boolean);
  if(!recent.length){el.innerHTML='';return}
  el.innerHTML='<span><i class="fa-solid fa-clock-rotate-left"></i> Zuletzt verwendet</span>'+
    '<div>'+recent.map(d=>`<button type="button" onclick="shD(${d.id})"><span class="td td-${cl(d.c)}"></span>${d.name}</button>`).join('')+'</div>';
}

function setupSearchClearButtons(){
  document.querySelectorAll('.sb input[type="text"]').forEach(input=>{
    const wrap=input.closest('.sb');
    if(!wrap||wrap.querySelector('.search-clear'))return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='search-clear';
    btn.title='Eingabe löschen';
    btn.setAttribute('aria-label','Eingabe löschen');
    btn.innerHTML='<i class="fa-solid fa-xmark"></i>';
    const sync=()=>btn.classList.toggle('show',input.value.length>0);
    btn.addEventListener('click',()=>{
      input.value='';
      input.focus();
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
      sync();
    });
    input.addEventListener('input',sync);
    wrap.appendChild(btn);
    sync();
  });
}

function updateCockpitClock(){
  const el=document.getElementById('liveClock');
  if(el) el.textContent=new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
}
function updateNetworkStatus(){
  const el=document.getElementById('netStatus');
  if(!el)return;
  const online=navigator.onLine;
  el.classList.toggle('offline',!online);
  const txt=el.querySelector('span:last-child');
  if(txt) txt.textContent=online?'Online':'Offline';
}
async function loadVersionBadge(){
  try{
    const res=await fetch('./version.json',{cache:'no-store'});
    if(!res.ok)return;
    const v=await res.json();
    const el=document.getElementById('versionBadge');
    if(el) el.textContent=`${v.version||'V2'} · ${v.mtsDataStatus==='validation'?'Validierung':'Freigegeben'}`;
  }catch{}
}
updateCockpitClock();
updateNetworkStatus();
loadVersionBadge();
setInterval(updateCockpitClock,30000);
window.addEventListener('online',updateNetworkStatus);
window.addEventListener('offline',updateNetworkStatus);

SI_.addEventListener('input',debounce(()=>{
  const q=SI_.value.trim().toLowerCase(),sB=document.getElementById('sB'),sC=document.getElementById('sC'),sH=document.getElementById('sH'),sR=document.getElementById('sR');
  if(q.length<2){sR.innerHTML='';sB.style.display='none';sH.style.display='block';return}
  sH.style.display='none';
  const ts=q.split(/[\s,;]+/).filter(t=>t.length>=2);
  const sc=rankSearchResults(
    q,
    D,
    typeof SEARCH_ALIASES!=='undefined'?SEARCH_ALIASES:{},
    typeof SEARCH_BODY_RULES!=='undefined'?SEARCH_BODY_RULES:[],
    typeof SEARCH_SYMPTOM_RULES!=='undefined'?SEARCH_SYMPTOM_RULES:{}
  );
  sB.style.display='flex';sC.innerHTML=`<b>${sc.length}</b> Treffer`;
  if(!sc.length){sR.innerHTML='<div class="empty"><i class="fa-solid fa-magnifying-glass" style="font-size:2rem;margin-bottom:8px;display:block"></i>Keine Diagramme gefunden.</div>';return}
  sR.innerHTML=sc.slice(0,15).map(x=>`<div class="card" onclick="shD(${x.id})"><div class="ch"><span class="ct">${hl(x.name,ts)}</span><span class="tb tb-${cl(x.c)}"><span class="td td-${cl(x.c)}"></span>${x.c}</span></div><div class="cs">Diagramm Nr. ${x.id}</div><div class="tags">${x.kw.filter(k=>x.mt.some(m=>k.includes(m))).slice(0,5).map(k=>`<span class="tag m">${k}</span>`).join('')}${x.kw.filter(k=>!x.mt.some(m=>k.includes(m))).slice(0,3).map(k=>`<span class="tag">${k}</span>`).join('')}</div></div>`).join('')
},150));

function hl(t,ts){let r=t;ts.forEach(x=>{r=r.replace(new RegExp(`(${esc(x)})`,'gi'),'<mark style="background:var(--mark-bg);color:var(--mark-color);border-radius:4px;padding:0 2px">$1</mark>')});return r}
function cl(c){return{Kardiologisch:2,Neurologisch:2,Respiratorisch:2,Trauma:3,Abdominell:3,Chirurgisch:3,Pädiatrisch:3,Psychiatrisch:3,Toxikologisch:2,Internistisch:3,Gynäkologisch:3,Urologisch:3,Allgemein:4,'HNO / Sinnesorgane':4,Dermatologisch:4,Orthopädisch:4,Spezial:2}[c]||3}

function initBM(){
  document.getElementById('bmC').innerHTML=`<div class="bm-fig">${svgF()}<div class="bm-fig-lbl">Vorderseite</div></div><div class="bm-fig">${svgB()}<div class="bm-fig-lbl">Rückseite</div></div>`;
  document.getElementById('bmP').innerHTML=BR.filter(r=>r.k==='skin'||r.k==='psych').map(r=>`<button class="bm-pill" data-r="${r.k}"><i class="fa-solid ${r.icon}"></i> ${r.n}</button>`).join('');
  document.getElementById('bmR').innerHTML='<div class="bm-empty"><i class="fa-solid fa-hand-pointer" style="font-size:2rem;margin-bottom:8px;display:block"></i> Region wählen</div>';
  document.querySelectorAll('.bz').forEach(z=>z.addEventListener('click',()=>bmS(z.dataset.r)));
  document.querySelectorAll('.bm-pill').forEach(p=>p.addEventListener('click',()=>bmS(p.dataset.r)));
}
function bmS(key){
  document.querySelectorAll('.bz').forEach(x=>x.classList.toggle('on',x.dataset.r===key));
  document.querySelectorAll('.bm-pill').forEach(p=>p.classList.toggle('on',p.dataset.r===key));
  const rr=BR.find(x=>x.k===key);if(!rr)return;
  const ds=[...new Set(rr.ids)].map(id=>D.find(x=>x.id===id)).filter(Boolean);
  document.getElementById('bmR').innerHTML=`<h3 style="display:flex;align-items:center;gap:8px"><i class="fa-solid ${rr.icon}"></i> ${rr.n}</h3><div class="sub">${ds.length} verknüpfte Diagramme</div>${ds.map(d=>`<div class="bm-di" onclick="shD(${d.id})"><div><strong>${d.name}</strong><span>Nr. ${d.id}</span></div><i class="fa-solid fa-caret-right" style="color:var(--text3)"></i></div>`).join('')}`;
}

function svgF(){return`<svg viewBox="0 0 240 540" xmlns="http://www.w3.org/2000/svg" aria-label="Körper Vorderseite">
<defs><linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--bz-grad2)"/><stop offset="100%" stop-color="var(--bz-grad1)"/></linearGradient></defs>
<ellipse class="bz" data-r="head" cx="120" cy="48" rx="28" ry="35"/>
<path class="bz" data-r="chest" d="M91 94 C100 84 140 84 149 94 C162 111 164 150 157 188 C146 200 94 200 83 188 C76 150 78 111 91 94 Z"/>
<path class="bz" data-r="abdomen" d="M86 192 C98 201 142 201 154 192 L151 258 C146 276 94 276 89 258 Z"/>
<path class="bz" data-r="pelvis" d="M89 263 C103 274 137 274 151 263 L160 304 C151 324 137 337 120 343 C103 337 89 324 80 304 Z"/>
<path class="bz" data-r="arm_r" d="M80 103 C67 102 57 112 53 129 L30 245 C27 261 36 271 47 269 C57 267 61 257 63 245 L88 124 C91 113 88 106 80 103 Z"/>
<path class="bz" data-r="arm_l" d="M160 103 C173 102 183 112 187 129 L210 245 C213 261 204 271 193 269 C183 267 179 257 177 245 L152 124 C149 113 152 106 160 103 Z"/>
<path class="bz" data-r="leg_r" d="M92 326 C102 333 111 337 118 340 L108 499 C107 516 97 526 85 523 C74 520 70 509 73 494 L79 347 C80 337 84 330 92 326 Z"/>
<path class="bz" data-r="leg_l" d="M148 326 C138 333 129 337 122 340 L132 499 C133 516 143 526 155 523 C166 520 170 509 167 494 L161 347 C160 337 156 330 148 326 Z"/>
<path class="body-detail" d="M105 83 Q120 91 135 83 M120 88 V340 M92 151 Q120 165 148 151 M94 219 Q120 229 146 219"/>
<text class="bl" x="120" y="52" text-anchor="middle">Kopf</text><text class="bl" x="120" y="145" text-anchor="middle">Thorax</text>
<text class="bl" x="120" y="235" text-anchor="middle">Abdomen</text><text class="bl" x="120" y="305" text-anchor="middle">Becken</text>
</svg>`}
function svgB(){return`<svg viewBox="0 0 240 540" xmlns="http://www.w3.org/2000/svg" aria-label="Körper Rückseite">
<defs><linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--bz-grad2)"/><stop offset="100%" stop-color="var(--bz-grad1)"/></linearGradient></defs>
<ellipse class="bz" data-r="head" cx="120" cy="48" rx="28" ry="35"/>
<path class="bz" data-r="neck_back" d="M101 83 Q120 92 139 83 L145 111 Q120 121 95 111 Z"/>
<path class="bz" data-r="back_upper" d="M91 111 C102 103 138 103 149 111 L158 190 C146 201 94 201 82 190 Z"/>
<path class="bz" data-r="back_lower" d="M85 194 C98 202 142 202 155 194 L151 260 C144 277 96 277 89 260 Z"/>
<path class="bz" data-r="pelvis" d="M89 265 C103 276 137 276 151 265 L160 304 C151 324 137 337 120 343 C103 337 89 324 80 304 Z"/>
<path class="bz" data-r="arm_r" d="M80 111 C67 106 57 116 53 132 L30 245 C27 261 36 271 47 269 C57 267 61 257 63 245 L88 132 C91 120 88 114 80 111 Z"/>
<path class="bz" data-r="arm_l" d="M160 111 C173 106 183 116 187 132 L210 245 C213 261 204 271 193 269 C183 267 179 257 177 245 L152 132 C149 120 152 114 160 111 Z"/>
<path class="bz" data-r="leg_r" d="M92 326 C102 333 111 337 118 340 L108 499 C107 516 97 526 85 523 C74 520 70 509 73 494 L79 347 C80 337 84 330 92 326 Z"/>
<path class="bz" data-r="leg_l" d="M148 326 C138 333 129 337 122 340 L132 499 C133 516 143 526 155 523 C166 520 170 509 167 494 L161 347 C160 337 156 330 148 326 Z"/>
<path class="body-detail" d="M120 112 V340 M98 145 Q120 155 142 145 M96 220 Q120 230 144 220"/>
<text class="bl" x="120" y="52" text-anchor="middle">Kopf</text><text class="bl" x="120" y="102" text-anchor="middle">HWS</text>
<text class="bl" x="120" y="154" text-anchor="middle">Oberer Rücken</text><text class="bl" x="120" y="235" text-anchor="middle">LWS</text>
</svg>`}

const dF_=document.getElementById('dF');
function rDiag(){document.getElementById('cF').innerHTML=`<button class="fb ${aCat===''?'a':''}" onclick="fC('')">Alle</button>${CATS.map(c=>`<button class="fb ${aCat===c?'a':''}" onclick="fC('${c}')">${c}</button>`).join('')}`;fR()}
function fC(c){aCat=c;rDiag()}
dF_.addEventListener('input',debounce(fR,150));
function fR(){
  const q=dF_.value.trim().toLowerCase();
  let f=D.slice();
  if(aCat)f=f.filter(d=>d.c===aCat);
  if(q.length>=2)f=f.filter(d=>d.name.toLowerCase().includes(q)||(d.i&&Object.values(d.i).flat().join(' ').toLowerCase().includes(q))||d.kw.some(k=>k.includes(q)));
  const core=f.filter(d=>d.id<=53);
  const manv=f.filter(d=>d.id>=54);
  document.getElementById('dC').innerHTML=`<b>${core.length}</b> MTS/Sonderdiagramme${manv.length?` · <b>${manv.length}</b> MANV`:''}`;
  document.getElementById('dL').innerHTML=
    core.map(d=>`<div class="card" onclick="shD(${d.id})"><div class="ch"><span class="ct">${d.id}. ${d.name}</span><span class="tb tb-${cl(d.c)}"><span class="td td-${cl(d.c)}"></span>${d.id===53?'MTS Sonderdiagramm':d.c}</span></div><div class="cs">${d.id===53?'Nur für Ausnahmefälle · ':''}Diagramm Nr. ${d.id}</div><div class="tags">${d.kw.slice(0,5).map(k=>`<span class="tag">${k}</span>`).join('')}${d.kw.length>5?`<span class="tag" style="opacity:.4">+${d.kw.length-5}</span>`:''}</div></div>`).join('') +
    (manv.length?`<div style="margin:24px 0 10px;padding:12px 14px;border-radius:var(--radius-sm);background:var(--yellow-bg);border:1px solid var(--yellow-border);color:var(--text2);font-size:.82rem"><b style="color:var(--text)"><i class="fa-solid fa-people-group"></i> MANV / Sichtung · Sonderbereich</b><br>Diese Altmodule sind nicht Teil des regulären 5-stufigen MTS-Workflows und befinden sich in fachlicher Validierung.</div>`:'') +
    manv.map(d=>`<div class="card" style="opacity:.78;border-style:dashed" onclick="shD(${d.id})"><div class="ch"><span class="ct">${d.id}. ${d.name}</span><span class="tag" style="background:var(--yellow-bg);border-color:var(--yellow-border)">MANV · Validierung</span></div><div class="cs">Sondermodul · nicht als reguläres MTS verwenden</div></div>`).join('');
}

const VALIDATION_KEY='mts_validation_v1';
let validationState={};
let validationOpenId=null;

function getValidationDefaults(id){
  const meta=MTS_DIAGRAM_META[id]||{};
  let status='unreviewed';
  if(meta.status==='not-mts-core') status='blocked';
  return {
    status,
    source:'',
    reviewer:'',
    reviewedOn:'',
    notes:'',
    localApproved:false,
    updatedAt:''
  };
}

function loadValidationState(){
  try{
    const raw=JSON.parse(localStorage.getItem(VALIDATION_KEY)||'{}');
    validationState=raw&&typeof raw==='object'?raw:{};
  }catch{
    validationState={};
  }
}
function getValidationRecord(id){
  return {...getValidationDefaults(id),...(validationState[id]||{})};
}
function validationStatusLabel(status){
  return {
    'unreviewed':'Ungeprüft',
    'in-review':'In Prüfung',
    'reviewed':'Geprüft',
    'local-approved':'Lokal freigegeben',
    'blocked':'Gesperrt'
  }[status]||'Ungeprüft';
}
function saveValidationRecord(id){
  const rec=getValidationRecord(id);
  const statusEl=document.getElementById('val-status-'+id);
  const sourceEl=document.getElementById('val-source-'+id);
  const reviewerEl=document.getElementById('val-reviewer-'+id);
  const dateEl=document.getElementById('val-date-'+id);
  const notesEl=document.getElementById('val-notes-'+id);
  if(!statusEl)return;
  const next={
    ...rec,
    status:statusEl.value,
    source:(sourceEl?.value||'').trim(),
    reviewer:(reviewerEl?.value||'').trim(),
    reviewedOn:dateEl?.value||'',
    notes:(notesEl?.value||'').trim(),
    localApproved:statusEl.value==='local-approved',
    updatedAt:new Date().toISOString()
  };
  validationState[id]=next;
  localStorage.setItem(VALIDATION_KEY,JSON.stringify(validationState));
  validationOpenId=null;
  renderValidationCenter();
}
function resetValidationRecord(id){
  delete validationState[id];
  localStorage.setItem(VALIDATION_KEY,JSON.stringify(validationState));
  validationOpenId=null;
  renderValidationCenter();
}
function toggleValidationDrawer(id){
  validationOpenId=validationOpenId===id?null:id;
  renderValidationCenter();
}
function initValidationCenter(){
  loadValidationState();
  const q=document.getElementById('validationSearch');
  const f=document.getElementById('validationFilter');
  if(q&&!q.dataset.bound){
    q.dataset.bound='1';
    q.addEventListener('input',debounce(renderValidationCenter,100));
  }
  if(f&&!f.dataset.bound){
    f.dataset.bound='1';
    f.addEventListener('change',renderValidationCenter);
  }
  renderValidationCenter();
}
function renderValidationCenter(){
  const list=document.getElementById('validationList');
  const summary=document.getElementById('validationSummary');
  if(!list||!summary)return;
  const q=(document.getElementById('validationSearch')?.value||'').trim().toLowerCase();
  const filter=document.getElementById('validationFilter')?.value||'';

  const records=D.map(d=>({d,rec:getValidationRecord(d.id)}));
  const counts={unreviewed:0,'in-review':0,reviewed:0,'local-approved':0,blocked:0};
  records.forEach(x=>{counts[x.rec.status]=(counts[x.rec.status]||0)+1});
  summary.innerHTML=
    '<div class="validation-kpi"><b>'+D.length+'</b><span>Gesamt</span></div>'+
    '<div class="validation-kpi"><b>'+counts['in-review']+'</b><span>In Prüfung</span></div>'+
    '<div class="validation-kpi"><b>'+counts.reviewed+'</b><span>Geprüft</span></div>'+
    '<div class="validation-kpi"><b>'+counts['local-approved']+'</b><span>Freigegeben</span></div>';

  const filtered=records.filter(({d,rec})=>{
    if(filter&&rec.status!==filter)return false;
    if(!q)return true;
    return [d.name,d.c,String(d.id),validationStatusLabel(rec.status),rec.source,rec.reviewer,rec.notes]
      .join(' ').toLowerCase().includes(q);
  });

  if(!filtered.length){
    list.innerHTML='<div class="empty"><i class="fa-solid fa-clipboard-check" style="font-size:2rem;margin-bottom:8px;display:block"></i>Keine Diagramme für diesen Filter.</div>';
    return;
  }

  list.innerHTML=filtered.map(({d,rec})=>{
    const meta=MTS_DIAGRAM_META[d.id]||{};
    const opened=validationOpenId===d.id;
    const metaText=meta.type==='manv-legacy'?'MANV Altbestand':meta.type==='mts-special'?'MTS Sonderdiagramm':'MTS Präsentation';
    return `
      <div class="validation-row">
        <div class="validation-title">
          <div class="validation-id">${d.id}</div>
          <div><strong>${d.name}</strong><small>${d.c} · ${metaText}</small></div>
        </div>
        <span class="validation-status-pill ${rec.status}"><i class="fa-solid fa-circle"></i>${validationStatusLabel(rec.status)}</span>
        <div class="validation-meta">${rec.reviewer?'<b>'+rec.reviewer+'</b><br>':''}${rec.reviewedOn||'Kein Reviewdatum'}${rec.source?'<br>'+rec.source:''}</div>
        <div class="validation-actions">
          <button onclick="shD(${d.id})" title="Diagramm öffnen"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
          <button onclick="toggleValidationDrawer(${d.id})" title="Validierung bearbeiten"><i class="fa-solid fa-pen"></i></button>
        </div>
      </div>
      ${opened?`
        <div class="validation-drawer">
          <div class="validation-form-grid">
            <div>
              <label>Status</label>
              <select id="val-status-${d.id}" class="validation-select">
                ${[
                  ['unreviewed','Ungeprüft'],
                  ['in-review','In Prüfung'],
                  ['reviewed','Geprüft'],
                  ['local-approved','Lokal freigegeben'],
                  ['blocked','Gesperrt']
                ].map(([v,l])=>`<option value="${v}" ${rec.status===v?'selected':''}>${l}</option>`).join('')}
              </select>
            </div>
            <div>
              <label>Reviewdatum</label>
              <input id="val-date-${d.id}" type="date" value="${rec.reviewedOn||''}">
            </div>
            <div>
              <label>Reviewer / Prüfer</label>
              <input id="val-reviewer-${d.id}" value="${escapeAttr(rec.reviewer)}" placeholder="Name / Rolle">
            </div>
            <div>
              <label>Quelle / Referenz</label>
              <input id="val-source-${d.id}" value="${escapeAttr(rec.source)}" placeholder="z. B. MTS 6. Auflage 2025, Kapitel ...">
            </div>
            <div class="full">
              <label>Validierungsnotiz</label>
              <textarea id="val-notes-${d.id}" placeholder="Was wurde geprüft? Was ist noch offen?">${escapeHtml(rec.notes)}</textarea>
            </div>
          </div>
          <div class="validation-savebar">
            <button class="rbtn" onclick="resetValidationRecord(${d.id})"><i class="fa-solid fa-rotate-left"></i> Zurücksetzen</button>
            <button class="rbtn primary" onclick="saveValidationRecord(${d.id})"><i class="fa-solid fa-floppy-disk"></i> Validierung speichern</button>
          </div>
        </div>`:''}
    `;
  }).join('');
}
function escapeHtml(v=''){
  return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function escapeAttr(v=''){return escapeHtml(v)}

function exportValidationState(){
  loadValidationState();
  const payload={
    schema:'triageassist-validation-v1',
    exportedAt:new Date().toISOString(),
    appVersion:'2.0.0-e1',
    records:validationState
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='triageassist-validation-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  URL.revokeObjectURL(url);
}
function importValidationState(event){
  const file=event.target.files?.[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(String(reader.result||'{}'));
      if(parsed.schema!=='triageassist-validation-v1'||!parsed.records||typeof parsed.records!=='object'){
        alert('Ungültige Validierungsdatei.');
        return;
      }
      const cleaned={};
      for(const [id,rec] of Object.entries(parsed.records)){
        const num=Number(id);
        if(!D.some(d=>d.id===num)||!rec||typeof rec!=='object')continue;
        const allowed=['unreviewed','in-review','reviewed','local-approved','blocked'];
        cleaned[num]={
          ...getValidationDefaults(num),
          status:allowed.includes(rec.status)?rec.status:'unreviewed',
          source:String(rec.source||'').slice(0,500),
          reviewer:String(rec.reviewer||'').slice(0,200),
          reviewedOn:/^\d{4}-\d{2}-\d{2}$/.test(rec.reviewedOn||'')?rec.reviewedOn:'',
          notes:String(rec.notes||'').slice(0,4000),
          localApproved:rec.status==='local-approved',
          updatedAt:String(rec.updatedAt||'')
        };
      }
      validationState=cleaned;
      localStorage.setItem(VALIDATION_KEY,JSON.stringify(validationState));
      validationOpenId=null;
      renderValidationCenter();
    }catch{
      alert('Validierungsdatei konnte nicht gelesen werden.');
    }finally{
      event.target.value='';
    }
  };
  reader.readAsText(file);
}
function resetAllValidation(){
  if(!confirm('Alle lokal gespeicherten Validierungsstatus und Notizen zurücksetzen?'))return;
  validationState={};
  localStorage.removeItem(VALIDATION_KEY);
  validationOpenId=null;
  renderValidationCenter();
}

function rTox(){
  document.getElementById('toxL').innerHTML =
    '<div style="grid-column:1/-1;padding:14px 16px;border:1px solid var(--yellow-border);background:var(--yellow-bg);border-radius:var(--radius-sm);font-size:.82rem;color:var(--text2);line-height:1.5"><b style="color:var(--text)"><i class="fa-solid fa-flask-vial"></i> Klinisches Zusatzmodul, kein MTS.</b><br>Die vorhandenen Therapieangaben sind bis zur Freigabe einer institutionellen Tox- oder Giftnotruf-SOP nur als Altbestand zur Validierung zu verstehen und beeinflussen die MTS-Stufe nicht.</div>' +
    TOX.map(t => `<div class="cc" style="border-left: 4px solid var(--orange);"><h4>${t.n}</h4><ul><li><i class="fa-solid fa-virus" style="color:var(--orange)"></i><b>Leitsymptome:</b> ${t.s}</li><li><i class="fa-solid fa-circle-info" style="color:var(--text3)"></i><b>Altbestand / zu validieren:</b> ${t.a}</li></ul></div>`).join('');
}

function getActions(lvl, diag) {
  let a = [];
  if (lvl === 1) a.push("Schockraum & Rea Team alarmieren", "Monitoring & O₂ max. anlegen", "Atemwegsmanagement vorbereiten", "PVK/IO Zugang legen");
  if (lvl === 2) {
    a.push("Arztkontakt < 10 Min. zwingend");
    if (diag.c === 'Kardiologisch') a.push("12 Kanal EKG (< 10 Min)", "PVK legen & Labor (Trop)", "Monitoring anlegen");
    else if (diag.c === 'Neurologisch') a.push("FAST Test Doku", "BZ sofort messen", "PVK legen & Labor", "Lyse/Thrombektomie Zeitfenster prüfen");
    else if (diag.c === 'Trauma') a.push("Trauma Check", "Immobilisation HWS/Ganzkörper", "Blutungskontrolle");
    else a.push("Monitoring anlegen", "PVK vorbereiten");
  }
  if (lvl === 3) {
    a.push("Arztkontakt < 30 Min.");
    a.push("Bei Fieber: Antipyrese nach Hausstandard");
    a.push("Bei Schmerz: Analgesie nach Hausstandard");
    if (diag.c === 'Chirurgisch' || diag.c === 'Trauma') a.push("Röntgenanforderung prüfen");
  }
  if (lvl === 4 || lvl === 5) {
    a.push("Normale Re Evaluation im Verlauf");
    if (diag.c === 'Trauma') a.push("Ggf. kühlen/hochlagern");
  }
  return a;
}

function shD(id){
  curDiag=D.find(x=>x.id===id);
  selR=[]; selI=[];
  manualPriority={level:null,source:'',label:''};
  restoredAssessment=null;
  curVit = { gcs: '', spo2: '', temp: '', nrs: '' };
  if(!curDiag)return;
  rOvl();
  const overlay=document.getElementById('detO');
  overlay.classList.add('open');
  requestAnimationFrame(()=>{
    overlay.scrollTop=0;
    const card=overlay.querySelector('.oc');
    if(card)card.scrollTop=0;
    window.scrollTo({top:0,behavior:'smooth'});
  });
}

function tgR(idx){
  if(selR.includes(idx)) selR=selR.filter(x=>x!==idx);
  else selR.push(idx);
  rOvl();
}

function tgI(lvl, idx, isGen){
  const key = `${lvl}-${idx}-${isGen?1:0}`;
  if(selI.includes(key)) selI=selI.filter(x=>x!==key);
  else selI.push(key);
  rOvl();
}

function getVitalAdvisories(){
  const out=[];
  const add=(field,severity,title,text,suggestedLevel=null)=>out.push({field,severity,title,text,suggestedLevel});
  if(curVit.gcs!==''){
    const v=Number(curVit.gcs);
    if(v>=3&&v<15) add('gcs',v<=12?'critical':'alert','GCS auffällig',`GCS ${v}: Bewusstseinslage ist nicht normal. Höhere Priorisierung und passenden MTS-Diskriminator prüfen.`,2);
  }
  if(curVit.spo2!==''){
    const v=Number(curVit.spo2);
    if(v>=0&&v<92) add('spo2','critical','SpO₂ deutlich erniedrigt',`SpO₂ ${v} % unter Raumluft liegt unter dem in der aktuellen MTS-Referenz genannten Grenzwert. Höhere Priorisierung prüfen.`,2);
    else if(v>=92&&v<95) add('spo2','alert','SpO₂ erniedrigt',`SpO₂ ${v} % ist auffällig. Klinischen Kontext und passenden MTS-Diskriminator prüfen.`,3);
  }
  if(curVit.temp!==''){
    const v=Number(String(curVit.temp).replace(',','.'));
    if(Number.isFinite(v)){
      if(v>41||v<35) add('temp','critical','Temperatur stark auffällig',`${v.toFixed(1)} °C: deutliche Temperaturabweichung. Höhere Priorisierung und passenden MTS-/Sepsis-Kontext prüfen.`,2);
      else if(v>=39||v<36) add('temp','alert','Temperatur auffällig',`${v.toFixed(1)} °C: außerhalb des üblichen Normbereichs. Höhere Priorisierung im klinischen Kontext prüfen.`,3);
    }
  }
  if(curVit.nrs!==''){
    const v=Number(curVit.nrs);
    if(v>=7&&v<=10) add('nrs','critical','Starker Schmerz',`NRS ${v}/10: entspricht nach eurer MTS-NRS-Systematik Stufe 2 (Orange). Passenden Schmerz-Diskriminator prüfen.`,2);
    else if(v>=4&&v<=6) add('nrs','alert','Mäßiger Schmerz',`NRS ${v}/10: entspricht nach eurer MTS-NRS-Systematik Stufe 3 (Gelb). Passenden Schmerz-Diskriminator prüfen.`,3);
    else if(v>=1&&v<=3) add('nrs','info','Leichter Schmerz',`NRS ${v}/10: entspricht nach eurer MTS-NRS-Systematik Stufe 4 (Grün). Passenden Schmerz-Diskriminator prüfen.`,4);
  }
  return out;
}
function priorityColorName(level){return ({1:'Rot',2:'Orange',3:'Gelb',4:'Grün',5:'Blau'})[level]||''}
function setManualPriority(level,source,label){
  manualPriority={level:Number(level),source:String(source||'manual'),label:String(label||'Manuelle Priorisierung')};
  rOvl();
}
function clearManualPriority(){manualPriority={level:null,source:'',label:''};rOvl()}
function goToLevelCard(level,source,label){
  setManualPriority(level,source,label);
  setTimeout(()=>document.getElementById('level-card-'+level)?.scrollIntoView({behavior:'smooth',block:'center'}),40);
}
function priorityButtons(source,label,suggested){
  const src=encodeURIComponent(String(source||'manual'));
  const lab=encodeURIComponent(String(label||'Manuelle Priorisierung'));
  return '<div class="priority-pick"><span>Farbe direkt wählen:</span><div class="priority-dots">'+
    [1,2,3,4,5].map(l=>'<button type="button" class="priority-dot p-'+l+(suggested===l?' suggested':'')+'" onclick="event.stopPropagation();setManualPriority('+l+',decodeURIComponent(\''+src+'\'),decodeURIComponent(\''+lab+'\'))" title="'+priorityColorName(l)+' wählen"><span class="td td-'+l+'"></span>'+priorityColorName(l)+'</button>').join('')+
    '</div></div>';
}
function vitalFieldClass(field){
  const a=getVitalAdvisories().filter(x=>x.field===field);
  if(a[0]?.suggestedLevel) return ' vital-level-'+a[0].suggestedLevel;

  if(field==='gcs' && curVit.gcs!==''){
    const v=Number(curVit.gcs);
    if(v===15)return ' vital-level-4';
  }
  if(field==='spo2' && curVit.spo2!==''){
    const v=Number(curVit.spo2);
    if(v>=95&&v<=100)return ' vital-level-4';
  }
  if(field==='temp' && curVit.temp!==''){
    const v=Number(String(curVit.temp).replace(',','.'));
    if(Number.isFinite(v)&&v>=36&&v<39)return ' vital-level-4';
  }
  return '';
}
function renderVitalAdvisories(){
  const a=getVitalAdvisories();
  if(!a.length)return '';
  return `<div class="vital-flag ${a.some(x=>x.severity==='critical')?'critical':''}">
    <i class="fa-solid fa-triangle-exclamation"></i>
    <div style="flex:1"><b>Priorisierung erneut prüfen</b>
      ${a.map(x=>`<div class="vital-advisory-item"><div>${escapeHtml(x.text)}</div>${priorityButtons('vital:'+x.field,x.title,x.suggestedLevel)}</div>`).join('')}
    </div>
  </div>`;
}
function updV(key, val) { curVit[key] = val; rOvl(); }
function updPed(val) { curPed = val; rOvl(); }

function buildDecisionTrace(d,lvl){
  const rows=[];
  rows.push({icon:'fa-sitemap',label:`Präsentationsdiagramm: <b>${d.name}</b>`,level:''});

  selI.forEach(k=>{
    const [ls,idxs,gen]=k.split('-');
    const l=parseInt(ls),idx=parseInt(idxs),isGen=gen==='1';
    const source=isGen?(GI[l]||[]):((d.i&&d.i[l])||[]);
    const text=source[idx];
    if(text) rows.push({icon:'fa-check',label:`${isGen?'Genereller':'Spezifischer'} Diskriminator: <b>${text}</b>`,level:`Stufe ${l}`});
  });

  const vit=[];
  if(curVit.gcs!=='') vit.push(`GCS ${parseInt(curVit.gcs)}`);
  if(curVit.spo2!=='') vit.push(`SpO₂ ${parseInt(curVit.spo2)}%`);
  if(curVit.temp!=='') vit.push(`Temperatur ${parseFloat(String(curVit.temp).replace(',','.')).toFixed(1)} °C`);
  if(curVit.nrs!=='') vit.push(`NRS ${parseInt(curVit.nrs)}`);
  vit.forEach(v=>rows.push({icon:'fa-wave-square',label:`Dokumentierter Vital-/Schmerzwert: <b>${v}</b> · derzeit ohne automatische MTS-Wertung`,level:''}));

  if(manualPriority.level!==null) rows.push({icon:'fa-hand-pointer',label:`Manuell gewählt: <b>${escapeHtml(manualPriority.label)}</b>`,level:`Stufe ${manualPriority.level}`});
  const active=rows.filter(row=>row.level);
  return `
    <div class="decision-trace">
      <div class="trace-head">
        <h4><i class="fa-solid fa-route"></i> Warum diese Einstufung?</h4>
        <span class="trace-badge">Entscheidungsweg</span>
      </div>
      <div class="trace-list">
        ${rows.map((row,i)=>`
          <div class="trace-item">
            <div class="trace-icon"><i class="fa-solid ${row.icon}"></i></div>
            <div class="trace-label">${row.label}</div>
            <div class="trace-level" style="color:${row.level?['','var(--red)','var(--orange)','var(--yellow)','var(--green)','var(--blue)'][parseInt(row.level.match(/\d/)?.[0]||0)]:'var(--text3)'}">${row.level}</div>
          </div>`).join('')}
        ${active.length===0?'<div class="trace-empty"><i class="fa-solid fa-circle-info"></i> Noch kein aktiver MTS-Diskriminator gewählt. Deshalb wird bewusst noch keine Dringlichkeitsstufe vergeben.</div>':''}
      </div>
    </div>`;
}

function rOvl(){
  const d=curDiag;
  let lvl=null;

  // D1: Eine MTS-Stufe entsteht nur durch einen explizit ausgewählten Diskriminator.
  // Unvalidierte Basisstufen und globale Vital-/NRS-Heuristiken sind deaktiviert.
  selI.forEach(k=>{
    const l=parseInt(k.split('-')[0]);
    if(lvl===null || l<lvl) lvl=l;
  });
  const mtsLvl=lvl;
  if(manualPriority.level!==null) lvl=lvl===null?manualPriority.level:Math.min(lvl,manualPriority.level);

  const lObj = lvl!==null ? LV.find(x=>x.l===lvl) : null;
  const rl = D.filter(x=>x.c===d.c&&x.id!==d.id);

  let html = `
    <button class="ox" onclick="clO()"><i class="fa-solid fa-xmark"></i></button>
    ${d.id>=54?'<div style="padding:12px 14px;margin-bottom:14px;border-radius:var(--radius-sm);background:var(--yellow-bg);border:1px solid var(--yellow-border);font-size:.8rem;color:var(--text2)"><b style="color:var(--text)"><i class="fa-solid fa-triangle-exclamation"></i> MANV-Sondermodul in Validierung.</b> Nicht als reguläre MTS-Einstufung verwenden.</div>':''}
    <span class="tb tb-${cl(d.c)}"><span class="td td-${cl(d.c)}"></span>${d.id===53?'MTS Sonderdiagramm':d.c}</span>
    <h2 style="font-size:1.3rem;font-weight:800;margin-top:12px;color:var(--text)">${d.id}. ${d.name}</h2>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
      <span class="tag" style="background:var(--yellow-bg);border-color:var(--yellow-border);color:var(--text2)"><i class="fa-solid fa-shield-halved"></i> ${MTS_DIAGRAM_META[d.id]?.status==='not-mts-core'?'Nicht MTS Core':'Vollreferenz-Prüfung offen'}</span>
      ${(()=>{
        const vr=typeof getValidationRecord==='function'?getValidationRecord(d.id):null;
        if(!vr)return '';
        return `<span class="validation-status-pill ${vr.status}"><i class="fa-solid fa-circle"></i>${validationStatusLabel(vr.status)}</span>`+
          (vr.reviewedOn?`<span class="tag"><i class="fa-regular fa-calendar-check"></i> ${vr.reviewedOn}</span>`:'');
      })()}
    </div>
    ${restoredAssessment?`<div class="saved-snapshot">
      <div class="saved-snapshot-head"><i class="fa-solid fa-clock-rotate-left"></i><div><b>Gespeicherte Einschätzung</b><span>${new Date(restoredAssessment.ts).toLocaleString('de-DE')}</span></div></div>
      <div class="saved-snapshot-grid">
        <span><b>Gespeicherte Stufe</b>${restoredAssessment.l?priorityColorName(restoredAssessment.l):'—'}</span>
        <span><b>Quelle</b>${restoredAssessment.source==='manual-or-local'?'manuell/lokal':'MTS-Diskriminator'}</span>
        <span><b>Vitalwerte</b>${[
          restoredAssessment.vitals?.gcs?`GCS ${restoredAssessment.vitals.gcs}`:'',
          restoredAssessment.vitals?.spo2?`SpO₂ ${restoredAssessment.vitals.spo2}%`:'',
          restoredAssessment.vitals?.temp?`${restoredAssessment.vitals.temp} °C`:'',
          restoredAssessment.vitals?.nrs?`NRS ${restoredAssessment.vitals.nrs}`:''
        ].filter(Boolean).join(' · ')||'nicht gespeichert'}</span>
      </div>
      ${(!restoredAssessment.selectedKeys?.length&&!restoredAssessment.indicators?.length)?'<div class="saved-snapshot-note"><i class="fa-solid fa-circle-info"></i> Dieser ältere Verlaufseintrag enthält noch keine gespeicherten Diskriminator-Details. Ab RC5 werden sie vollständig mitgespeichert.</div>':''}
    </div>`:''}
    
    ${lvl!==null?`
      <div class="triage-banner t-b-${lvl}">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="width:34px;height:34px;border-radius:11px;background:rgba(255,255,255,.18);display:grid;place-items:center"><i class="fa-solid fa-triangle-exclamation"></i></span>
          <div><div style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;opacity:.82">${restoredAssessment?'Gespeicherte Einstufung':manualPriority.level!==null && (mtsLvl===null || manualPriority.level<=mtsLvl)?'Aktuelle Priorisierung · manuell/lokal':'Aktuelle MTS Einstufung'}</div><div>Stufe ${lvl} · ${lObj.n}</div></div>
        </div>
        <div class="t-time">Max: ${lObj.t}</div>
      </div>`
      :`<div class="triage-banner t-b-neutral">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="width:34px;height:34px;border-radius:11px;background:var(--bg3);display:grid;place-items:center"><i class="fa-solid fa-circle-question"></i></span>
          <div><div style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)">MTS Einstufung</div><div>Noch nicht eingestuft</div></div>
        </div>
        <div class="t-time">Diskriminator wählen</div>
      </div>`}
    ${manualPriority.level!==null?`<div class="manual-priority-chip"><i class="fa-solid fa-hand-pointer"></i><span>Manuell gewählt: <b>${priorityColorName(manualPriority.level)}</b> · ${escapeHtml(manualPriority.label)}</span><button type="button" onclick="clearManualPriority()" title="Manuelle Auswahl entfernen"><i class="fa-solid fa-xmark"></i></button></div>`:''}
    ${buildDecisionTrace(d,lvl)}`;

  if(d.c === 'Pädiatrisch'){
    html += `<div style="background:var(--bg3);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px;border:1px solid var(--card-border)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h4 style="font-size:0.85rem;font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px"><i class="fa-solid fa-baby"></i> Pädiatrische Orientierungswerte</h4>
        <select onchange="updPed(this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid var(--card-border);font-family:var(--font);font-size:0.8rem;background:var(--bg2);color:var(--text);outline:none">
          <option value="0" ${curPed==='0'?'selected':''}>< 1 Monat</option>
          <option value="1" ${curPed==='1'?'selected':''}>1 bis 11 Monate</option>
          <option value="2" ${curPed==='2'?'selected':''}>1 bis 4 Jahre</option>
          <option value="3" ${curPed==='3'?'selected':''}>5 bis 12 Jahre</option>
          <option value="4" ${curPed==='4'?'selected':''}>> 12 Jahre</option>
        </select>
      </div>
      <div style="font-family:var(--mono);font-size:0.85rem;font-weight:700;color:var(--accent);text-align:center;padding:8px;background:var(--bg2);border-radius:6px;box-shadow:var(--shadow-sm);margin-bottom:8px;">
        ${pedsV[curPed]}
      </div>
      <div style="font-size:0.8rem;font-weight:600;color:var(--text2);text-align:center;display:flex;align-items:center;justify-content:center;gap:6px;">
        <i class="fa-solid fa-weight-scale"></i> Geschätztes Gewicht: ${pedsW[curPed]}
      </div>
      <div style="font-size:.7rem;color:var(--text3);margin-top:8px;text-align:center"><i class="fa-solid fa-circle-info"></i> Altbestand zur Orientierung. Kein automatischer MTS-Trigger in D1.</div>
    </div>`;
  }

  html += `<h4 style="font-size:0.9rem;font-weight:700;margin-bottom:4px;color:var(--text)"><i class="fa-solid fa-heart-pulse"></i> Vital- und Schmerzwerte</h4>
    <div style="font-size:.76rem;color:var(--text3);margin-bottom:10px;font-weight:600"><i class="fa-solid fa-shield"></i> Dokumentation: In D1 verändern diese Werte die MTS-Stufe nicht automatisch.</div>
    <div class="vitals-grid">
      <div class="vital-input-box${vitalFieldClass('gcs')}" style="position:relative; display:flex; flex-direction:column;">
        <label style="display:flex; justify-content:space-between; align-items:center;">
          GCS (3 bis 15)
          <button onclick="openGCS()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:1.1rem;padding:0 4px;" title="GCS Rechner öffnen"><i class="fa-solid fa-calculator"></i></button>
        </label>
        <input type="number" min="3" max="15" value="${curVit.gcs}" onchange="updV('gcs', this.value)" style="margin-top:auto;">
        <div class="vital-mini-scale cols-2"><span class="scale-green">15 Grün</span><span class="scale-orange">3–14 Orange</span></div>
      </div>
      <div class="vital-input-box${vitalFieldClass('spo2')}">
        <label>SpO₂ (%)</label>
        <input type="number" min="0" max="100" value="${curVit.spo2}" onchange="updV('spo2', this.value)">
        <div class="vital-mini-scale"><span class="scale-green">≥95 % Grün</span><span class="scale-yellow">92–94 % Gelb</span><span class="scale-orange">&lt;92 % Orange</span></div>
      </div>
      <div class="vital-input-box${vitalFieldClass('temp')}">
        <label>Temp (°C)</label>
        <input type="number" step="0.1" value="${curVit.temp}" onchange="updV('temp', this.value)">
        <div class="vital-mini-scale temp-scale"><span class="scale-green">36–38,9 °C Grün</span><span class="scale-yellow">35–35,9 / 39–41 °C Gelb</span><span class="scale-orange">&lt;35 / &gt;41 °C Orange</span></div>
      </div>
      <div class="vital-input-box${vitalFieldClass('nrs')}">
        <label>NRS (0-10)</label>
        <input type="number" min="0" max="10" value="${curVit.nrs}" onchange="updV('nrs', this.value)">
        <div class="vital-mini-scale"><span class="scale-green">1–3 Grün</span><span class="scale-yellow">4–6 Gelb</span><span class="scale-orange">7–10 Orange</span></div>
      </div>
    </div>
    ${renderVitalAdvisories()}`;

  const localRules=(typeof LOCAL_RULES!=='undefined' && LOCAL_RULES[d.id]) ? LOCAL_RULES[d.id] : [];
  if(localRules.length > 0){
    html += `<div style="margin-bottom:20px;background:var(--yellow-bg);border:1px solid var(--yellow-border);border-radius:var(--radius-sm);padding:16px;">
      <h4 style="font-size:0.85rem;font-weight:800;color:var(--text);margin-bottom:6px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-lock"></i> Lokale Zusatzregeln · getrennte SOP-Ebene</h4>
      <div style="font-size:.82rem;color:var(--text2);line-height:1.5">Diese Regeln liegen technisch außerhalb des MTS-Kerns. Ein Klick übernimmt die angezeigte Farbe bewusst als manuelle/lokale Priorisierung; automatisch verändern sie die Einstufung nicht.</div>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
        ${localRules.map(r=>`<button type="button" class="local-rule-link" onclick="goToLevelCard(${r.v},'lokale Zusatzregel',decodeURIComponent('${encodeURIComponent(r.l)}'))">
  <span><i class="fa-solid fa-link"></i> <b>${r.l}</b><small>${r.t}</small></span>
  <span class="local-rule-action"><span class="td td-${r.v}"></span>${priorityColorName(r.v)} wählen <i class="fa-solid fa-arrow-right"></i></span>
</button>`).join('')}
      </div>
    </div>`;
  }

  const act = lvl!==null ? getActions(lvl, d) : [];
  if(act.length > 0) {
    html += `<div style="margin-bottom:20px;background:var(--bg3);border-radius:var(--radius-sm);padding:16px;border:1px solid var(--card-border)">
      <h4 style="font-size:0.9rem;font-weight:800;margin-bottom:4px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-check-double"></i> Klinische Zusatzhinweise</h4>
      <div style="font-size:.76rem;color:var(--text3);margin-bottom:12px;font-weight:600">Kein Bestandteil der MTS-Einstufung. Lokale Maßnahmen müssen gegen eure SOP freigegeben werden.</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${act.map(a => `<div class="rule-box" style="margin:0;padding:10px 12px" onclick="this.classList.toggle('active');this.querySelector('input').checked=!this.querySelector('input').checked">
          <input type="checkbox" style="margin-top:2px;transform:scale(1.1)">
          <span style="font-size:0.85rem;font-weight:600">${a}</span>
        </div>`).join('')}
      </div>
    </div>`;
  }

  html += `<h4 style="font-size:0.9rem;font-weight:700;margin-bottom:6px;color:var(--text)"><i class="fa-solid fa-list-check"></i> Manuelle Indikatoren</h4>
           <div style="font-size:0.8rem;color:var(--text3);margin-bottom:12px;font-weight:500">Wähle alle zutreffenden Symptome von oben nach unten.</div>`;
  
  [1,2,3,4,5].forEach(l => {
    const genInds=GI[l]||[];
    const specInds=(d.i&&d.i[l])?d.i[l]:[];
    if(genInds.length===0&&specInds.length===0)return;
    const rows=[];
    specInds.forEach((ind,idx)=>{
      const key=`${l}-${idx}-0`;
      const isSel=selI.includes(key);
      rows.push(`<div class="ind-row" onclick="tgI(${l},${idx},false)">
        <input type="checkbox" ${isSel?'checked':''}>
        <div class="ind-txt" style="font-weight:700">${ind}</div>
      </div>`);
    });
    genInds.forEach((ind,idx)=>{
      const key=`${l}-${idx}-1`;
      const isSel=selI.includes(key);
      rows.push(`<div class="ind-row" onclick="tgI(${l},${idx},true)">
        <input type="checkbox" ${isSel?'checked':''}>
        <div class="ind-txt">${ind} <span style="opacity:.6;font-size:.75rem;font-weight:500">(Generell)</span></div>
      </div>`);
    });
    const selectedAtLevel=selI.some(k=>parseInt(k.split('-')[0])===l);
    if(l<=2){
      html+=`<section class="priority-section priority-open">
        <div id="level-card-${l}" class="ind-head t-b-${l}"><i class="fa-solid fa-circle" style="font-size:.8em"></i> Stufe ${l}</div>
        ${rows.join('')}
      </section>`;
    }else{
      html+=`<details class="priority-section priority-collapsible" ${selectedAtLevel?'open':''}>
        <summary id="level-card-${l}" class="ind-head t-b-${l}">
          <span><i class="fa-solid fa-circle" style="font-size:.8em"></i> Stufe ${l}</span>
          <span class="priority-summary-meta">${rows.length} Kriterien <i class="fa-solid fa-chevron-down"></i></span>
        </summary>
        <div class="priority-body">${rows.join('')}</div>
      </details>`;
    }
  });

  if(rl.length){
    html += `<h4 style="font-size:0.85rem;font-weight:700;margin:24px 0 10px;color:var(--text)"><i class="fa-solid fa-folder-open"></i> Weitere Diagramme aus „${d.c}"</h4>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">${rl.map(r=>`<div class="card" style="margin:0;padding:12px 16px" onclick="shD(${r.id})"><div class="ch" style="margin:0"><span class="ct" style="font-size:0.9rem">${r.name}</span><span style="font-size:0.75rem;color:var(--text3);font-weight:600">Nr.${r.id}</span></div></div>`).join('')}</div>`;
  }

  html += `
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px">
      ${lvl!==null
        ? `<button class="rbtn primary" onclick="saveAssessmentAndClose(${d.id}, ${lvl})"><i class="fa-solid fa-floppy-disk"></i> Einschätzung speichern (${lObj.n})</button>
           <button class="rbtn" onclick="openISBAR(${lvl})" style="background:var(--accent-bg); color:var(--accent); border-color:var(--accent);"><i class="fa-solid fa-clipboard-list"></i> ISBAR Generieren</button>`
        : `<button class="rbtn" disabled style="opacity:.5;cursor:not-allowed"><i class="fa-solid fa-lock"></i> Erst Diskriminator wählen</button>`}
    </div>`;
    
  document.getElementById('oC').innerHTML=html;
}

function clO(){document.getElementById('detO').classList.remove('open')}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){clO();clGCS();clISBAR();}});

function openGCS(){
  gcsS = {e:4, v:5, m:6};
  qsfS = {af:false, rr:false};
  document.getElementById('gcsO').classList.add('open');
  rGCS();
}

function setG(t, v){ gcsS[t] = v; rGCS(); }
function tqS(t){ qsfS[t] = !qsfS[t]; rGCS(); }
function clGCS(){ document.getElementById('gcsO').classList.remove('open'); }
function applyGCS(tot){
  updV('gcs', tot);
  clGCS();
}

function rGCS(){
  const ev = [
    {l:'Spontan',v:4}, {l:'Ansprache',v:3}, {l:'Schmerz',v:2}, {l:'Keine',v:1}
  ];
  const vv = [
    {l:'Orientiert',v:5}, {l:'Verwirrt',v:4}, {l:'Inadäquat',v:3}, {l:'Laute',v:2}, {l:'Keine',v:1}
  ];
  const mv = [
    {l:'Befolgt',v:6}, {l:'Gezielt',v:5}, {l:'Ungezielt',v:4}, {l:'Beugung',v:3}, {l:'Streckung',v:2}, {l:'Keine',v:1}
  ];
  
  const tot = gcsS.e + gcsS.v + gcsS.m;
  const qS = (qsfS.af?1:0) + (qsfS.rr?1:0) + (tot < 15 ? 1 : 0);
  
  document.getElementById('gcsC').innerHTML = `
    <button class="ox" onclick="clGCS()"><i class="fa-solid fa-xmark"></i></button>
    <h2 style="font-size:1.3rem;font-weight:800;margin:16px 0 16px;color:var(--text)"><i class="fa-solid fa-calculator"></i> GCS und qSOFA Rechner</h2>
    
    <div class="gcs-grid">
      <div class="gcs-row">
        <div class="gcs-row-title"><span>Augenöffnen</span> <span>${gcsS.e}</span></div>
        <div class="gcs-btns">
          ${ev.map(o=>`<button class="gcs-btn ${gcsS.e===o.v?'on':''}" onclick="setG('e',${o.v})">${o.l}</button>`).join('')}
        </div>
      </div>
      <div class="gcs-row" style="margin-top:8px">
        <div class="gcs-row-title"><span>Verbale Reaktion</span> <span>${gcsS.v}</span></div>
        <div class="gcs-btns">
          ${vv.map(o=>`<button class="gcs-btn ${gcsS.v===o.v?'on':''}" onclick="setG('v',${o.v})">${o.l}</button>`).join('')}
        </div>
      </div>
      <div class="gcs-row" style="margin-top:8px">
        <div class="gcs-row-title"><span>Motorische Reaktion</span> <span>${gcsS.m}</span></div>
        <div class="gcs-btns">
          ${mv.map(o=>`<button class="gcs-btn ${gcsS.m===o.v?'on':''}" onclick="setG('m',${o.v})">${o.l}</button>`).join('')}
        </div>
      </div>
    </div>

    <div class="qsf-score" style="color:${tot<=8?'var(--red)':tot<15?'var(--orange)':'var(--green)'}">
      Gesamt GCS: ${tot}
    </div>
    
    <h3 style="font-size:1.1rem;font-weight:800;margin:24px 0 6px;color:var(--text);border-top:1px solid var(--card-border);padding-top:16px"><i class="fa-solid fa-virus"></i> qSOFA Score</h3>
    <div style="font-size:.78rem;color:var(--text3);margin-bottom:12px;font-weight:600"><i class="fa-solid fa-circle-info"></i> Klinisches Zusatztool, kein MTS-Diskriminator und keine Sepsisdiagnose.</div>
    <div class="qsf-box ${qsfS.af?'on':''}" onclick="tqS('af')">
      <span style="font-weight:700">Atemfrequenz &ge; 22 pro min</span>
      <i class="fa-solid ${qsfS.af?'fa-circle-check':'fa-circle'}" style="font-size:1.2rem"></i>
    </div>
    <div class="qsf-box ${qsfS.rr?'on':''}" onclick="tqS('rr')">
      <span style="font-weight:700">Systolischer Blutdruck &le; 100 mmHg</span>
      <i class="fa-solid ${qsfS.rr?'fa-circle-check':'fa-circle'}" style="font-size:1.2rem"></i>
    </div>
    <div class="qsf-box ${tot<15?'on':''}" style="cursor:default;opacity:0.8">
      <span style="font-weight:700">GCS unter 15</span>
      <i class="fa-solid ${tot<15?'fa-circle-check':'fa-circle'}" style="font-size:1.2rem"></i>
    </div>
    
    <div class="qsf-score" style="color:${qS>=2?'var(--red)':'var(--text2)'}">
      qSOFA Punkte: ${qS} von 3
    </div>
    ${qS>=2?'<div style="background:var(--red-bg);color:var(--red);padding:12px;border-radius:6px;font-size:0.85rem;font-weight:700;text-align:center;margin-bottom:16px;"><i class="fa-solid fa-triangle-exclamation"></i> qSOFA erhöht. Klinische Sepsisabklärung nach lokalem Standard erwägen. Dies ist kein MTS-Ergebnis.</div>':''}

    <button class="rbtn primary" style="width:100%;justify-content:center" onclick="applyGCS(${tot})">Werte übernehmen</button>
  `;
}

let curMTSLvl = 5;
function openISBAR(lvl) {
  curMTSLvl = lvl;
  document.getElementById('isbarO').classList.add('open');
  rISBAR();
}

function clISBAR() {
  document.getElementById('isbarO').classList.remove('open');
}

function rISBAR() {
  genISBARText();
}

function genISBARText() {
  const sInput = document.getElementById('isbarS') ? document.getElementById('isbarS').value : '';
  const bInput = document.getElementById('isbarB') ? document.getElementById('isbarB').value : '';
  const d = curDiag;
  const v = curVit;
  
  let txt = `I: Patient (Name/Alter)\n`;
  txt += `S: ${d?d.name:'Ohne Zuordnung'}, MTS Stufe ${curMTSLvl} \n`;
  if(sInput) txt += `   OPQRST: ${sInput}\n`;
  txt += `B: SAMPLER: ${bInput ? bInput : 'Keine Besonderheiten erfasst'}\n`;
  txt += `A: GCS ${v.gcs||'/'}, SpO2 ${v.spo2||'/'}%, Temp ${v.temp||'/'}°C, NRS ${v.nrs||'/'}\n`;
  txt += `R: Bitte um zügige ärztliche Sichtung gemäß MTS Vorgabe.`;

  document.getElementById('isbarC').innerHTML = `
    <button class="ox" onclick="clISBAR()"><i class="fa-solid fa-xmark"></i></button>
    <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:16px;color:var(--text)"><i class="fa-solid fa-clipboard-list"></i> ISBAR Übergabe Generator</h2>
    
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
       <label style="font-weight:700; font-size:0.85rem; color:var(--text);">S (Symptoms) / OPQRST Quick Note</label>
       <input type="text" id="isbarS" onkeyup="updateISBAROut()" value="${sInput}" placeholder="Beginn, Provokation, Qualität, Ausstrahlung..." style="padding:12px; border-radius:var(--radius-sm); border:1px solid var(--card-border); background:var(--bg2); color:var(--text); width:100%; outline:none; font-family:var(--font);">
       
       <label style="font-weight:700; font-size:0.85rem; margin-top:8px; color:var(--text);">B (Background) / SAMPLER</label>
       <input type="text" id="isbarB" onkeyup="updateISBAROut()" value="${bInput}" placeholder="Allergien, Medis, Vorerkrankungen, Letzte Mahlzeit..." style="padding:12px; border-radius:var(--radius-sm); border:1px solid var(--card-border); background:var(--bg2); color:var(--text); width:100%; outline:none; font-family:var(--font);">
    </div>
    
    <textarea id="isbarOut" style="width:100%; height:160px; padding:16px; border-radius:var(--radius-sm); border:1px solid var(--card-border); background:var(--bg3); color:var(--text); font-family:var(--mono); font-size:0.85rem; resize:none;" readonly>${txt}</textarea>
    
    <div style="display:flex; gap:10px; margin-top:16px;">
      <button class="rbtn primary" style="width:100%; justify-content:center;" onclick="copyISBAR()"><i class="fa-solid fa-copy"></i> Text kopieren</button>
    </div>
  `;
}

function updateISBAROut() {
  const sInput = document.getElementById('isbarS').value;
  const bInput = document.getElementById('isbarB').value;
  const d = curDiag;
  const v = curVit;
  
  let txt = `I: Patient (Name/Alter)\n`;
  txt += `S: ${d?d.name:'Ohne Zuordnung'}, MTS Stufe ${curMTSLvl} \n`;
  if(sInput) txt += `   OPQRST: ${sInput}\n`;
  txt += `B: SAMPLER: ${bInput ? bInput : 'Keine Besonderheiten erfasst'}\n`;
  txt += `A: GCS ${v.gcs||'/'}, SpO2 ${v.spo2||'/'}%, Temp ${v.temp||'/'}°C, NRS ${v.nrs||'/'}\n`;
  txt += `R: Bitte um zügige ärztliche Sichtung gemäß MTS Vorgabe.`;
  
  document.getElementById('isbarOut').value = txt;
}

function copyISBAR() {
   const txt = document.getElementById('isbarOut').value;
   navigator.clipboard.writeText(txt).then(() => {
     const btn = document.querySelector('#isbarC .primary');
     btn.innerHTML = '<i class="fa-solid fa-check"></i> Erfolgreich kopiert';
     btn.style.background = 'var(--green)';
     btn.style.borderColor = 'var(--green)';
     setTimeout(() => { clISBAR(); }, 800);
   });
}

function rLvl(){document.getElementById('lvl').innerHTML=LV.map(l=>`<div class="lc lc-${l.l}"><h3><i class="fa-solid fa-circle"></i> Stufe ${l.l} (${l.n})</h3><div class="tm">Max: <b>${l.t}</b> · Kontrolle: <b>${l.r}</b></div><div class="ds">${l.d}</div></div>`).join('')}
function rCS(){
  document.getElementById('cht').innerHTML=
    '<div style="grid-column:1/-1;padding:14px 16px;border:1px solid var(--yellow-border);background:var(--yellow-bg);border-radius:var(--radius-sm);font-size:.82rem;color:var(--text2);line-height:1.5"><b style="color:var(--text)"><i class="fa-solid fa-book-medical"></i> Cheatsheet Altbestand.</b><br>Diese Kurzregeln sind noch nicht vollständig gegen die lizenzierte MTS Vollreferenz 2025 validiert und dürfen die D1 Einstufung nicht automatisch steuern.</div>'+
    CS.map(c=>`<div class="cc"><h4>${c.t}</h4><ul>${c.i.map(x=>`<li><i class="fa-solid fa-caret-right"></i>${x}</li>`).join('')}</ul></div>`).join('');
}

function showToast(message,type='success'){
  let el=document.getElementById('appToast');
  if(!el){
    el=document.createElement('div');
    el.id='appToast';
    document.body.appendChild(el);
  }
  el.className='app-toast '+type;
  el.innerHTML=(type==='success'?'<i class="fa-solid fa-circle-check"></i>':'<i class="fa-solid fa-triangle-exclamation"></i>')+'<span>'+escapeHtml(message)+'</span>';
  requestAnimationFrame(()=>el.classList.add('show'));
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>el.classList.remove('show'),2600);
}
function getSelectedIndicatorLabels(){
  return selI.map(k=>{
    const [ls,idxs,gen]=k.split('-');
    const l=Number(ls),idx=Number(idxs),isGen=gen==='1';
    const source=isGen?(GI[l]||[]):((curDiag?.i&&curDiag.i[l])||[]);
    return {level:l,text:source[idx]||'',type:isGen?'general':'specific'};
  }).filter(x=>x.text);
}

function addH(id, lvl){
  const d=D.find(x=>x.id===id);
  if(!d||!lvl){showToast('Einschätzung konnte nicht gespeichert werden.','error');return false}
  const entry={
    id:d.id,
    name:d.name,
    c:d.c,
    ts:new Date().toISOString(),
    l:Number(lvl),
    source:manualPriority.level!==null?'manual-or-local':'mts-discriminator',
    manual:manualPriority.level!==null?{...manualPriority}:null,
    vitals:{...curVit},
    indicators:getSelectedIndicatorLabels(),
    selectedKeys:[...selI]
  };
  try{
    hist.unshift(entry);
    if(hist.length>200)hist=hist.slice(0,200);
    localStorage.setItem('mts_h',JSON.stringify(hist));
    const verify=JSON.parse(localStorage.getItem('mts_h')||'[]');
    if(!Array.isArray(verify)||verify[0]?.ts!==entry.ts)throw new Error('storage verification failed');
    rHist();
    renderRecentDiagrams();
    showToast(`Einschätzung gespeichert · ${d.name} · ${priorityColorName(lvl)}`);
    return true;
  }catch(err){
    console.error('[TriageAssist] save failed',err);
    hist=hist.filter(h=>h.ts!==entry.ts);
    showToast('Speichern fehlgeschlagen. Browser-Speicher prüfen.','error');
    return false;
  }
}
function saveAssessmentAndClose(id,lvl){
  if(addH(id,lvl))clO();
}

async function runSystemHealth(){
  const overall=document.getElementById('healthOverall');
  const grid=document.getElementById('healthGrid');
  const checksEl=document.getElementById('healthChecks');
  if(!overall||!grid||!checksEl)return;

  const checks=[];
  const add=(name,ok,detail='')=>checks.push({name,ok:!!ok,detail});

  try{
    if(typeof runTriageRegressionTests==='function'){
      const r=runTriageRegressionTests({D,GI,LV,BR,CASES,LOCAL_RULES,MTS_DATA_META,MTS_DIAGRAM_META});
      r.results.forEach(x=>add(x.name,x.ok,x.detail||''));
    }else{
      add('Regression suite loaded',false,'runTriageRegressionTests fehlt');
    }
  }catch(e){
    add('Regression suite execution',false,String(e));
  }

  try{
    const rt=runSafetySelfTests();
    rt.results.forEach(x=>add('Runtime: '+x.name,x.ok));
  }catch(e){
    add('Runtime self-tests',false,String(e));
  }

  try{
    if(typeof runSearchQualityTests==='function'){
      const sq=runSearchQualityTests({
        D,
        SEARCH_ALIASES:typeof SEARCH_ALIASES!=='undefined'?SEARCH_ALIASES:{},
        SEARCH_BODY_RULES:typeof SEARCH_BODY_RULES!=='undefined'?SEARCH_BODY_RULES:[],
        SEARCH_SYMPTOM_RULES:typeof SEARCH_SYMPTOM_RULES!=='undefined'?SEARCH_SYMPTOM_RULES:{},
        rankSearchResults
      });
      add('Search Top-3 quality',sq.ok,`${sq.passed}/${sq.count} Suchfälle`);
      sq.results.filter(x=>!x.ok).slice(0,5).forEach(x=>add('Search: '+x.query,false,'Top 3: '+x.top3.join(', ')));
    }else{
      add('Search quality suite loaded',false,'runSearchQualityTests fehlt');
    }
  }catch(e){
    add('Search quality execution',false,String(e));
  }

  try{
    if('caches' in window){
      const keys=await caches.keys();
      add('Offline cache ready',keys.some(k=>k.startsWith('triageassist-v2-')),keys.join(', '));
    }else{
      add('Offline cache ready',false,'Cache API nicht verfügbar');
    }
  }catch(e){
    add('Offline cache ready',false,String(e));
  }

  let version=null;
  try{
    const res=await fetch('./version.json',{cache:'no-store'});
    if(res.ok) version=await res.json();
    add('Version metadata reachable',!!version,version?.version||'');
  }catch(e){
    add('Version metadata reachable',false,String(e));
  }

  add('Service Worker supported','serviceWorker' in navigator);
  add('Browser storage available',typeof localStorage!=='undefined');

  const failed=checks.filter(x=>!x.ok);
  const passed=checks.length-failed.length;
  overall.className='health-overall '+(failed.length?'fail':'pass');
  overall.innerHTML=failed.length
    ? `<i class="fa-solid fa-triangle-exclamation"></i><div><b>${failed.length} Fehler</b><span>${passed}/${checks.length} bestanden</span></div>`
    : `<i class="fa-solid fa-circle-check"></i><div><b>System konsistent</b><span>${passed}/${checks.length} bestanden</span></div>`;

  const validationRecords=Object.keys(validationState||{}).length;
  const approved=Object.values(validationState||{}).filter(x=>x?.status==='local-approved').length;
  grid.innerHTML=
    `<div class="health-card"><i class="fa-solid fa-code-branch"></i><div><b>${version?.version||'unbekannt'}</b><span>App Version</span></div></div>`+
    `<div class="health-card"><i class="fa-solid fa-diagram-project"></i><div><b>${D.length}</b><span>Diagramme</span></div></div>`+
    `<div class="health-card"><i class="fa-solid fa-graduation-cap"></i><div><b>${CASES.length}</b><span>Trainingsfälle</span></div></div>`+
    `<div class="health-card"><i class="fa-solid fa-clipboard-check"></i><div><b>${validationRecords}</b><span>Review Datensätze</span></div></div>`+
    `<div class="health-card"><i class="fa-solid fa-shield"></i><div><b>${approved}</b><span>Lokal freigegeben</span></div></div>`;

  checksEl.innerHTML=checks.map(c=>`
    <div class="health-check ${c.ok?'ok':'bad'}">
      <i class="fa-solid ${c.ok?'fa-circle-check':'fa-circle-xmark'}"></i>
      <div><b>${escapeHtml(c.name)}</b>${c.detail?`<span>${escapeHtml(c.detail)}</span>`:''}</div>
    </div>`).join('');
}

function openSavedAssessment(index){
  const h=hist[index];
  if(!h)return;
  const d=D.find(x=>x.id===h.id);
  if(!d)return;
  curDiag=d;
  curVit={gcs:'',spo2:'',temp:'',nrs:'',...(h.vitals||{})};
  manualPriority=h.manual?{...h.manual}:{level:null,source:'',label:''};
  restoredAssessment={...h};

  if(Array.isArray(h.selectedKeys)&&h.selectedKeys.length){
    selI=[...h.selectedKeys];
  }else{
    // Best effort for entries created before RC5: recover keys by stored indicator text.
    selI=[];
    (h.indicators||[]).forEach(saved=>{
      const level=Number(saved.level);
      const isGen=saved.type==='general';
      const source=isGen?(GI[level]||[]):((d.i&&d.i[level])||[]);
      const idx=source.findIndex(x=>x===saved.text);
      if(idx>=0)selI.push(`${level}-${idx}-${isGen?1:0}`);
    });
    // Very old entries only contained the final level. Show that historical result explicitly.
    if(!selI.length && !manualPriority.level && h.l){
      manualPriority={
        level:Number(h.l),
        source:'historischer Verlauf',
        label:'Gespeicherte Stufe – Detailkriterien wurden damals noch nicht mitgespeichert'
      };
    }
  }

  rOvl();
  const overlay=document.getElementById('detO');
  overlay.classList.add('open');
  requestAnimationFrame(()=>{
    overlay.scrollTop=0;
    overlay.querySelector('.oc')?.scrollTo({top:0});
    window.scrollTo({top:0,behavior:'smooth'});
  });
}

function rHist(){
  const t=hist.length,td=hist.filter(h=>new Date(h.ts).toDateString()===new Date().toDateString()).length,cc={};
  hist.forEach(h=>{cc[h.c]=(cc[h.c]||0)+1});
  const tp=Object.entries(cc).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('stR').innerHTML=`<div class="sx"><div class="n">${t}</div><div class="l">Gesamt</div></div><div class="sx"><div class="n">${td}</div><div class="l">Heute</div></div><div class="sx"><div class="n">${Object.keys(cc).length}</div><div class="l">Kategorien</div></div><div class="sx"><div class="n" style="font-size:1rem;display:flex;align-items:center;justify-content:center;height:1.4rem;line-height:1.2">${tp?tp[0]:'Leer'}</div><div class="l">Top</div></div>`;
  const hl_=document.getElementById('hL');
  if(!hist.length){hl_.innerHTML='<div class="empty"><i class="fa-regular fa-clock" style="font-size:2rem;margin-bottom:8px;display:block"></i>Keine Zuordnungen bisher.</div>';return}
  hl_.innerHTML=hist.slice(0,50).map((h,i)=>{
    const d=new Date(h.ts);
    const lvlDot = h.l ? `<span class="td td-${h.l}" style="margin-right:6px"></span>Stufe ${h.l}` : '';
    const sourceTxt=h.source==='manual-or-local'?'manuell/lokal':'MTS-Diskriminator';
    const vit=[h.vitals?.gcs?`GCS ${h.vitals.gcs}`:'',h.vitals?.spo2?`SpO₂ ${h.vitals.spo2}%`:'',h.vitals?.temp?`${h.vitals.temp} °C`:'',h.vitals?.nrs?`NRS ${h.vitals.nrs}`:''].filter(Boolean).join(' · ');
    return`<div class="hi"><div class="inf"><div class="sym">${h.name}</div><div class="met"><i class="fa-regular fa-calendar"></i> ${d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'2-digit'})} ${d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} &bull; ${h.c} &bull; Nr.${h.id} <span style="margin-left:auto;font-weight:700;color:var(--text);display:flex;align-items:center">${lvlDot}</span></div><div class="hist-detail"><span><i class="fa-solid fa-route"></i> ${sourceTxt}</span>${vit?`<span><i class="fa-solid fa-wave-square"></i> ${vit}</span>`:''}</div></div><div class="act" style="display:flex;gap:6px;margin-left:12px"><button class="ib view" onclick="openSavedAssessment(${i})" title="Gespeicherte Einschätzung öffnen"><i class="fa-regular fa-eye"></i></button><button class="ib" onclick="rmH(${i})" title="Löschen"><i class="fa-solid fa-trash"></i></button></div></div>`
  }).join('')
}
function rmH(i){hist.splice(i,1);localStorage.setItem('mts_h',JSON.stringify(hist));rHist();renderRecentDiagrams()}
function clrH(){if(!confirm('Verlauf wirklich komplett löschen?'))return;hist=[];localStorage.setItem('mts_h',JSON.stringify(hist));rHist()}
function collectLocalAppData(){
  const data={};
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(key && (key.startsWith('mts_')||key==='mts_validation_v1'))data[key]=localStorage.getItem(key);
  }
  return data;
}
function exportFullLocalBackup(){
  const payload={
    schema:'triageassist-local-backup-v1',
    exportedAt:new Date().toISOString(),
    appVersion:document.getElementById('versionBadge')?.textContent||'',
    localStorage:collectLocalAppData()
  };
  dl(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),'triageassist-komplettbackup-'+ds()+'.json');
  showToast('Lokales Komplettbackup erstellt.');
}
function importFullLocalBackup(event){
  const file=event.target.files?.[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const payload=JSON.parse(String(reader.result||'{}'));
      if(payload.schema!=='triageassist-local-backup-v1'||!payload.localStorage||typeof payload.localStorage!=='object'){
        throw new Error('Ungültiges Backup-Format');
      }
      const entries=Object.entries(payload.localStorage).filter(([key,value])=>
        (key.startsWith('mts_')||key==='mts_validation_v1') && typeof value==='string'
      );
      if(!entries.length)throw new Error('Backup enthält keine App-Daten');
      if(!confirm('Lokale App-Daten durch dieses Backup ersetzen?'))return;
      [...Array(localStorage.length).keys()].map(i=>localStorage.key(i)).filter(Boolean)
        .filter(key=>key.startsWith('mts_')||key==='mts_validation_v1')
        .forEach(key=>localStorage.removeItem(key));
      entries.forEach(([key,value])=>localStorage.setItem(key,value));
      showToast('Backup wiederhergestellt. App wird neu geladen.');
      setTimeout(()=>location.reload(),700);
    }catch(err){
      console.error('[TriageAssist] backup import failed',err);
      showToast('Backup konnte nicht wiederhergestellt werden.','error');
    }finally{
      event.target.value='';
    }
  };
  reader.readAsText(file);
}

function expJ(){dl(new Blob([JSON.stringify({v:6,ts:new Date().toISOString(),hist},null,2)],{type:'application/json'}),'triageassist-backup-'+ds()+'.json')}
function expC(){let c='Datum;Uhrzeit;Nr;Diagramm;Kategorie;Level\n';hist.forEach(h=>{const d=new Date(h.ts);c+=`${d.toLocaleDateString('de-DE')};${d.toLocaleTimeString('de-DE')};${h.id};${h.name};${h.c};${h.l||''}\n`});dl(new Blob(['\ufeff'+c],{type:'text/csv;charset=utf-8'}),'triageassist-verlauf-'+ds()+'.csv')}
function impD(){document.getElementById('impF').click()}
function hImp(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=function(ev){try{const d=JSON.parse(ev.target.result);if(d.hist){hist=[...d.hist,...hist];localStorage.setItem('mts_h',JSON.stringify(hist))}alert('Import erfolgreich!');rHist()}catch{alert('Fehler beim Import.')}};r.readAsText(f);e.target.value=''}
function dl(b,n){const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u)}
function ds(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function debounce(fn,ms){let t;return function(...a){clearTimeout(t);t=setTimeout(()=>fn.apply(this,a),ms)}}
function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}

let trnIdx=0,trnAns=null,trnScore=0,trnDone=0,trnOrder=[],trnDiagChosen=null,trnLvlChosen=null,trnDiagScore=0,trnLvlScore=0;
function initTrain(){
  if(!trnOrder.length||trnDone>=trnOrder.length){trnOrder=shuffle([...Array(CASES.length).keys()]);trnIdx=0;trnAns=null;trnScore=0;trnDone=0;trnDiagChosen=null;trnLvlChosen=null;trnDiagScore=0;trnLvlScore=0;}
  rTrn();
}

function rTrn(){
  const ci=trnOrder[trnIdx];const c=CASES[ci];
  const diag=D.find(x=>x.id===c.diag);
  const opts=genOpts(c.diag);
  const completedIdx=trnOrder.slice(0,trnDone);
  const lvlDone=completedIdx.filter(i=>!CASES[i].diagramOnly).length;
  const lvlTotal=CASES.filter(x=>!x.diagramOnly).length;
  const isDiagramOnly=!!c.diagramOnly;

  document.getElementById('trainArea').innerHTML=`
    <div class="trn-header">
      <h3><i class="fa-solid fa-user-graduate"></i> Fall ${trnDone+1} von ${CASES.length}</h3>
      <div class="trn-stats">
        <div class="trn-stat"><i class="fa-solid fa-sitemap" style="color:var(--green)"></i> <span>Diagramm ${trnDiagScore}/${trnDone}</span></div>
        <div class="trn-stat"><i class="fa-solid fa-traffic-light" style="color:var(--orange)"></i> <span>Stufe ${trnLvlScore}/${lvlDone}</span></div>
      </div>
    </div>

    <div class="trn-progress"><div class="trn-progress-bar" style="width:${(trnDone/CASES.length)*100}%"></div></div>

    <div class="trn-card">
      <div class="trn-badge">${isDiagramOnly?'Diagrammtraining':'Szenario'}</div>
      <div class="trn-scenario">${c.s}</div>
    </div>

    <div class="trn-q"><i class="fa-solid fa-circle-question"></i> 1. Welches MTS Diagramm passt am besten?</div>
    <div class="trn-opts" id="tOpts">
      ${opts.map((o,i)=>{
        const dd=D.find(x=>x.id===o);
        let cls='trn-opt';
        if(trnAns!==null){
          if(o===c.diag)cls+=' correct';
          else if(o===trnDiagChosen&&o!==c.diag)cls+=' wrong';
          else cls+=' dimmed';
        }
        return`<div class="${cls}" ${trnAns===null?`onclick="trnAnswer(${i},${o},${c.diag})"`:''}>
          <span class="tb tb-${cl(dd.c)}"><span class="td td-${cl(dd.c)}"></span></span>
          <span style="flex:1">${dd.name}</span>
          ${trnAns!==null && o===c.diag ? '<i class="fa-solid fa-circle-check" style="font-size:1.4rem"></i>' : ''}
          ${trnAns!==null && o===trnDiagChosen && o!==c.diag ? '<i class="fa-solid fa-circle-xmark" style="font-size:1.4rem"></i>' : ''}
        </div>`;
      }).join('')}
    </div>

    ${trnAns!==null && isDiagramOnly?`
      <div class="trn-explain">
        <b><i class="fa-solid fa-lightbulb"></i> Auflösung:</b>
        ${trnDiagChosen===c.diag?'<span style="color:var(--green);font-weight:800">Richtig.</span>':'<span style="color:var(--red);font-weight:800">Nicht ganz.</span>'}
        Passend ist „${diag.name}“.<br><br>${c.ex}
      </div>
      <button class="trn-next" onclick="nextTrn()">Nächster Fall <i class="fa-solid fa-arrow-right"></i></button>
    `:''}

    ${trnAns!==null && !isDiagramOnly?`
      <div class="trn-q" style="margin-top:32px"><i class="fa-solid fa-traffic-light"></i> 2. Welche Dringlichkeitsstufe?</div>
      <div class="trn-lvl-grid" id="tLvl">
        ${[1,2,3,4,5].map(l=>{
          let cls='trn-lvl-btn';
          let extra='';
          if(trnAns==='lvl' && l===c.lvl){cls+=' on';extra='<i class="fa-solid fa-circle-check"></i>';}
          else if(trnAns==='lvl' && l===trnLvlChosen && l!==c.lvl){cls+=' wrong';extra='<i class="fa-solid fa-circle-xmark"></i>';}
          return`<div class="${cls}" ${trnAns==='lvl'?'':`onclick="trnLvl(${l},${c.lvl})"`}>
            <span class="td td-${l}"></span>${LV[l-1].n}${extra}
          </div>`;
        }).join('')}
      </div>

      ${trnAns==='lvl'?`
        <div class="trn-explain">
          <b><i class="fa-solid fa-lightbulb"></i> Begründung:</b>
          ${trnLvlChosen===c.lvl?'<span style="color:var(--green);font-weight:800">Richtig.</span>':'<span style="color:var(--red);font-weight:800">Deine Wahl war nicht korrekt.</span>'} Richtig ist Stufe ${c.lvl} (${LV[c.lvl-1].n}) in „${diag.name}“.<br><br>${c.ex}
        </div>
        <button class="trn-next" onclick="nextTrn()">Nächster Fall <i class="fa-solid fa-arrow-right"></i></button>
      `:''}
    `:''}

    ${trnDone>=CASES.length?`
      <div style="text-align:center;margin-top:40px">
        <h3 style="margin-bottom:12px;font-size:1.5rem;font-weight:800">Training abgeschlossen! 🎉</h3>
        <p style="color:var(--text2);margin-bottom:24px">Diagrammwahl: <b>${trnDiagScore}/${CASES.length}</b> · Dringlichkeitsstufe: <b>${trnLvlScore}/${lvlTotal}</b></p>
        <button class="rbtn primary" onclick="trnOrder=[];initTrain()"><i class="fa-solid fa-arrows-rotate"></i> Neue Runde starten</button>
      </div>
    `:''}
  `;
}

function trnAnswer(idx,chosen,correct){
  trnDiagChosen=chosen;
  trnAns='diag';
  if(chosen===correct){trnScore++;trnDiagScore++;}
  rTrn();
}
function trnLvl(chosen,correct){
  trnLvlChosen=chosen;
  if(chosen===correct)trnLvlScore++;
  trnAns='lvl';
  rTrn();
}
function nextTrn(){
  trnDone++;
  trnIdx=(trnIdx+1)%trnOrder.length;
  trnAns=null;
  trnDiagChosen=null;
  trnLvlChosen=null;
  rTrn();
}

let _lastOpts={};
function genOpts(correctId){
  if(_lastOpts.id===correctId)return _lastOpts.opts;
  const wrong=D.filter(x=>x.id!==correctId).sort(()=>Math.random()-.5).slice(0,3).map(x=>x.id);
  const all=[correctId,...wrong].sort(()=>Math.random()-.5);
  _lastOpts={id:correctId,opts:all};return all;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function runSafetySelfTests(){
  const results=[];
  const test=(name,ok)=>results.push({name,ok:!!ok});
  const rov=rOvl.toString();
  test('explicit-discriminator-only', rov.includes('let lvl=null') && !rov.includes('d.b||5'));
  test('legacy-rules-outside-core', typeof LOCAL_RULES!=='undefined' && !rov.includes('d.r'));
  test('no-global-vital-autotriage', !rov.includes('vLvl') && !rov.includes('Math.min(lvl, vLvl)'));
  const calcCore=rov.slice(0,rov.indexOf('const lObj'));
  test('vital-advisories-do-not-triage', !calcCore.includes('getVitalAdvisories') && !calcCore.includes('vitalFieldClass'));
  test('validation-metadata-does-not-triage', !calcCore.includes('validationState') && !calcCore.includes('getValidationRecord') && !calcCore.includes('local-approved'));
  test('training-level-evaluation', trnLvl.toString().includes('chosen===correct'));
  test('qsofa-separated', rGCS.toString().includes('kein MTS'));
  test('manv-labelled', fR.toString().includes('MANV / Sichtung'));
  const failed=results.filter(x=>!x.ok);
  console.info('[TriageAssist V2] Safety self-tests',results);
  if(failed.length) console.error('[TriageAssist V2] Safety self-tests FAILED',failed);
  return {ok:failed.length===0,results};
}
window.__triageSafety=runSafetySelfTests();

setupSearchClearButtons();
renderRecentDiagrams();
rLvl();rCS();rTox();SI_.focus();
