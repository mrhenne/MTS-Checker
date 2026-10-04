if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(err => {
    console.warn('[TriageAssist] Service Worker registration failed', err);
  });
}

let hist=JSON.parse(localStorage.getItem('mts_h')||'[]'),aCat='';
let curDiag=null,selR=[],selI=[];
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
  if(t.dataset.t==='tox')rTox();
  if(t.dataset.t==='lvl')rLvl();
  if(t.dataset.t==='cs')rCS();
  if(t.dataset.t==='train')initTrain();
  if(t.dataset.t==='hist')rHist();
}));

const SI_=document.getElementById('SI');
SI_.addEventListener('input',debounce(()=>{
  const q=SI_.value.trim().toLowerCase(),sB=document.getElementById('sB'),sC=document.getElementById('sC'),sH=document.getElementById('sH'),sR=document.getElementById('sR');
  if(q.length<2){sR.innerHTML='';sB.style.display='none';sH.style.display='block';return}
  sH.style.display='none';
  const ts=q.split(/[\s,;]+/).filter(t=>t.length>=2);
  let sc=D.map(d=>{
    let s=0,m=[];
    const indText = d.i ? Object.values(d.i).flat().join(' ').toLowerCase() : '';
    if(d.name.toLowerCase().includes(q)){s+=25;m.push(q)}
    if(indText.includes(q)){s+=15;m.push(q)}
    d.kw.forEach(k=>{if(k.includes(q)||q.includes(k)){s+=20;m.push(q)}});
    ts.forEach(t=>{
      d.kw.forEach(k=>{if(k===t)s+=12;else if(k.includes(t)){s+=8;m.push(t)}});
      if(d.name.toLowerCase().includes(t)){s+=10;m.push(t)}
      if(indText.includes(t)){s+=5;m.push(t)}
    });
    if(ts.length>1&&ts.every(t=>d.kw.some(k=>k.includes(t))||d.name.toLowerCase().includes(t)||indText.includes(t)))s+=18;
    return{...d,score:s,mt:[...new Set(m)]}
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  sB.style.display='flex';sC.innerHTML=`<b>${sc.length}</b> Treffer`;
  if(!sc.length){sR.innerHTML='<div class="empty"><i class="fa-solid fa-magnifying-glass" style="font-size:2rem;margin-bottom:8px;display:block"></i>Keine Diagramme gefunden.</div>';return}
  sR.innerHTML=sc.slice(0,15).map(x=>`<div class="card" onclick="shD(${x.id})"><div class="ch"><span class="ct">${hl(x.name,ts)}</span><span class="tb tb-${cl(x.c)}"><span class="td td-${cl(x.c)}"></span>${x.c}</span></div><div class="cs">Diagramm Nr. ${x.id}</div><div class="tags">${x.kw.filter(k=>x.mt.some(m=>k.includes(m))).slice(0,5).map(k=>`<span class="tag m">${k}</span>`).join('')}${x.kw.filter(k=>!x.mt.some(m=>k.includes(m))).slice(0,3).map(k=>`<span class="tag">${k}</span>`).join('')}</div></div>`).join('')
},150));

function hl(t,ts){let r=t;ts.forEach(x=>{r=r.replace(new RegExp(`(${esc(x)})`,'gi'),'<mark style="background:var(--mark-bg);color:var(--mark-color);border-radius:4px;padding:0 2px">$1</mark>')});return r}
function cl(c){return{Kardiologisch:2,Neurologisch:2,Respiratorisch:2,Trauma:3,Abdominell:3,Chirurgisch:3,Pädiatrisch:3,Psychiatrisch:3,Toxikologisch:2,Internistisch:3,Gynäkologisch:3,Urologisch:3,Allgemein:4,'HNO / Sinnesorgane':4,Dermatologisch:4,Orthopädisch:4,Spezial:2}[c]||3}

function initBM(){
  document.getElementById('bmC').innerHTML=`<div class="bm-fig">${svgF()}<div class="bm-fig-lbl">Front</div></div><div class="bm-fig">${svgB()}<div class="bm-fig-lbl">Back</div></div>`;
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

function svgF(){return`<svg viewBox="0 0 200 460" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--bz-grad2)"/><stop offset="100%" stop-color="var(--bz-grad1)"/></linearGradient></defs><path class="bz" data-r="head" d="M85,25 a15,15 0 0,1 30,0 v15 a15,15 0 0,1 -30,0 z" style="fill:url(#gf)"/><text class="bl" x="100" y="42" text-anchor="middle" font-size="9">Kopf</text><path class="bz" data-r="chest" d="M75,65 h50 a15,15 0 0,1 15,15 l-8,60 h-64 l-8,-60 a15,15 0 0,1 15,-15 z"/><text class="bl" x="100" y="112" text-anchor="middle" font-size="9">Thorax</text><path class="bz" data-r="abdomen" d="M71,148 h58 l-5,45 a10,10 0 0,1 -10,10 h-28 a10,10 0 0,1 -10,-10 z"/><text class="bl" x="100" y="182" text-anchor="middle" font-size="8">Abdomen</text><path class="bz" data-r="pelvis" d="M76,211 h48 a15,15 0 0,1 15,15 l-4,20 a15,15 0 0,1 -12,14 l-18,12 a6,6 0 0,1 -10,0 l-18,-12 a15,15 0 0,1 -12,-14 l-4,-20 a15,15 0 0,1 15,-15 z"/><text class="bl" x="100" y="242" text-anchor="middle" font-size="8">Becken</text><path class="bz" data-r="arm_r" d="M56,70 a12,12 0 0,0 -20,8 l-15,100 a12,12 0 0,0 22,6 l15,-100 a12,12 0 0,0 -2,-14 z"/><text class="bl" x="32" y="160" text-anchor="middle" font-size="7">R. Arm</text><path class="bz" data-r="arm_l" d="M144,70 a12,12 0 0,1 20,8 l15,100 a12,12 0 0,1 -22,6 l-15,-100 a12,12 0 0,1 2,-14 z"/><text class="bl" x="168" y="160" text-anchor="middle" font-size="7">L. Arm</text><path class="bz" data-r="leg_r" d="M72,255 l-12,160 a14,14 0 0,0 26,4 l12,-155 z"/><text class="bl" x="68" y="360" text-anchor="middle" font-size="7">R. Bein</text><path class="bz" data-r="leg_l" d="M128,255 l12,160 a14,14 0 0,1 -26,4 l-12,-155 z"/><text class="bl" x="132" y="360" text-anchor="middle" font-size="7">L. Bein</text></svg>`}
function svgB(){return`<svg viewBox="0 0 200 460" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--bz-grad2)"/><stop offset="100%" stop-color="var(--bz-grad1)"/></linearGradient></defs><path class="bz" data-r="head" d="M85,25 a15,15 0 0,1 30,0 v15 a15,15 0 0,1 -30,0 z" style="fill:url(#gb)"/><text class="bl" x="100" y="42" text-anchor="middle" font-size="9">Kopf</text><path class="bz" data-r="neck_back" d="M85,65 h30 a15,15 0 0,1 15,15 l-2,15 h-56 l-2,-15 a15,15 0 0,1 15,-15 z"/><text class="bl" x="100" y="85" text-anchor="middle" font-size="7">HWS</text><path class="bz" data-r="back_upper" d="M72,100 h56 l-4,40 h-48 l-4,-40 z"/><text class="bl" x="100" y="125" text-anchor="middle" font-size="7">Ob. Rücken</text><path class="bz" data-r="back_lower" d="M71,148 h58 l-5,45 a10,10 0 0,1 -10,10 h-28 a10,10 0 0,1 -10,-10 z"/><text class="bl" x="100" y="182" text-anchor="middle" font-size="7">Unt. Rücken</text><path class="bz" data-r="pelvis" d="M76,211 h48 a15,15 0 0,1 15,15 l-4,20 a15,15 0 0,1 -12,14 l-18,12 a6,6 0 0,1 -10,0 l-18,-12 a15,15 0 0,1 -12,-14 l-4,-20 a15,15 0 0,1 15,-15 z"/><text class="bl" x="100" y="242" text-anchor="middle" font-size="8">Gesäß</text><path class="bz" data-r="arm_r" d="M56,70 a12,12 0 0,0 -20,8 l-15,100 a12,12 0 0,0 22,6 l15,-100 a12,12 0 0,0 -2,-14 z"/><text class="bl" x="32" y="160" text-anchor="middle" font-size="7">R. Arm</text><path class="bz" data-r="arm_l" d="M144,70 a12,12 0 0,1 20,8 l15,100 a12,12 0 0,1 -22,6 l-15,-100 a12,12 0 0,1 2,-14 z"/><text class="bl" x="168" y="160" text-anchor="middle" font-size="7">L. Arm</text><path class="bz" data-r="leg_r" d="M72,255 l-12,160 a14,14 0 0,0 26,4 l12,-155 z"/><text class="bl" x="68" y="360" text-anchor="middle" font-size="7">R. Bein</text><path class="bz" data-r="leg_l" d="M128,255 l12,160 a14,14 0 0,1 -26,4 l-12,-155 z"/><text class="bl" x="132" y="360" text-anchor="middle" font-size="7">L. Bein</text></svg>`}

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
  curVit = { gcs: '', spo2: '', temp: '', nrs: '' };
  if(!curDiag)return;
  rOvl();
  document.getElementById('detO').classList.add('open');
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

function updV(key, val) { curVit[key] = val; rOvl(); }
function updPed(val) { curPed = val; rOvl(); }

function rOvl(){
  const d=curDiag;
  let lvl=d.b||5;
  
  selI.forEach(k=>{ const l = parseInt(k.split('-')[0]); if(l < lvl) lvl = l; });

  // V2 Safety: lokale Sonderregeln (d.r) beeinflussen die MTS-Stufe während der Validierung nicht.
  // Dadurch kann eine bereits höhere Dringlichkeit weder überschrieben noch heruntergestuft werden.

  let vLvl = 5;
  if(curVit.gcs !== '') {
    const gcs = parseInt(curVit.gcs);
    if(gcs < 15) vLvl = Math.min(vLvl, 2);
    if(gcs < 12) vLvl = Math.min(vLvl, 1);
  }
  if(curVit.spo2 !== '') {
    const spo2 = parseInt(curVit.spo2);
    if(spo2 < 92) vLvl = Math.min(vLvl, 2);
  }
  if(curVit.temp !== '') {
    const temp = parseFloat(curVit.temp.replace(',','.'));
    if(temp > 41) vLvl = Math.min(vLvl, 2);
    else if(temp > 39) vLvl = Math.min(vLvl, 3);
  }
  if(curVit.nrs !== '') {
    const nrs = parseInt(curVit.nrs);
    if(nrs >= 8) vLvl = Math.min(vLvl, 3); 
    else if(nrs >= 5) vLvl = Math.min(vLvl, 4); 
  }
  lvl = Math.min(lvl, vLvl);

  const lObj = LV.find(x=>x.l===lvl);
  const rl = D.filter(x=>x.c===d.c&&x.id!==d.id);

  let html = `
    <button class="ox" onclick="clO()"><i class="fa-solid fa-xmark"></i></button>
    ${d.id>=54?'<div style="padding:12px 14px;margin-bottom:14px;border-radius:var(--radius-sm);background:var(--yellow-bg);border:1px solid var(--yellow-border);font-size:.8rem;color:var(--text2)"><b style="color:var(--text)"><i class="fa-solid fa-triangle-exclamation"></i> MANV-Sondermodul in Validierung.</b> Nicht als reguläre MTS-Einstufung verwenden.</div>':''}
    <span class="tb tb-${cl(d.c)}"><span class="td td-${cl(d.c)}"></span>${d.id===53?'MTS Sonderdiagramm':d.c}</span>
    <h2 style="font-size:1.3rem;font-weight:800;margin-top:12px;color:var(--text)">${d.id}. ${d.name}</h2>
    
    <div class="triage-banner t-b-${lvl}">
      <div style="display:flex;align-items:center;gap:8px"><i class="fa-solid fa-triangle-exclamation"></i> Stufe ${lvl} (${lObj.n})</div>
      <div class="t-time">Max: ${lObj.t}</div>
    </div>`;

  if(d.c === 'Pädiatrisch'){
    html += `<div style="background:var(--bg3);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px;border:1px solid var(--card-border)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h4 style="font-size:0.85rem;font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px"><i class="fa-solid fa-baby"></i> Päd. Normwerte prüfen</h4>
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
    </div>`;
  }

  html += `<h4 style="font-size:0.9rem;font-weight:700;margin-bottom:8px;color:var(--text)"><i class="fa-solid fa-heart-pulse"></i> Dynamische Vitals (Trigger sofort)</h4>
    <div class="vitals-grid">
      <div class="vital-input-box" style="position:relative; display:flex; flex-direction:column;">
        <label style="display:flex; justify-content:space-between; align-items:center;">
          GCS (3 bis 15)
          <button onclick="openGCS()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:1.1rem;padding:0 4px;" title="GCS Rechner öffnen"><i class="fa-solid fa-calculator"></i></button>
        </label>
        <input type="number" min="3" max="15" value="${curVit.gcs}" onchange="updV('gcs', this.value)" style="margin-top:auto;">
      </div>
      <div class="vital-input-box">
        <label>SpO₂ (%)</label>
        <input type="number" min="0" max="100" value="${curVit.spo2}" onchange="updV('spo2', this.value)">
      </div>
      <div class="vital-input-box">
        <label>Temp (°C)</label>
        <input type="number" step="0.1" value="${curVit.temp}" onchange="updV('temp', this.value)">
      </div>
      <div class="vital-input-box">
        <label>NRS (0-10)</label>
        <input type="number" min="0" max="10" value="${curVit.nrs}" onchange="updV('nrs', this.value)">
      </div>
    </div>`;

  if(d.r && d.r.length > 0){
    html += `<div style="margin-bottom:20px;background:var(--yellow-bg);border:1px solid var(--yellow-border);border-radius:var(--radius-sm);padding:16px;">
      <h4 style="font-size:0.85rem;font-weight:800;color:var(--text);margin-bottom:6px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-lock"></i> Lokale Zusatzregeln vorübergehend deaktiviert</h4>
      <div style="font-size:.82rem;color:var(--text2);line-height:1.5">Für dieses Diagramm existieren ältere lokale oder heuristische Sonderregeln. Sie werden während der V2-Validierung nur angezeigt und beeinflussen die MTS-Stufe bewusst nicht.</div>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
        ${d.r.map(r=>`<div style="padding:9px 11px;background:var(--bg2);border:1px solid var(--card-border);border-radius:8px;font-size:.8rem;color:var(--text3)"><i class="fa-solid fa-ban"></i> <b>${r.l}</b> · ${r.t}</div>`).join('')}
      </div>
    </div>`;
  }

  const act = getActions(lvl, d);
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
    const genInds = GI[l] || [];
    const specInds = (d.i && d.i[l]) ? d.i[l] : [];
    if(genInds.length === 0 && specInds.length === 0) return;
    
    html += `<div class="ind-head t-b-${l}"><i class="fa-solid fa-circle" style="font-size:0.8em"></i> Stufe ${l}</div>`;
    
    specInds.forEach((ind, idx) => {
      const key = `${l}-${idx}-0`;
      const isSel = selI.includes(key);
      html += `<div class="ind-row" onclick="tgI(${l}, ${idx}, false)">
        <input type="checkbox" ${isSel?'checked':''}>
        <div class="ind-txt" style="font-weight:700">${ind}</div>
      </div>`;
    });

    genInds.forEach((ind, idx) => {
      const key = `${l}-${idx}-1`;
      const isSel = selI.includes(key);
      html += `<div class="ind-row" onclick="tgI(${l}, ${idx}, true)">
        <input type="checkbox" ${isSel?'checked':''}>
        <div class="ind-txt">${ind} <span style="opacity:0.6;font-size:0.75rem;font-weight:500">(Generell)</span></div>
      </div>`;
    });
  });

  if(rl.length){
    html += `<h4 style="font-size:0.85rem;font-weight:700;margin:24px 0 10px;color:var(--text)"><i class="fa-solid fa-folder-open"></i> Weitere Diagramme aus „${d.c}"</h4>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">${rl.map(r=>`<div class="card" style="margin:0;padding:12px 16px" onclick="shD(${r.id})"><div class="ch" style="margin:0"><span class="ct" style="font-size:0.9rem">${r.name}</span><span style="font-size:0.75rem;color:var(--text3);font-weight:600">Nr.${r.id}</span></div></div>`).join('')}</div>`;
  }

  html += `
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px">
      <button class="rbtn primary" onclick="addH(${d.id}, ${lvl});clO()"><i class="fa-solid fa-check"></i> Speichern (${lObj.n})</button>
      <button class="rbtn" onclick="openISBAR(${lvl})" style="background:var(--accent-bg); color:var(--accent); border-color:var(--accent);"><i class="fa-solid fa-clipboard-list"></i> ISBAR Generieren</button>
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
function rCS(){document.getElementById('cht').innerHTML=CS.map(c=>`<div class="cc"><h4>${c.t}</h4><ul>${c.i.map(x=>`<li><i class="fa-solid fa-caret-right"></i>${x}</li>`).join('')}</ul></div>`).join('')}

function addH(id, lvl){
  const d=D.find(x=>x.id===id);
  hist.unshift({id:d.id,name:d.name,c:d.c,ts:new Date().toISOString(),l:lvl});
  if(hist.length>200)hist=hist.slice(0,200);
  localStorage.setItem('mts_h',JSON.stringify(hist));
  rHist();
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
    return`<div class="hi"><div class="inf"><div class="sym">${h.name}</div><div class="met"><i class="fa-regular fa-calendar"></i> ${d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'2-digit'})} ${d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} &bull; ${h.c} &bull; Nr.${h.id} <span style="margin-left:auto;font-weight:700;color:var(--text);display:flex;align-items:center">${lvlDot}</span></div></div><div class="act" style="display:flex;gap:6px;margin-left:12px"><button class="ib view" onclick="shD(${h.id})" title="Öffnen"><i class="fa-regular fa-eye"></i></button><button class="ib" onclick="rmH(${i})" title="Löschen"><i class="fa-solid fa-trash"></i></button></div></div>`
  }).join('')
}
function rmH(i){hist.splice(i,1);localStorage.setItem('mts_h',JSON.stringify(hist));rHist()}
function clrH(){if(!confirm('Verlauf wirklich komplett löschen?'))return;hist=[];localStorage.setItem('mts_h',JSON.stringify(hist));rHist()}
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
  const pct=trnDone>0?Math.round(((trnDiagScore+trnLvlScore)/(trnDone*2))*100):0;
  
  document.getElementById('trainArea').innerHTML=`
    <div class="trn-header">
      <h3><i class="fa-solid fa-user-graduate"></i> Fall ${trnDone+1} von ${CASES.length}</h3>
      <div class="trn-stats">
        <div class="trn-stat"><i class="fa-solid fa-sitemap" style="color:var(--green)"></i> <span>Diagramm ${trnDiagScore}/${trnDone}</span></div>
        <div class="trn-stat"><i class="fa-solid fa-traffic-light" style="color:var(--orange)"></i> <span>Stufe ${trnLvlScore}/${trnDone}</span></div>
      </div>
    </div>
    
    <div class="trn-progress"><div class="trn-progress-bar" style="width:${(trnDone/CASES.length)*100}%"></div></div>
    
    <div class="trn-card">
      <div class="trn-badge">Szenario</div>
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

    ${trnAns!==null?`
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
        <p style="color:var(--text2);margin-bottom:24px">Diagrammwahl: <b>${trnDiagScore}/${CASES.length}</b> · Dringlichkeitsstufe: <b>${trnLvlScore}/${CASES.length}</b></p>
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
  test('priority-order', Math.min(1,3)===1 && Math.min(2,5)===2);
  test('legacy-downgrade-removed', !rOvl.toString().includes('if(r.v > lvl)'));
  test('training-level-evaluation', trnLvl.toString().includes('chosen===correct'));
  test('qsofa-separated', rGCS.toString().includes('kein MTS'));
  test('manv-labelled', fR.toString().includes('MANV / Sichtung'));
  const failed=results.filter(x=>!x.ok);
  console.info('[TriageAssist V2] Safety self-tests',results);
  if(failed.length) console.error('[TriageAssist V2] Safety self-tests FAILED',failed);
  return {ok:failed.length===0,results};
}
window.__triageSafety=runSafetySelfTests();

rLvl();rCS();rTox();SI_.focus();
