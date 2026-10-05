/* TriageAssist V2
 * Medical/reference data separated from application logic.
 * Validation status: see AUDIT_V2.md.
 * Do not edit clinical content without documented review.
 */

const MTS_DATA_META = Object.freeze({
  referenceBasis: "Deutsche MTS Ausgabe 2025 / Third Edition v3.8 – vollständige lizenzierte Detailprüfung ausstehend",
  status: "validation",
  reviewedOn: "2026-10-04",
  automaticVitals: false,
  automaticBaseline: false,
  localRulesAffectMTS: false
});

const MTS_DIAGRAM_META = Object.freeze(Object.fromEntries(
  Array.from({length:55},(_,i)=>{
    const id=i+1;
    if(id<=52) return [id,{type:"mts-presentation",status:"needs-full-reference"}];
    if(id===53) return [id,{type:"mts-special",status:"needs-full-reference"}];
    return [id,{type:"manv-legacy",status:"not-mts-core"}];
  })
));

const GI = {
  1: ["Atemweg verlegt", "Inadäquate Atmung", "Schock / Kreislaufkollaps", "Aktueller Krampfanfall", "Nicht ansprechbares Kind", "Hypoglykämie"],
  2: ["Gefährdeter Atemweg", "Schwere Blutung", "Veränderter Bewusstseinszustand", "Kind reagiert nur auf Ansprache oder Schmerz", "Sehr heißer Erwachsener (≥ 41°C)", "Kalter Erwachsener (< 35°C)", "Starke Schmerzen (NRS 7 bis 10)"],
  3: ["Unstillbare kleine Blutung", "Bericht über Bewusstlosigkeit", "Heißer Erwachsener (≥ 38,5 bis < 41°C)", "Mäßige Schmerzen (NRS 4 bis 6)", "Abnormer Puls"],
  4: ["Warmer Patient (≥ 37,5 bis < 38,5°C)", "Leichte Schmerzen (NRS 1 bis 3)", "Kürzliches Erbrechen"],
  5: ["Keine akuten Symptome"]
};

const pedsV = {
  '0': 'HF 100 bis 160 | AF 30 bis 60 | RR syst > 60',
  '1': 'HF 90 bis 150 | AF 24 bis 40 | RR syst > 70',
  '2': 'HF 80 bis 140 | AF 22 bis 34 | RR syst > 75',
  '3': 'HF 70 bis 120 | AF 18 bis 30 | RR syst > 80',
  '4': 'HF 60 bis 100 | AF 12 bis 20 | RR syst > 90'
};

const pedsW = {
  '0': 'ca. 3,5 kg',
  '1': '4 bis 10 kg',
  '2': '10 bis 16 kg (APLS: Alter × 2 + 8)',
  '3': '18 bis 40 kg (APLS: Alter × 3 + 7)',
  '4': '> 40 kg'
};

