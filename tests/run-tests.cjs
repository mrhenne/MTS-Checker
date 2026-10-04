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
