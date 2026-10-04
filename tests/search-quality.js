/* Search quality regression cases.
 * Expected diagram must appear in the first three suggestions.
 */
const SEARCH_QUALITY_CASES = Object.freeze([
  ["schmerzen fuß",17],["fuß tut weh",17],["schwellung sprunggelenk",17],["hand schmerzen",17],
  ["knie dick schmerz",17],["schulter ausgekugelt",17],["zeh verletzt",17],["taubes bein",17],
  ["kopfplatzwunde",30],["kopf gestoßen",30],["kopfschmerz nach sturz",30],["gehirnerschütterung",30],
  ["körperverletzung",5],["geschlagen worden",5],["faustschlag",5],["häusliche gewalt",5],
  ["atemnot",7],["keine luft",7],["kurzatmigkeit",7],["atemnot kind",8],
  ["brustschmerz",42],["druck auf der brust",42],["herzrasen",23],["herzstolpern",23],
  ["halbseitenlähmung",29],["sprachstörung",29],["mundwinkel hängt",29],["plötzlicher kopfschmerz",29],
  ["bauchschmerz",1],["rechter unterbauch",1],["erbrechen durchfall",16],["teerstuhl",19],
  ["flankenschmerz",48],["blut im urin",48],["harnverhalt",48],["hodenschmerz",25],
  ["schnittwunde hand",51],["klaffende wunde",51],["hundebiss",13],["verbrennung hand",50],
  ["baby trinkt nicht",46],["fieber baby",46],["kind atemnot",8],["baby schreit",36],
  ["suizidgedanken",34],["selbstverletzung",39],["psychose",34],["panikattacke",34],
  ["auge fremdkörper",10],["plötzlicher sehverlust",10],["ohrenschmerz",33],["zahnschmerz",52]
]);

function runSearchQualityTests(ctx){
  const {D,SEARCH_ALIASES,SEARCH_BODY_RULES,SEARCH_SYMPTOM_RULES,rankSearchResults}=ctx;
  const results=SEARCH_QUALITY_CASES.map(([query,expected])=>{
    const ranked=rankSearchResults(query,D,SEARCH_ALIASES,SEARCH_BODY_RULES,SEARCH_SYMPTOM_RULES);
    const top3=ranked.slice(0,3).map(x=>x.id);
    return {query,expected,top3,ok:top3.includes(expected)};
  });
  const passed=results.filter(x=>x.ok).length;
  return {ok:passed===results.length,count:results.length,passed,results};
}
if(typeof module!=='undefined'&&module.exports)module.exports={SEARCH_QUALITY_CASES,runSearchQualityTests};
if(typeof globalThis!=='undefined')Object.assign(globalThis,{SEARCH_QUALITY_CASES,runSearchQualityTests});