const D=[
{id:1, name:"Abdominelle Schmerzen bei Erwachsenen", c:"Abdominell", kw:["bauch", "magen", "kolik", "bauchschmerz", "appendizitis", "blinddarm", "gallenkolik", "divertikulitis", "ileus", "oberbauch", "unterbauch", "peritonismus", "abwehrspannung", "akutes abdomen"], i:{2:["Akutes Erbrechen von Blut", "Teerstuhl", "Verdacht auf Aortenaneurysma"], 3:["Schmerz strahlt in Rücken aus", "Gürtelförmiger Schmerz", "Anhaltendes Erbrechen"], 4:["Schmerz bei Bewegung"]}},
{id:2, name:"Abdominelle Schmerzen bei Kindern", c:"Pädiatrisch", kw:["bauch kind", "erbrechen", "bauchweh", "invagination", "dreimonatskolik", "säugling bauch"], i:{2:["Gallenfarbiges Erbrechen", "Verdacht auf Invagination", "Rote Geleestühle"], 3:["Anhaltendes Erbrechen", "Trinkschwäche"]}},
{id:3, name:"Abszesse und lokale Infektionen", c:"Chirurgisch", kw:["abszess", "eiter", "furunkel", "karbunkel", "phlegmone", "panaritium", "eiterbeule", "entzündung", "rötung", "schwellung", "überhitzt", "pilonidal"], i:{3:["Ausbreitende Rötung", "Fieber bei Abwehrschwäche"], 4:["Lokale Rötung und Schwellung"]}},
{id:4, name:"Allergie", c:"Allgemein", kw:["allergisch", "anaphylaxie", "urtikaria", "wespe", "biene", "insektenstich", "nussallergie", "quincke", "angioödem", "nesselsucht", "juckreiz", "ausschlag", "penicillin"], i:{2:["Stridor", "Lippenschwellung", "Zungenschwellung"], 3:["Ausgedehnter Hautausschlag"], 4:["Lokaler Juckreiz"]}},
{id:5, name:"Angriff Zustand nach", c:"Trauma", kw:["gewalt", "schlägerei", "überfall", "messerstich", "schusswunde", "trauma", "häusliche gewalt", "opfer"], i:{2:["Stark blutende Wunde", "Neurologisches Defizit"], 3:["Kopfverletzung", "Anhaltende Blutung"]}},
{id:6, name:"Asthma", c:"Respiratorisch", kw:["asthma", "copd", "bronchospasmus", "exazerbation", "giemen", "brummen", "atemnot", "spray", "lungenemphysem", "spastik"], i:{2:["Erschöpfung", "Sehr niedrige O2-Sättigung", "Sprechunfähigkeit"], 3:["Niedrige O2-Sättigung", "Peak Flow < 50%", "Kein Ansprechen auf Inhalation"]}},
{id:7, name:"Atemproblem bei Erwachsenen", c:"Respiratorisch", kw:["atemnot", "dyspnoe", "luftnot", "lungenödem", "lungenembolie", "tachypnoe", "zyanose", "kurzatmig", "schnaufen"], i:{2:["Zyanose", "Atemhilfsmuskulatur im Einsatz", "Sehr niedrige O2-Sättigung"], 3:["Niedrige O2-Sättigung", "Atemgeräusch / Giemen", "Akuter Husten"]}},
{id:8, name:"Atemproblem bei Kindern", c:"Pädiatrisch", kw:["krupp", "stridor", "atemnot kind", "pseudokrupp", "epiglottitis", "rsv", "bronchiolitis", "nasenflügeln", "einziehungen"], i:{2:["Nasenflügeln", "Einziehungen", "Erschöpfung", "Sehr niedrige O2-Sättigung"], 3:["Niedrige O2-Sättigung", "Stridor in Ruhe", "Grunzen"]}},
{id:9, name:"Auffälliges Verhalten", c:"Psychiatrisch", kw:["aggressiv", "verwirrt", "randaliert", "psychose", "wahn", "schizophrenie", "gewalttätig", "unruhig", "delir"], i:{2:["Fremdgefährdung akut", "Eigengefährdung akut"], 3:["Agitiertheit", "Wahnvorstellungen"]}},
{id:10, name:"Augenprobleme", c:"HNO / Sinnesorgane", kw:["auge", "sehstörung", "verätzung", "blind", "visusverlust", "fremdkörper auge", "hornhaut", "konjunktivitis", "rotes auge", "blitze", "glaukom"], i:{2:["Chemische Verätzung", "Akuter Sehverlust"], 3:["Durchdringende Augenverletzung", "Starke Augenschmerzen"]}},
{id:11, name:"Besorgte Eltern", c:"Pädiatrisch", kw:["baby auffällig", "kind weint", "eltern besorgt", "bauchgefühl", "lethargisch", "trinkt nicht"], i:{2:["Nicht weckbar", "Schlaff"], 3:["Trinkt nicht", "Untröstliches Schreien"]}},
{id:12, name:"Betrunkener Eindruck", c:"Psychiatrisch", kw:["alkohol", "intox", "c2", "betrunken", "rausch", "promille", "volltrunken", "wackelig"], i:{2:["Veränderter Bewusstseinszustand"], 3:["Deutliche Intoxikationszeichen"]}},
{id:13, name:"Bisse und Stiche", c:"Trauma", kw:["biss", "zecke", "insektenstich", "hundebiss", "katzenbiss", "schlangenbiss", "tollwut", "tetanus"], i:{2:["Systemische allergische Reaktion"], 3:["Tiefe Bisswunde", "Gesichtsschwellung"]}},
{id:14, name:"Chemikalienkontakt", c:"Toxikologisch", kw:["säure", "lauge", "gefahrstoff", "chemie", "unfall", "dekontamination", "verätzung", "reinigungsmittel"], i:{2:["Systemische Toxizität", "Inhalationstrauma"], 3:["Verätzung großer Hautareale"]}},
{id:15, name:"Diabetes", c:"Internistisch", kw:["bz", "hyperglykämie", "zucker", "diabetes", "ketoazidose", "hypoglykämie", "unterzucker", "kussmaul", "durst", "polyurie"], i:{2:["Kussmaul-Atmung", "Ketoazidose", "BZ stark entgleist + Symptome"], 3:["Polyurie", "Polydipsie"]}},
{id:16, name:"Durchfälle und Erbrechen", c:"Abdominell", kw:["gastroenteritis", "norovirus", "exsikkose", "durchfall", "erbrechen", "diarrhoe", "brechdurchfall", "austrocknung"], i:{2:["Schwere Dehydratation", "Blutiges Erbrechen"], 3:["Zeichen der Dehydratation", "Anhaltendes Erbrechen"]}},
{id:17, name:"Extremitätenprobleme", c:"Trauma", kw:["arm", "bein", "fraktur", "luxation", "prellung", "distorsion", "bänderriss", "sprunggelenk", "knie", "schulter", "handgelenk", "radiusfraktur", "gips", "thrombose", "tvt"], i:{2:["Fehlstellung extrem", "Pulslosigkeit / Ischämie", "Verdacht auf Kompartmentsyndrom"], 3:["Gelenk blockiert", "Fehlstellung"]}},
{id:18, name:"Fremdkörper", c:"Allgemein", kw:["verschluckt", "aspiration", "fremdkörper", "knopfzelle", "batterie", "fischgräte", "nase", "ohr", "rektal"], i:{2:["Atemwegsgefährdung", "Batterie verschluckt"], 3:["Festsitzend im Ösophagus"]}},
{id:19, name:"Gastrointestinale Blutung", c:"Abdominell", kw:["hämatemesis", "teerstuhl", "blutung rektal", "kaffeesatzerbrechen", "meläna", "blutstuhl", "hämorrhoiden"], i:{2:["Kreislaufinstabilität", "Große Mengen Blut"], 3:["Aktives Bluterbrechen", "Meläna"]}},
{id:20, name:"Gesichtsprobleme", c:"HNO / Sinnesorgane", kw:["gesicht", "kiefer", "schwellung gesicht", "parotitis", "dicke backe", "fazialisparese", "trigeminus", "jochbein"], i:{2:["Atemwegsgefährdung durch Schwellung"], 3:["Kieferklemme", "Akute Gesichtslähmung"]}},
{id:21, name:"Halsschmerzen", c:"HNO / Sinnesorgane", kw:["angina", "schluckbeschwerden", "halsschmerz", "tonsillitis", "peritonsillarabszess", "mandeln", "heiserkeit", "globusgefühl"], i:{2:["Stridor", "Speicheln / Unfähigkeit zu schlucken"], 3:["Kieferklemme", "Starke Schluckschmerzen"]}},
{id:22, name:"Hautausschläge", c:"Dermatologisch", kw:["exanthem", "petechien", "rash", "ausschlag", "masern", "röteln", "windpocken", "scharlach", "zoster", "gürtelrose", "erythem"], i:{2:["Petechien + Fieber", "Atemwegsmitbeteiligung"], 3:["Blasenbildung großflächig"]}},
{id:23, name:"Herzklopfen", c:"Kardiologisch", kw:["palpitationen", "tachykardie", "rhythmus", "herzrasen", "herzstolpern", "vorhofflimmern", "bradykardie", "extrasystolen"], i:{2:["Synkope", "Thoraxschmerz", "HF > 150"], 3:["Neues Vorhofflimmern", "Schwindel"]}},
{id:24, name:"Hinkendes Kind", c:"Pädiatrisch", kw:["kind hinkt", "gelenkschmerz kind", "hüftschnupfen", "coxitis", "epiphyseolyse"], i:{2:["Neurologisches Defizit"], 3:["Fieber", "Gelenk überwärmt", "Entlastungshinken"]}},
{id:25, name:"Hodenschmerz", c:"Urologisch", kw:["hoden", "torsion", "skrotum", "epididymitis", "orchitis", "hodenschwellung", "leiste"], i:{2:["Verdacht auf Hodentorsion", "Ausstrahlung in Leiste akut"], 3:["Akute Schwellung"]}},
{id:26, name:"Irritables oder unruhiges Kind", c:"Pädiatrisch", kw:["kind schreit", "fontanelle", "untröstlich", "irritiert", "meningitis kind"], i:{2:["Nicht weckbar", "Petechien"], 3:["Vorgewölbte Fontanelle", "Untröstlich"]}},
{id:27, name:"Körperstammverletzung", c:"Trauma", kw:["stumpfes trauma", "gurtprellung", "thoraxkompression", "beckenfraktur", "sturz höhe", "rippen"], i:{2:["Penetrierende Verletzung", "Atemnot", "Hypotonie"], 3:["Sichtbares Hämatom groß"]}},
{id:28, name:"Kollaps", c:"Neurologisch", kw:["synkope", "ohnmacht", "bewusstlos", "kollaps", "vasovagal", "umgekippt", "blackout"], i:{2:["Veränderter Bewusstseinszustand", "Begleitender Thoraxschmerz"], 3:["Ohne Warnsymptome", "Verletzung durch Sturz"]}},
{id:29, name:"Kopfschmerz", c:"Neurologisch", kw:["migräne", "cephalgie", "donnerschlag", "kopfschmerz", "cluster", "spannungskopfschmerz", "sab", "blutung", "aura"], i:{2:["Donnerschlagkopfschmerz", "Meningismus", "Neues neurologisches Defizit"], 3:["Fieber", "Schlimmster Schmerz aller Zeiten"]}},
{id:30, name:"Kopfverletzung", c:"Trauma", kw:["sht", "platzwunde kopf", "sturz kopf", "commotio", "gehirnerschütterung", "schädelbruch", "amnesie"], i:{2:["Veränderter Bewusstseinszustand", "Offene Schädelverletzung", "Fokalneurologie"], 3:["Amnesie", "Erbrechen nach Trauma"]}},
{id:31, name:"Krampfanfall", c:"Neurologisch", kw:["epilepsie", "konvulsion", "krampf", "anfall", "status epilepticus", "grand mal", "fieberkrampf"], i:{1:["Status epilepticus (> 5 Min)"], 2:["Erstanfall", "Postiktale Bewusstseinsstörung"], 3:["Bekannte Epilepsie, jetzt wach"]}},
{id:32, name:"Nackenschmerz", c:"Trauma", kw:["hws", "schleudertrauma", "nackensteife", "torticollis", "zervikalsyndrom", "blockade"], i:{2:["Meningismus", "Neues neurologisches Defizit"], 3:["Traumaanamnese", "Fieber"]}},
{id:33, name:"Ohrenprobleme", c:"HNO / Sinnesorgane", kw:["otitis", "hörsturz", "tinnitus", "ohrenschmerz", "mittelohrentzündung", "mastoiditis", "schwindel"], i:{2:["Plötzlicher kompletter Hörverlust"], 3:["Schwellung hinter dem Ohr (Mastoiditis)"]}},
{id:34, name:"Psychische Erkrankung", c:"Psychiatrisch", kw:["suizid", "psychose", "panik", "depression", "angst", "borderline", "schizophrenie", "schnittwunden"], i:{2:["Akute Suizidalität", "Eigen-/Fremdgefährdung"], 3:["Agitiertheit", "Schwere Depression"]}},
{id:35, name:"Rückenschmerz", c:"Orthopädisch", kw:["lws", "bandscheibe", "ischias", "hexenschuss", "lumbago", "cauda equina", "rücken", "radikulär", "ausstrahlung"], i:{2:["Verdacht auf Aortenaneurysma", "Harnverhalt / Cauda Equina", "Neurologisches Defizit akut"], 3:["Fieber"]}},
{id:36, name:"Schreiendes Baby", c:"Pädiatrisch", kw:["baby schreit", "untröstlich", "schreibaby", "kolik"], i:{2:["Trinkt gar nicht", "Schlaff"], 3:["Fieber", "Vorgewölbte Fontanelle"]}},
{id:37, name:"Schwangerschaftsproblem", c:"Gynäkologisch", kw:["wehen", "blutung schwanger", "eklampsie", "hellp", "präeklampsie", "blasensprung", "abort", "fehlgeburt"], i:{2:["Krämpfe", "Starke Blutung", "Kindsbewegungen fehlend"], 3:["Vorzeitige Wehen", "Blasensprung"]}},
{id:38, name:"Schweres Trauma", c:"Trauma", kw:["polytrauma", "vu", "schwer verletzt", "einklemmung", "verkehrsunfall", "schockraum"], i:{1:["Massive Blutung", "Atemweg verlegt"], 2:["Penetrierende Verletzung Rumpf", "Einklemmung", "Veränderter Bewusstseinszustand"]}},
{id:39, name:"Selbstverletzung", c:"Psychiatrisch", kw:["ritzen", "suizidversuch", "autoaggression", "tabletten"], i:{2:["Arterielle Blutung", "Toxische Einnahme", "Veränderter Bewusstseinszustand"], 3:["Anhaltende Blutung", "Akute psychotische Krise"]}},
{id:40, name:"Sexualinfektion", c:"Allgemein", kw:["sti", "tripper", "genital", "gonorrhoe", "chlamydien", "lues", "syphilis", "ausfluss", "herpes genitalis"], i:{3:["Akuter purulenter Ausfluss", "Fieber"]}},
{id:41, name:"Stürze", c:"Trauma", kw:["gestürzt", "prellung", "sturz", "gefallen", "fahrradsturz", "e-scooter", "treppe", "leiter"], i:{2:["Veränderter Bewusstseinszustand", "Fehlstellung große Knochen"], 3:["Frakturverdacht"]}},
{id:42, name:"Thoraxschmerz", c:"Kardiologisch", kw:["brustschmerz", "acs", "infarkt", "stemi", "nstemi", "angina pectoris", "thoraxschmerz", "engegefühl", "brennen brust", "aorte"], i:{1:["Reißender Schmerz in den Rücken (Aorta)"], 2:["Kaltschweißigkeit", "Atemnot", "Ausstrahlung in Arm/Kiefer"], 3:["Atemabhängiger Schmerz", "Verdacht Lungenembolie"]}},
{id:43, name:"Überdosierung und Vergiftung", c:"Toxikologisch", kw:["intoxikation", "drogen", "überdosis", "alkohol", "tabletten", "paracetamol", "opiate", "kokain", "gift"], i:{2:["Veränderter Bewusstseinszustand", "Atemdepression", "Krampfanfall"], 3:["Gezielte suizidale Einnahme", "Gefährliche Substanz"]}},
{id:44, name:"Unwohlsein bei Erwachsenen", c:"Allgemein", kw:["schwäche", "az verschlechterung", "schlapp", "unwohlsein", "fieber", "schwindel", "blass", "pflegefall"], i:{2:["Schockzeichen", "Veränderter Bewusstseinszustand"], 3:["Fieber bei Abwehrschwäche", "Petechien"]}},
{id:45, name:"Unwohlsein bei Kindern", c:"Pädiatrisch", kw:["kind krank", "schlapp", "lethargisch", "apathisch", "trinkschwäche", "fieber kind"], i:{2:["Schlaff", "Nicht weckbar", "Petechien"], 3:["Fieber", "Trinkschwäche"]}},
{id:46, name:"Unwohlsein bei Neugeborenen", c:"Pädiatrisch", kw:["neugeborenes", "ikterus", "gelbsucht", "trinkschwäche", "apathisch", "anpassungsstörung"], i:{2:["Krampfanfall", "Temperatur > 38°C", "Apnoe"], 3:["Trinkt nicht", "Auffälliger Ikterus"]}},
{id:47, name:"Unwohlsein bei Säuglingen", c:"Pädiatrisch", kw:["säugling", "apathisch", "trinkt schlecht", "fieber", "dehydriert"], i:{2:["Schlaff", "Fieber + Petechien"], 3:["Trinkt schlecht", "Fieber"]}},
{id:48, name:"Urologisches Problem", c:"Urologisch", kw:["harnverhalt", "nierenkolik", "hwi", "blasenentzündung", "dysurie", "makrohämaturie", "flanke", "stein", "katheter"], i:{2:["Harnverhalt akut + starke Schmerzen", "Anurie"], 3:["Fieber", "Starke Flankenschmerzen"]}},
{id:49, name:"Vaginale Blutung", c:"Gynäkologisch", kw:["blutung", "unterleib", "abort", "vagina", "periode", "menorrhagie", "eug"], i:{2:["Kreislaufinstabilität", "Starke unstillbare Blutung", "Verdacht auf EUG"], 3:["Schwangerschaft", "Mäßige Blutung"]}},
{id:50, name:"Verbrennungen und Verbrühungen", c:"Trauma", kw:["verbrennung", "hitze", "feuer", "verbrühung", "stromschlag", "blitz", "kochendes wasser", "sonnenbrand"], i:{1:["Inhalationstrauma + Atemnot"], 2:["KOF > 15%", "Beteiligung Gesicht/Atemwege"], 3:["KOF > 5% (Kind) / > 10% (Erw)"]}},
{id:51, name:"Wunden", c:"Chirurgisch", kw:["schnittwunde", "platzwunde", "risswunde", "stichwunde", "schürfwunde", "blutung", "naht", "amputation"], i:{2:["Arterielle spritzende Blutung", "Neurologisches Ausfall"], 3:["Anhaltende venöse Blutung", "Verdacht auf Gelenkeröffnung"]}},
{id:52, name:"Zahnprobleme", c:"HNO / Sinnesorgane", kw:["zahnschmerz", "karies", "zahn trauma", "dicke backe", "abszess zahn", "kiefer", "zahnfleisch"], i:{2:["Atemwegsverlegung durch Blutung", "Zahnverlust + Blutung"], 3:["Schwellung breitet sich auf Hals aus", "Kieferklemme"]}},
{id:53, name:"Generelle Indikatoren", c:"Allgemein", kw:["allgemein", "vitalzeichen", "blutdruck", "puls", "fieber"], i:{}},
{id:54, name:"Massenanfall primäres Diagramm", c:"Spezial", kw:["manv", "sichtung", "start", "katastrophe", "massenanfall"], i:{1:["Geht nicht, atmet nicht normal", "Stark blutend"], 2:["Geht nicht, atmet normal, Perfusionszeichen negativ"], 3:["Geht nicht, atmet normal, Perfusionszeichen positiv", "Geht, aber schwer verletzt"], 4:["Geht, leicht verletzt"]}},
{id:55, name:"Massenanfall sekundäres Diagramm", c:"Spezial", kw:["manv sekundär", "triage", "rettungsdienst"], i:{1:["GCS < 12", "AF < 10 oder > 29", "RR syst < 90"], 2:["Isolierte schwere Verletzung", "Stabile Fraktur große Knochen"], 3:["Stabile Vitalparameter", "Leichte Wunden"]}}
];

