const fs = require('fs');
const vm = require('vm');

function read(path){ return fs.readFileSync(path,'utf8'); }

const sandbox={console,module:{exports:{}},exports:{}};
vm.createContext(sandbox);

for(const path of [
  'data/mts-data.js',
  'data/clinical-addons.js',
  'data/training-cases.js',
  'data/local-sop.js',
  'data/search-aliases.js',
  'data/search-rules.js',
  'data/search-engine.js',
  'tests/triage-regression.js',
  'tests/search-quality.js'
]){
  vm.runInContext(read(path),sandbox,{filename:path});
}

const regression = sandbox.module.exports.runTriageRegressionTests || sandbox.runTriageRegressionTests;
if(typeof regression!=='function') throw new Error('Regression runner not exported');

const expose = vm.runInContext('({D,GI,LV,BR,CASES,LOCAL_RULES,MTS_DATA_META,MTS_DIAGRAM_META})',sandbox);
const result=regression(expose);
const searchQuality=sandbox.module.exports.runSearchQualityTests || sandbox.runSearchQualityTests;
const searchCtx=vm.runInContext('({D,SEARCH_ALIASES,SEARCH_BODY_RULES,SEARCH_SYMPTOM_RULES,rankSearchResults})',sandbox);
const searchResult=searchQuality(searchCtx);
for(const test of result.results){
  console.log((test.ok?'PASS':'FAIL')+'  '+test.name+(test.detail?' :: '+test.detail:''));
}
if(!result.ok){
  console.error('\n'+result.results.filter(x=>!x.ok).length+' regression test(s) failed.');
  process.exit(1);
}
console.log('\nAll '+result.count+' regression tests passed.');
for(const test of searchResult.results){
  console.log((test.ok?'PASS':'FAIL')+'  search: '+test.query+' -> '+test.top3.join(','));
}
if(!searchResult.ok){
  console.error('\n'+(searchResult.count-searchResult.passed)+' search quality test(s) failed.');
  process.exit(1);
}
console.log('\nAll '+searchResult.count+' search quality tests passed.');

const appSource=read('js/app.js');
const cssSource=read('css/app.css');
function assertUi(name,ok){
  console.log((ok?'PASS':'FAIL')+'  ui: '+name);
  if(!ok)process.exitCode=1;
}
assertUi('vital segment helper',appSource.includes('function vitalSegmentButton'));
assertUi('SpO2 clickable bands',appSource.includes('92–94 % · Gelb')&&appSource.includes('<92 % · Orange'));
assertUi('temperature clickable bands',appSource.includes('37,5–38,4 · Grün')&&appSource.includes('38,5–40,9 · Gelb'));
assertUi('NRS clickable bands',appSource.includes('1–3 · Grün')&&appSource.includes('7–10 · Orange'));
assertUi('clinical GCS cards',appSource.includes('Bewusstsein verändert')&&appSource.includes('Nicht ansprechbar'));
assertUi('vital grid responsive',cssSource.includes('.vital-grid-modern')&&cssSource.includes('.vital-segment-bar'));
if(process.exitCode)process.exit(1);
