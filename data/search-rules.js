/* Semantic complaint search rules.
 * Navigation aid only. These rules suggest presentation diagrams and never set urgency.
 */
const SEARCH_BODY_RULES = Object.freeze([
  {terms:["fuß","fuss","zeh","zehen","ferse","sprunggelenk","knöchel"],ids:[17,51,41],label:"Fuß / Sprunggelenk"},
  {terms:["bein","oberschenkel","unterschenkel","knie","wade","hüfte"],ids:[17,41,51],label:"Bein / Hüfte"},
  {terms:["arm","oberarm","unterarm","ellenbogen","ellbogen","schulter","hand","finger","daumen"],ids:[17,51],label:"Arm / Hand"},
  {terms:["kopf","stirn","schädel","hinterkopf"],ids:[30,29,51,41],label:"Kopf"},
  {terms:["gesicht","nase","kiefer","wange","lippe"],ids:[20,51,52],label:"Gesicht"},
  {terms:["auge","augen"],ids:[10,18,20],label:"Auge"},
  {terms:["ohr","ohren"],ids:[33,18,20],label:"Ohr"},
  {terms:["hals","rachen","kehle"],ids:[21,4,18],label:"Hals / Rachen"},
  {terms:["nacken","hws"],ids:[32,35,30],label:"Nacken / HWS"},
  {terms:["rücken","ruecken","lws","wirbelsäule","wirbelsaeule"],ids:[35,27],label:"Rücken"},
  {terms:["brust","thorax","brustkorb"],ids:[42,7,27],label:"Thorax"},
  {terms:["bauch","abdomen","magen","oberbauch","unterbauch"],ids:[1,16,19,48,49],label:"Abdomen"},
  {terms:["flanke","niere","nieren"],ids:[48,35,1],label:"Flanke / Niere"},
  {terms:["hoden","testikel"],ids:[25,48],label:"Hoden"},
  {terms:["haut"],ids:[22,3,51],label:"Haut"}
]);

const SEARCH_SYMPTOM_RULES = Object.freeze({
  pain:["schmerz","schmerzen","weh","wehtun","beschwerden","druckschmerz","ziehen","stechen"],
  wound:["wunde","platzwunde","schnitt","schnittwunde","riss","risswunde","blutet","blutung","offen"],
  trauma:["sturz","gestürzt","gestuerzt","unfall","verletzung","angeschlagen","gestoßen","gestossen","umgeknickt"],
  swelling:["schwellung","geschwollen","dick","ödem","oedem"],
  numbness:["taub","taubheit","kribbeln","gefühllos","gefuehllos"],
  weakness:["schwäche","schwaeche","kraftlos","kraftverlust"],
  fever:["fieber","temperatur","schüttelfrost","schuettelfrost"]
});