const CATS=[...new Set(D.map(x=>x.c))].sort();
const LV=[{l:1,n:"Sofort",t:"0 Min",r:"Keine",d:"Unmittelbare Lebensgefahr. Sofortige Behandlung."},{l:2,n:"Sehr dringend",t:"≤ 10 Min",r:"10 Min",d:"Potenziell lebensbedrohlich. ACS, Schlaganfall, Anaphylaxie."},{l:3,n:"Dringend",t:"≤ 30 Min",r:"30 Min",d:"Starke Schmerzen, hohes Fieber und reduzierter Allgemeinzustand."},{l:4,n:"Normal",t:"≤ 90 Min",r:"60 Min",d:"Mäßige Schmerzen, leichtes Fieber, kleine Wunde."},{l:5,n:"Nicht dringend",t:"≤ 120 Min",r:"120 Min",d:"Chronische Beschwerden, Bagatelleverletzung."}];
const BR=[
  {k:'head',n:'Kopf / Neurologie',icon:'fa-brain',ids:[10,20,21,29,30,31,33,52,28]},
  {k:'chest',n:'Thorax / Lunge',icon:'fa-heart-pulse',ids:[6,7,8,23,42]},
  {k:'abdomen',n:'Abdomen',icon:'fa-lungs',ids:[1,2,16,19]},
  {k:'pelvis',n:'Becken / Uro',icon:'fa-restroom',ids:[25,37,40,48,49]},
  {k:'arm_l',n:'Linker Arm',icon:'fa-hand',ids:[17,24]},
  {k:'arm_r',n:'Rechter Arm',icon:'fa-hand',ids:[17,24]},
  {k:'leg_l',n:'Linkes Bein',icon:'fa-shoe-prints',ids:[17,24]},
  {k:'leg_r',n:'Rechtes Bein',icon:'fa-shoe-prints',ids:[17,24]},
  {k:'neck_back',n:'HWS / Nacken',icon:'fa-wave-square',ids:[32,35]},
  {k:'back_upper',n:'Oberer Rücken',icon:'fa-wave-square',ids:[27,35]},
  {k:'back_lower',n:'Unterer Rücken',icon:'fa-wave-square',ids:[27,35]},
  {k:'skin',n:'Haut / Wunden',icon:'fa-band-aid',ids:[3,4,13,14,22,50,51]},
  {k:'psych',n:'Psych / Päd',icon:'fa-puzzle-piece',ids:[9,11,12,26,34,36,39]}
];
const CS=[
  {t:"Sofort · Rot",i:["Atemstillstand / unzureichende Atmung","Kreislaufstillstand / Schock","Aktueller Krampfanfall","Nicht ansprechbares Kind","Lebensbedrohliche Blutung"]},
  {t:"Sehr dringend · Orange",i:["Veränderter Bewusstseinszustand beim Erwachsenen","Kind reagiert nur auf Ansprache oder Schmerz","Sehr niedrige O2-Sättigung","Sehr heißer Erwachsener ≥ 41°C","Kalter Erwachsener < 35°C","Starke Schmerzen NRS 7 bis 10"]},
  {t:"Dringend · Gelb",i:["Bericht über Bewusstlosigkeit","Niedrige O2-Sättigung","Heißer Erwachsener ≥ 38,5 bis < 41°C","Mäßige Schmerzen NRS 4 bis 6","Unstillbare kleinere Blutung"]},
  {t:"Normal · Grün",i:["Warmer Patient ≥ 37,5 bis < 38,5°C","Leichte Schmerzen NRS 1 bis 3","Kürzliches Erbrechen"]},
  {t:"SpO₂ Definitionen",i:["Raumluft: < 92% = sehr niedrig / Orange","Raumluft: 92–94% = niedrig / Gelb","Unter laufender O₂-Gabe: < 95% = sehr niedrig / Orange","≥ 95% = kein O₂-Sättigungs-Diskriminator"]},
  {t:"Bewusstsein Erwachsene",i:["MTS bewertet den klinischen Bewusstseinszustand, nicht eine pauschale GCS-Rot-Grenze","Nicht ansprechbar bzw. Reaktion nur auf Schmerz oder Ansprache = Orange","Anhaltender Krampfanfall = Rot","Bericht über Bewusstlosigkeit = Gelb"]},
  {t:"Temperatur Erwachsene",i:["< 35°C = Kalt / Orange","37,5–38,4°C = Warm / Grün","38,5–40,9°C = Heiß / Gelb","≥ 41°C = Sehr heiß / Orange","35,0–37,4°C = kein Temperatur-Diskriminator"]},
  {t:"Pädiatrie",i:["Nicht ansprechbares Kind = Rot","Reaktion nur auf Ansprache oder Schmerz = Orange","Temperaturindikatoren sind alters-/diagrammabhängig","qSOFA ist unter 14 Jahren nicht valide"]}
];
