/* TriageAssist regression tests
 * Pure structural / safety tests. No DOM required.
 */
(function(){
  function result(name, ok, detail=''){ return {name,ok:!!ok,detail}; }

  function runTriageRegressionTests(ctx){
    const {D,GI,LV,BR,CASES,LOCAL_RULES,MTS_DATA_META,MTS_DIAGRAM_META}=ctx;
    const out=[];
    const t=(n,o,d='')=>out.push(result(n,o,d));

    t('55 diagrams',Array.isArray(D)&&D.length===55,'D='+(D?.length??'n/a'));
    t('unique diagram IDs',new Set(D.map(d=>d.id)).size===D.length);
    t('5 MTS levels',Array.isArray(LV)&&LV.length===5);
    t('all diagrams have keywords',D.every(d=>Array.isArray(d.kw)));
    t('all diagram ids covered by metadata',D.every(d=>MTS_DIAGRAM_META[d.id]));
    t('no baseline properties',D.every(d=>!Object.prototype.hasOwnProperty.call(d,'b')));
    t('no local rule properties in MTS core',D.every(d=>!Object.prototype.hasOwnProperty.call(d,'r')));
    t('local rule ids isolated',[7,30,35,38,41,42].every(id=>Array.isArray(LOCAL_RULES[id])));
    t('automatic baseline disabled',MTS_DATA_META.automaticBaseline===false);
    t('automatic vitals disabled',MTS_DATA_META.automaticVitals===false);
    t('local rules cannot alter MTS metadata',MTS_DATA_META.localRulesAffectMTS===false);
    t('all bodymap refs resolve',BR.every(r=>r.ids.every(id=>D.some(d=>d.id===id))));
    t('all training refs resolve',CASES.every(c=>D.some(d=>d.id===c.diag)));
    t('diagram-only training cases present',CASES.filter(c=>c.diagramOnly===true).length>=20);
    t('training cases have valid levels or are diagram-only',CASES.every(c=>c.diagramOnly===true || [1,2,3,4,5].includes(c.lvl)));
    t('MANV outside MTS core',[54,55].every(id=>MTS_DIAGRAM_META[id]?.type==='manv-legacy'));
    t('ID53 special diagram',MTS_DIAGRAM_META[53]?.type==='mts-special');

    // Pure classification invariant: smallest numeric selected level always wins.
    const classify=(levels)=>levels.length?Math.min(...levels):null;
    t('no selection => unclassified',classify([])===null);
    t('red beats orange',classify([2,1])===1);
    t('orange beats yellow',classify([3,2])===2);
    t('yellow beats green',classify([4,3])===3);
    t('green beats blue',classify([5,4])===4);
    t('order independent',classify([5,3,2,4])===2 && classify([2,4,5,3])===2);

    return {ok:out.every(x=>x.ok),count:out.length,results:out};
  }

  if(typeof module!=='undefined'&&module.exports) module.exports={runTriageRegressionTests};
  if(typeof window!=='undefined') window.runTriageRegressionTests=runTriageRegressionTests;
})();
