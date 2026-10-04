/* Pure search engine for TriageAssist.
 * Navigation only; never determines urgency.
 */
(function(root){
  function normalize(v=''){
    return String(v).toLowerCase()
      .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
      .replace(/[^a-z0-9]+/g,' ').trim();
  }
  function tokens(v=''){
    return normalize(v).split(/\s+/).filter(Boolean).map(t=>{
      if(t.endsWith('ern')&&t.length>6)return t.slice(0,-3);
      if(t.endsWith('en')&&t.length>5)return t.slice(0,-2);
      if(t.endsWith('e')&&t.length>4)return t.slice(0,-1);
      return t;
    });
  }
  function semanticHits(query,bodyRules=[],symptomRules={}){
    const out=[],normalized=normalize(query),ts=tokens(query);
    const has=(arr=[])=>arr.some(term=>{
      const nt=normalize(term),stem=tokens(nt)[0];
      return normalized.includes(nt)||(stem&&ts.includes(stem));
    });
    bodyRules.forEach(rule=>{
      const bodyMatch=(rule.terms||[]).some(term=>{
        const nt=normalize(term),stem=tokens(nt)[0];
        return normalized.includes(nt)||(stem&&ts.includes(stem));
      });
      if(!bodyMatch)return;
      let boost=42;
      if(has(symptomRules.pain))boost+=32;
      if(has(symptomRules.trauma))boost+=28;
      if(has(symptomRules.wound))boost+=30;
      if(has(symptomRules.swelling))boost+=16;
      if(has(symptomRules.numbness))boost+=14;
      if(has(symptomRules.weakness))boost+=14;
      if(has(symptomRules.fever))boost+=10;
      (rule.ids||[]).forEach((id,rank)=>out.push({id,score:boost-(rank*7),label:rule.label||''}));
    });
    return out;
  }
  function rank(query,D=[],aliases={},bodyRules=[],symptomRules={}){
    const q=String(query||'').trim().toLowerCase();
    if(q.length<2)return[];
    const ts=q.split(/[\s,;]+/).filter(t=>t.length>=2);
    const norm=q.replace(/[-_/]+/g,' ').replace(/\s+/g,' ').trim();
    const aliasHits=[];
    Object.entries(aliases||{}).forEach(([phrase,ids])=>{
      const p=phrase.toLowerCase();
      if(norm.includes(p)||p.includes(norm)||ts.every(t=>p.includes(t))){
        ids.forEach((id,idx)=>aliasHits.push({id,score:60-(idx*6),phrase}));
      }
    });
    const sem=semanticHits(q,bodyRules,symptomRules);
    return D.map(d=>{
      let score=0,m=[];
      const name=(d.name||'').toLowerCase();
      const indText=d.i?Object.values(d.i).flat().join(' ').toLowerCase():'';
      if(name.includes(q)){score+=25;m.push(q)}
      if(indText.includes(q)){score+=15;m.push(q)}
      (d.kw||[]).forEach(k=>{if(k.includes(q)||q.includes(k)){score+=20;m.push(q)}});
      ts.forEach(t=>{
        (d.kw||[]).forEach(k=>{if(k===t)score+=12;else if(k.includes(t)){score+=8;m.push(t)}});
        if(name.includes(t)){score+=10;m.push(t)}
        if(indText.includes(t)){score+=5;m.push(t)}
      });
      if(ts.length>1&&ts.every(t=>(d.kw||[]).some(k=>k.includes(t))||name.includes(t)||indText.includes(t)))score+=18;
      aliasHits.filter(a=>a.id===d.id).forEach(a=>{score+=a.score;m.push(a.phrase)});
      sem.filter(a=>a.id===d.id).forEach(a=>{score+=a.score;m.push(a.label)});
      return {...d,score,mt:[...new Set(m)]};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.id-b.id);
  }
  const api={normalizeSearch:normalize,searchTokens:tokens,getSemanticSearchHits:semanticHits,rankSearchResults:rank};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  Object.assign(root,api);
})(typeof window!=='undefined'?window:globalThis);
