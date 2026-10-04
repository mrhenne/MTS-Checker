/* TriageAssist V2
 * Medical/reference data separated from application logic.
 * Validation status: see AUDIT_V2.md.
 * Do not edit clinical content without documented review.
 */

const GI = {
  1: ["Atemweg verlegt", "Inadäquate Atmung", "Schock / Kreislaufkollaps", "Aktueller Krampfanfall", "Hypoglykämie"],
  2: ["Gefährdeter Atemweg", "Schwere Blutung", "Veränderter Bewusstseinszustand", "Temperatur > 41°C"],
  3: ["Unstillbare kleine Blutung", "Starke Schmerzen (NRS 8 bis 10)", "Abnormer Puls"],
  4: ["Mäßige Schmerzen (NRS 5 bis 7)", "Kürzliches Erbrechen", "Warmer Patient"],
  5: ["Leichte Schmerzen (NRS 1 bis 4)", "Keine akuten Symptome"]
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

const TOX = [
  {n:"Opiate / Opioide", s:"Miosis, Atemdepression, Koma, Bradykardie", a:"Naloxon (0,4 mg i.v., ggf. Titration)"},
  {n:"Benzodiazepine", s:"Somnolenz, Ataxie, Hypotonie, Dysarthrie", a:"Flumazenil (0,2 mg i.v., Achtung Krampfgefahr!)"},
  {n:"Trizyklische Antidepressiva", s:"Mydriasis, Tachykardie, QRS > 100ms, Krampf, Koma", a:"Natriumbicarbonat (bei QRS Verbreiterung)"},
  {n:"Paracetamol", s:"Initiale Übelkeit, nach 24h Leberschaden, Ikterus", a:"Acetylcystein (ACC) nach Rumack Matthew Nomogramm"},
  {n:"Kokain / Amphetamine", s:"Mydriasis, Tachykardie, Hypertonie, Agitation", a:"Benzodiazepine (Diazepam/Midazolam i.v., KEINE Betablocker!)"},
  {n:"Beta-Blocker", s:"Bradykardie, Hypotonie, Hypoglykämie, Bronchospasmus", a:"Glukagon i.v., hochdosiertes Insulin"}
];

const D=[
{id:1, name:"Abdominelle Schmerzen bei Erwachsenen", c:"Abdominell", kw:["bauch", "magen", "kolik", "bauchschmerz", "appendizitis", "blinddarm", "gallenkolik", "divertikulitis", "ileus", "oberbauch", "unterbauch", "peritonismus", "abwehrspannung", "akutes abdomen"], i:{2:["Akutes Erbrechen von Blut", "Teerstuhl", "Verdacht auf Aortenaneurysma"], 3:["Schmerz strahlt in Rücken aus", "Gürtelförmiger Schmerz", "Anhaltendes Erbrechen"], 4:["Schmerz bei Bewegung"]}, b:5},
{id:2, name:"Abdominelle Schmerzen bei Kindern", c:"Pädiatrisch", kw:["bauch kind", "erbrechen", "bauchweh", "invagination", "dreimonatskolik", "säugling bauch"], i:{2:["Gallenfarbiges Erbrechen", "Verdacht auf Invagination", "Rote Geleestühle"], 3:["Anhaltendes Erbrechen", "Trinkschwäche"]}, b:5},
{id:3, name:"Abszesse und lokale Infektionen", c:"Chirurgisch", kw:["abszess", "eiter", "furunkel", "karbunkel", "phlegmone", "panaritium", "eiterbeule", "entzündung", "rötung", "schwellung", "überhitzt", "pilonidal"], i:{3:["Ausbreitende Rötung", "Fieber bei Abwehrschwäche"], 4:["Lokale Rötung und Schwellung"]}, b:5},
{id:4, name:"Allergie", c:"Allgemein", kw:["allergisch", "anaphylaxie", "urtikaria", "wespe", "biene", "insektenstich", "nussallergie", "quincke", "angioödem", "nesselsucht", "juckreiz", "ausschlag", "penicillin"], i:{2:["Stridor", "Lippenschwellung", "Zungenschwellung"], 3:["Ausgedehnter Hautausschlag"], 4:["Lokaler Juckreiz"]}, b:5},
{id:5, name:"Angriff Zustand nach", c:"Trauma", kw:["gewalt", "schlägerei", "überfall", "messerstich", "schusswunde", "trauma", "häusliche gewalt", "opfer"], i:{2:["Stark blutende Wunde", "Neurologisches Defizit"], 3:["Kopfverletzung", "Anhaltende Blutung"]}, b:5},
{id:6, name:"Asthma", c:"Respiratorisch", kw:["asthma", "copd", "bronchospasmus", "exazerbation", "giemen", "brummen", "atemnot", "spray", "lungenemphysem", "spastik"], i:{2:["Erschöpfung", "SpO2 < 92%", "Sprechunfähigkeit"], 3:["Peak Flow < 50%", "Kein Ansprechen auf Inhalation"]}, b:5},
{id:7, name:"Atemproblem bei Erwachsenen", c:"Respiratorisch", kw:["atemnot", "dyspnoe", "luftnot", "lungenödem", "lungenembolie", "tachypnoe", "zyanose", "kurzatmig", "schnaufen"], i:{2:["Zyanose", "Atemhilfsmuskulatur im Einsatz", "SpO2 < 92%"], 3:["Atemgeräusch / Giemen", "Akuter Husten"]}, b:5, r:[{l:"Belastungsdyspnoe", v:2, t:"Mindestens Gelb, eher Orange prüfen"}]},
{id:8, name:"Atemproblem bei Kindern", c:"Pädiatrisch", kw:["krupp", "stridor", "atemnot kind", "pseudokrupp", "epiglottitis", "rsv", "bronchiolitis", "nasenflügeln", "einziehungen"], i:{2:["Nasenflügeln", "Einziehungen", "Erschöpfung", "SpO2 < 92%"], 3:["Stridor in Ruhe", "Grunzen"]}, b:5},
{id:9, name:"Auffälliges Verhalten", c:"Psychiatrisch", kw:["aggressiv", "verwirrt", "randaliert", "psychose", "wahn", "schizophrenie", "gewalttätig", "unruhig", "delir"], i:{2:["Fremdgefährdung akut", "Eigengefährdung akut"], 3:["Agitiertheit", "Wahnvorstellungen"]}, b:5},
{id:10, name:"Augenprobleme", c:"HNO / Sinnesorgane", kw:["auge", "sehstörung", "verätzung", "blind", "visusverlust", "fremdkörper auge", "hornhaut", "konjunktivitis", "rotes auge", "blitze", "glaukom"], i:{2:["Chemische Verätzung", "Akuter Sehverlust"], 3:["Durchdringende Augenverletzung", "Starke Augenschmerzen"]}, b:5},
{id:11, name:"Besorgte Eltern", c:"Pädiatrisch", kw:["baby auffällig", "kind weint", "eltern besorgt", "bauchgefühl", "lethargisch", "trinkt nicht"], i:{2:["Nicht weckbar", "Schlaff"], 3:["Trinkt nicht", "Untröstliches Schreien"]}, b:5},
{id:12, name:"Betrunkener Eindruck", c:"Psychiatrisch", kw:["alkohol", "intox", "c2", "betrunken", "rausch", "promille", "volltrunken", "wackelig"], i:{2:["GCS < 15 / Verminderte Schutzreflexe"], 3:["Deutliche Intoxikationszeichen"]}, b:3},
{id:13, name:"Bisse und Stiche", c:"Trauma", kw:["biss", "zecke", "insektenstich", "hundebiss", "katzenbiss", "schlangenbiss", "tollwut", "tetanus"], i:{2:["Systemische allergische Reaktion"], 3:["Tiefe Bisswunde", "Gesichtsschwellung"]}, b:5},
{id:14, name:"Chemikalienkontakt", c:"Toxikologisch", kw:["säure", "lauge", "gefahrstoff", "chemie", "unfall", "dekontamination", "verätzung", "reinigungsmittel"], i:{2:["Systemische Toxizität", "Inhalationstrauma"], 3:["Verätzung großer Hautareale"]}, b:5},
{id:15, name:"Diabetes", c:"Internistisch", kw:["bz", "hyperglykämie", "zucker", "diabetes", "ketoazidose", "hypoglykämie", "unterzucker", "kussmaul", "durst", "polyurie"], i:{2:["Kussmaul-Atmung", "Ketoazidose", "BZ stark entgleist + Symptome"], 3:["Polyurie", "Polydipsie"]}, b:5},
{id:16, name:"Durchfälle und Erbrechen", c:"Abdominell", kw:["gastroenteritis", "norovirus", "exsikkose", "durchfall", "erbrechen", "diarrhoe", "brechdurchfall", "austrocknung"], i:{2:["Schwere Dehydratation", "Blutiges Erbrechen"], 3:["Zeichen der Dehydratation", "Anhaltendes Erbrechen"]}, b:5},
{id:17, name:"Extremitätenprobleme", c:"Trauma", kw:["arm", "bein", "fraktur", "luxation", "prellung", "distorsion", "bänderriss", "sprunggelenk", "knie", "schulter", "handgelenk", "radiusfraktur", "gips", "thrombose", "tvt"], i:{2:["Fehlstellung extrem", "Pulslosigkeit / Ischämie", "Verdacht auf Kompartmentsyndrom"], 3:["Gelenk blockiert", "Fehlstellung"]}, b:5},
{id:18, name:"Fremdkörper", c:"Allgemein", kw:["verschluckt", "aspiration", "fremdkörper", "knopfzelle", "batterie", "fischgräte", "nase", "ohr", "rektal"], i:{2:["Atemwegsgefährdung", "Batterie verschluckt"], 3:["Festsitzend im Ösophagus"]}, b:5},
{id:19, name:"Gastrointestinale Blutung", c:"Abdominell", kw:["hämatemesis", "teerstuhl", "blutung rektal", "kaffeesatzerbrechen", "meläna", "blutstuhl", "hämorrhoiden"], i:{2:["Kreislaufinstabilität", "Große Mengen Blut"], 3:["Aktives Bluterbrechen", "Meläna"]}, b:5},
{id:20, name:"Gesichtsprobleme", c:"HNO / Sinnesorgane", kw:["gesicht", "kiefer", "schwellung gesicht", "parotitis", "dicke backe", "fazialisparese", "trigeminus", "jochbein"], i:{2:["Atemwegsgefährdung durch Schwellung"], 3:["Kieferklemme", "Akute Gesichtslähmung"]}, b:5},
{id:21, name:"Halsschmerzen", c:"HNO / Sinnesorgane", kw:["angina", "schluckbeschwerden", "halsschmerz", "tonsillitis", "peritonsillarabszess", "mandeln", "heiserkeit", "globusgefühl"], i:{2:["Stridor", "Speicheln / Unfähigkeit zu schlucken"], 3:["Kieferklemme", "Starke Schluckschmerzen"]}, b:5},
{id:22, name:"Hautausschläge", c:"Dermatologisch", kw:["exanthem", "petechien", "rash", "ausschlag", "masern", "röteln", "windpocken", "scharlach", "zoster", "gürtelrose", "erythem"], i:{2:["Petechien + Fieber", "Atemwegsmitbeteiligung"], 3:["Blasenbildung großflächig"]}, b:5},
{id:23, name:"Herzklopfen", c:"Kardiologisch", kw:["palpitationen", "tachykardie", "rhythmus", "herzrasen", "herzstolpern", "vorhofflimmern", "bradykardie", "extrasystolen"], i:{2:["Synkope", "Thoraxschmerz", "HF > 150"], 3:["Neues Vorhofflimmern", "Schwindel"]}, b:5},
{id:24, name:"Hinkendes Kind", c:"Pädiatrisch", kw:["kind hinkt", "gelenkschmerz kind", "hüftschnupfen", "coxitis", "epiphyseolyse"], i:{2:["Neurologisches Defizit"], 3:["Fieber", "Gelenk überwärmt", "Entlastungshinken"]}, b:5},
{id:25, name:"Hodenschmerz", c:"Urologisch", kw:["hoden", "torsion", "skrotum", "epididymitis", "orchitis", "hodenschwellung", "leiste"], i:{2:["Verdacht auf Hodentorsion", "Ausstrahlung in Leiste akut"], 3:["Akute Schwellung"]}, b:5},
{id:26, name:"Irritables oder unruhiges Kind", c:"Pädiatrisch", kw:["kind schreit", "fontanelle", "untröstlich", "irritiert", "meningitis kind"], i:{2:["Nicht weckbar", "Petechien"], 3:["Vorgewölbte Fontanelle", "Untröstlich"]}, b:5},
{id:27, name:"Körperstammverletzung", c:"Trauma", kw:["stumpfes trauma", "gurtprellung", "thoraxkompression", "beckenfraktur", "sturz höhe", "rippen"], i:{2:["Penetrierende Verletzung", "Atemnot", "Hypotonie"], 3:["Sichtbares Hämatom groß"]}, b:5},
{id:28, name:"Kollaps", c:"Neurologisch", kw:["synkope", "ohnmacht", "bewusstlos", "kollaps", "vasovagal", "umgekippt", "blackout"], i:{2:["Veränderter GCS", "Begleitender Thoraxschmerz"], 3:["Ohne Warnsymptome", "Verletzung durch Sturz"]}, b:5},
{id:29, name:"Kopfschmerz", c:"Neurologisch", kw:["migräne", "cephalgie", "donnerschlag", "kopfschmerz", "cluster", "spannungskopfschmerz", "sab", "blutung", "aura"], i:{2:["Donnerschlagkopfschmerz", "Meningismus", "Neues neurologisches Defizit"], 3:["Fieber", "Schlimmster Schmerz aller Zeiten"]}, b:5},
{id:30, name:"Kopfverletzung", c:"Trauma", kw:["sht", "platzwunde kopf", "sturz kopf", "commotio", "gehirnerschütterung", "schädelbruch", "amnesie"], i:{2:["GCS < 15", "Offene Schädelverletzung", "Fokalneurologie"], 3:["Amnesie", "Erbrechen nach Trauma"]}, b:5, r:[{l:"Sturz auf Kopf + Antikoagulantien", v:2, t:"Auffälliger Mechanismus (Orange) oder Blutungsneigung (Gelb)"}]},
{id:31, name:"Krampfanfall", c:"Neurologisch", kw:["epilepsie", "konvulsion", "krampf", "anfall", "status epilepticus", "grand mal", "fieberkrampf"], i:{1:["Status epilepticus (> 5 Min)"], 2:["Erstanfall", "Postiktale Bewusstseinsstörung"], 3:["Bekannte Epilepsie, jetzt wach"]}, b:5},
{id:32, name:"Nackenschmerz", c:"Trauma", kw:["hws", "schleudertrauma", "nackensteife", "torticollis", "zervikalsyndrom", "blockade"], i:{2:["Meningismus", "Neues neurologisches Defizit"], 3:["Traumaanamnese", "Fieber"]}, b:5},
{id:33, name:"Ohrenprobleme", c:"HNO / Sinnesorgane", kw:["otitis", "hörsturz", "tinnitus", "ohrenschmerz", "mittelohrentzündung", "mastoiditis", "schwindel"], i:{2:["Plötzlicher kompletter Hörverlust"], 3:["Schwellung hinter dem Ohr (Mastoiditis)"]}, b:5},
{id:34, name:"Psychische Erkrankung", c:"Psychiatrisch", kw:["suizid", "psychose", "panik", "depression", "angst", "borderline", "schizophrenie", "schnittwunden"], i:{2:["Akute Suizidalität", "Eigen-/Fremdgefährdung"], 3:["Agitiertheit", "Schwere Depression"]}, b:5},
{id:35, name:"Rückenschmerz", c:"Orthopädisch", kw:["lws", "bandscheibe", "ischias", "hexenschuss", "lumbago", "cauda equina", "rücken", "radikulär", "ausstrahlung"], i:{2:["Verdacht auf Aortenaneurysma", "Harnverhalt / Cauda Equina", "Neurologisches Defizit akut"], 3:["Fieber"]}, b:3, r:[{l:"Ausstrahlung ins Bein (< 24 Std)", v:2, t:"Neurologisches Defizit akut auf Orange"}, {l:"Ausstrahlung ins Bein (> 24 Std)", v:3, t:"Chronisch auf Gelb"}]},
{id:36, name:"Schreiendes Baby", c:"Pädiatrisch", kw:["baby schreit", "untröstlich", "schreibaby", "kolik"], i:{2:["Trinkt gar nicht", "Schlaff"], 3:["Fieber", "Vorgewölbte Fontanelle"]}, b:5},
{id:37, name:"Schwangerschaftsproblem", c:"Gynäkologisch", kw:["wehen", "blutung schwanger", "eklampsie", "hellp", "präeklampsie", "blasensprung", "abort", "fehlgeburt"], i:{2:["Krämpfe", "Starke Blutung", "Kindsbewegungen fehlend"], 3:["Vorzeitige Wehen", "Blasensprung"]}, b:5},
{id:38, name:"Schweres Trauma", c:"Trauma", kw:["polytrauma", "vu", "schwer verletzt", "einklemmung", "verkehrsunfall", "schockraum"], i:{1:["Massive Blutung", "Atemweg verlegt"], 2:["Penetrierende Verletzung Rumpf", "Einklemmung", "GCS < 15"]}, b:5, r:[{l:"Verkehrsunfall (mit RTW) unpassend", v:3, t:"Trauma auf Gelb"}]},
{id:39, name:"Selbstverletzung", c:"Psychiatrisch", kw:["ritzen", "suizidversuch", "autoaggression", "tabletten"], i:{2:["Arterielle Blutung", "Toxische Einnahme", "GCS < 15"], 3:["Anhaltende Blutung", "Akute psychotische Krise"]}, b:5},
{id:40, name:"Sexualinfektion", c:"Allgemein", kw:["sti", "tripper", "genital", "gonorrhoe", "chlamydien", "lues", "syphilis", "ausfluss", "herpes genitalis"], i:{3:["Akuter purulenter Ausfluss", "Fieber"]}, b:5},
{id:41, name:"Stürze", c:"Trauma", kw:["gestürzt", "prellung", "sturz", "gefallen", "fahrradsturz", "e-scooter", "treppe", "leiter"], i:{2:["Veränderter GCS", "Fehlstellung große Knochen"], 3:["Frakturverdacht"]}, b:5, r:[{l:"Fahrradsturz", v:2, t:"Auffälliger Verletzungsmechanismus auf Orange"}, {l:"Sturz aus eigener Körperhöhe", v:2, t:"Auffälliger Verletzungsmechanismus auf Orange"}]},
{id:42, name:"Thoraxschmerz", c:"Kardiologisch", kw:["brustschmerz", "acs", "infarkt", "stemi", "nstemi", "angina pectoris", "thoraxschmerz", "engegefühl", "brennen brust", "aorte"], i:{1:["Reißender Schmerz in den Rücken (Aorta)"], 2:["Kaltschweißigkeit", "Atemnot", "Ausstrahlung in Arm/Kiefer"], 3:["Atemabhängiger Schmerz", "Verdacht Lungenembolie"]}, b:5, r:[{l:"Thoraxschmerzen (AP)", v:2, t:"Immer Orange"}]},
{id:43, name:"Überdosierung und Vergiftung", c:"Toxikologisch", kw:["intoxikation", "drogen", "überdosis", "alkohol", "tabletten", "paracetamol", "opiate", "kokain", "gift"], i:{2:["GCS < 15", "Atemdepression", "Krampfanfall"], 3:["Gezielte suizidale Einnahme", "Gefährliche Substanz"]}, b:5},
{id:44, name:"Unwohlsein bei Erwachsenen", c:"Allgemein", kw:["schwäche", "az verschlechterung", "schlapp", "unwohlsein", "fieber", "schwindel", "blass", "pflegefall"], i:{2:["Schockzeichen", "Veränderter Bewusstseinszustand"], 3:["Fieber bei Abwehrschwäche", "Petechien"]}, b:5},
{id:45, name:"Unwohlsein bei Kindern", c:"Pädiatrisch", kw:["kind krank", "schlapp", "lethargisch", "apathisch", "trinkschwäche", "fieber kind"], i:{2:["Schlaff", "Nicht weckbar", "Petechien"], 3:["Fieber", "Trinkschwäche"]}, b:5},
{id:46, name:"Unwohlsein bei Neugeborenen", c:"Pädiatrisch", kw:["neugeborenes", "ikterus", "gelbsucht", "trinkschwäche", "apathisch", "anpassungsstörung"], i:{2:["Krampfanfall", "Temperatur > 38°C", "Apnoe"], 3:["Trinkt nicht", "Auffälliger Ikterus"]}, b:5},
{id:47, name:"Unwohlsein bei Säuglingen", c:"Pädiatrisch", kw:["säugling", "apathisch", "trinkt schlecht", "fieber", "dehydriert"], i:{2:["Schlaff", "Fieber + Petechien"], 3:["Trinkt schlecht", "Fieber"]}, b:5},
{id:48, name:"Urologisches Problem", c:"Urologisch", kw:["harnverhalt", "nierenkolik", "hwi", "blasenentzündung", "dysurie", "makrohämaturie", "flanke", "stein", "katheter"], i:{2:["Harnverhalt akut + starke Schmerzen", "Anurie"], 3:["Fieber", "Starke Flankenschmerzen"]}, b:5},
{id:49, name:"Vaginale Blutung", c:"Gynäkologisch", kw:["blutung", "unterleib", "abort", "vagina", "periode", "menorrhagie", "eug"], i:{2:["Kreislaufinstabilität", "Starke unstillbare Blutung", "Verdacht auf EUG"], 3:["Schwangerschaft", "Mäßige Blutung"]}, b:5},
{id:50, name:"Verbrennungen und Verbrühungen", c:"Trauma", kw:["verbrennung", "hitze", "feuer", "verbrühung", "stromschlag", "blitz", "kochendes wasser", "sonnenbrand"], i:{1:["Inhalationstrauma + Atemnot"], 2:["KOF > 15%", "Beteiligung Gesicht/Atemwege"], 3:["KOF > 5% (Kind) / > 10% (Erw)"]}, b:5},
{id:51, name:"Wunden", c:"Chirurgisch", kw:["schnittwunde", "platzwunde", "risswunde", "stichwunde", "schürfwunde", "blutung", "naht", "amputation"], i:{2:["Arterielle spritzende Blutung", "Neurologisches Ausfall"], 3:["Anhaltende venöse Blutung", "Verdacht auf Gelenkeröffnung"]}, b:5},
{id:52, name:"Zahnprobleme", c:"HNO / Sinnesorgane", kw:["zahnschmerz", "karies", "zahn trauma", "dicke backe", "abszess zahn", "kiefer", "zahnfleisch"], i:{2:["Atemwegsverlegung durch Blutung", "Zahnverlust + Blutung"], 3:["Schwellung breitet sich auf Hals aus", "Kieferklemme"]}, b:5},
{id:53, name:"Generelle Indikatoren", c:"Allgemein", kw:["allgemein", "vitalzeichen", "blutdruck", "puls", "fieber"], i:{}, b:5},
{id:54, name:"Massenanfall primäres Diagramm", c:"Spezial", kw:["manv", "sichtung", "start", "katastrophe", "massenanfall"], i:{1:["Geht nicht, atmet nicht normal", "Stark blutend"], 2:["Geht nicht, atmet normal, Perfusionszeichen negativ"], 3:["Geht nicht, atmet normal, Perfusionszeichen positiv", "Geht, aber schwer verletzt"], 4:["Geht, leicht verletzt"]}, b:5},
{id:55, name:"Massenanfall sekundäres Diagramm", c:"Spezial", kw:["manv sekundär", "triage", "rettungsdienst"], i:{1:["GCS < 12", "AF < 10 oder > 29", "RR syst < 90"], 2:["Isolierte schwere Verletzung", "Stabile Fraktur große Knochen"], 3:["Stabile Vitalparameter", "Leichte Wunden"]}, b:5}
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
const CS=[{t:"Sofort: Red Flags",i:["Atemstillstand","Kreislaufstillstand","Bewusstlos ohne Schutzreflexe","Massive arterielle Blutung","Anaphylaktischer Schock","Status epilepticus"]},{t:"Sehr dringend",i:["Schwere Atemnot oder SpO₂ < 92%","Schwere Thoraxschmerzen (ACS)","Fokalneurologisches Defizit","GCS ≤ 12","Unkontrollierbare Blutung","Akutes Abdomen und Abwehrspannung"]},{t:"Dringend",i:["Fieber > 39°C und reduzierter AZ","Starke Schmerzen NRS 7 bis 10","Erbrechen und Dehydration","Akute Verwirrtheit","Nicht reponierbare Hernie"]},{t:"Normal",i:["Schmerzen NRS 4 bis 6","Fieber ohne Begleitzeichen","Kleine Wunden","Erbrechen ohne Dehydration","Hautausschlag stabil"]},{t:"Vitalzeichen",i:["AF: 12 bis 20/min","SpO₂: > 95% (COPD > 92%)","HF: 60 bis 100/min","RR syst: 100 bis 140","Temp: 36,0 bis 37,5°C","GCS: 15 ist normal"]},{t:"FAST Test",i:["Face: Gesicht hängt?","Arms: Arm sinkt?","Speech: Sprache verwaschen?","Time: Beginn wann?","Bedeutet Orange Stufe","Lyse in unter 4,5 h"]},{t:"Pädiatrie",i:["Neugeborene und Fieber bedeutet Orange","Fontanelle vorgewölbt?","Trinkschwäche ist ein Alarmzeichen","Petechien und Fieber prüfen","Tachypnoe altersabhängig betrachten","Eltern Intuition absolut beachten"]}];


const CASES=[
{s:"58-jähriger Mann, akuter retrosternaler Druckschmerz seit 20 Min., Ausstrahlung in den linken Arm, kaltschweißig, blass.",diag:42,lvl:2,ex:"Typische ACS Symptomatik. Kaltschweißig und retrosternal bedeutet Sehr dringend."},
{s:"23-jährige Frau, Schwellung der Lippen und Zunge 10 Min. nach Restaurantbesuch. Atemnot, generalisierte Urtikaria.",diag:4,lvl:2,ex:"Anaphylaktische Reaktion. Atemwegsbeteiligung bei Zunge und Lippen bedeutet Orange."},
{s:"4-jähriger Junge, bellender Husten, inspiratorischer Stridor, leichtes Fieber 38,2°C.",diag:8,lvl:3,ex:"Verdacht auf Pseudokrupp. Stridor in Ruhe bedingt mindestens Gelb. Atemnot triggert gegebenenfalls Orange."},
{s:"35-jähriger Mann, seit 3 Tagen zunehmende Halsschmerzen, Fieber 39,5°C, kann Mund kaum noch öffnen.",diag:21,lvl:3,ex:"Verdacht auf Peritonsillarabszess. Kieferklemme und Fieber bedeutet Dringend (Gelb)."},
{s:"80-jährige Patientin, im Pflegeheim gestürzt, Schmerzen linke Hüfte, Bein verkürzt und außenrotiert.",diag:17,lvl:3,ex:"Verdacht auf Schenkelhalsfraktur. Fehlstellung großer Knochen bedeutet Gelb."},
{s:"45-jähriger Mann, epigastrische Schmerzen, gürtelförmig in den Rücken ausstrahlend, Übelkeit.",diag:1,lvl:3,ex:"Verdacht auf akute Pankreatitis. Ausstrahlung in den Rücken bedeutet Gelb."},
{s:"19-jähriger Student, akute Hodenschmerzen links seit 2 Stunden, Hoden hochstehend, starke Übelkeit.",diag:25,lvl:2,ex:"Verdacht auf Hodentorsion. Extrem zeitkritisch, Ausstrahlung und Verdacht bedeutet Orange."},
{s:"8 Monate alter Säugling, schreit untröstlich seit 4 Stunden, Erbrechen, rote Geleestühle.",diag:2,lvl:2,ex:"Verdacht auf Invagination bei Säugling. Geleestühle bedeutet Orange."},
{s:"55-jährige Frau, starker Kopfschmerz der extremsten Art, schlagartig aufgetreten, Nackensteife.",diag:29,lvl:2,ex:"Verdacht auf Subarachnoidalblutung (SAB). Donnerschlagkopfschmerz bedeutet Orange."},
{s:"80-jähriger Mann, gestürzt auf Kopf, nimmt Apixaban (DOAK), GCS 14, Amnesie für das Ereignis.",diag:30,lvl:2,ex:"SHT und Antikoagulation. Auffälliger Mechanismus oder Amnesie bedeutet Orange."},
{s:"75-jährige Frau, Hemiparese links seit 45 Min, GCS 14, keine Schmerzen.",diag:29,lvl:2,ex:"Verdacht auf Schlaganfall (FAST positiv). Neues neurologisches Defizit bedeutet Orange."},
{s:"18-jähriger Mann, Suizidgedanken, superfizielle Schnittwunden am Unterarm, weint, kreislaufstabil.",diag:39,lvl:3,ex:"Verdacht auf psychotische Krise oder Agitiertheit ohne akute Lebensgefahr bedeutet Gelb."},
{s:"3-jähriges Mädchen, fiebert seit heute 40,2°C, apathisch, Nackensteife, Eltern extrem besorgt.",diag:45,lvl:2,ex:"Verdacht auf Meningitis oder Sepsis. Apathisch und Nackensteife triggert Orange."},
{s:"60-jähriger Mann, zweimaliges Kaffeesatzerbrechen, blass, HF 120, RR 90/60.",diag:19,lvl:2,ex:"Gastrointestinale Blutung. Kreislaufinstabilität und Schockzeichen bedeutet Orange."},
{s:"25-jährige Frau, Sturz mit E-Scooter ohne Helm bei 20 km/h, Kopfschmerzen, GCS 15, keine Amnesie.",diag:41,lvl:2,ex:"Auffälliger Verletzungsmechanismus führt zur Aufwertung auf Orange."},
{s:"40-jähriger Mann, Flankenschmerz rechts, schmerzgeplagt und extrem unruhig, NRS 9.",diag:48,lvl:3,ex:"Verdacht auf Nierenkolik. Starke Schmerzen bedeutet Gelb. Harnverhalt mit starken Schmerzen wäre Orange."},
{s:"65-jähriger Mann, bekannte COPD, exazerbiert, SpO2 88% unter Raumluft, spricht in abgehackten Sätzen.",diag:6,lvl:2,ex:"COPD Exazerbation. SpO2 unter 92% oder Sprechunfähigkeit bedeutet Orange."},
{s:"5-jähriger Junge, beim Nudelkochen mit Wasser verbrüht, Thorax vorne komplett betroffen mit Blasenbildung.",diag:50,lvl:2,ex:"KOF von ca. 18 Prozent bei Rumpf vorne Kind. Mehr als 15% KOF bedeutet Orange."},
{s:"50-jähriger Mann, akuter Harnverhalt, extrem starke Schmerzen im Unterbauch, Anurie seit 12h.",diag:48,lvl:2,ex:"Akuter Harnverhalt mit starken Schmerzen ist hochgradig gefährdend und bedeutet Orange."},
{s:"28-jährige Frau, umgeknickt beim Sport, Sprunggelenk geschwollen, Pulse tastbar, NRS 6.",diag:17,lvl:4,ex:"Keine Fehlstellung großer Knochen, Gelenk nicht blockiert, Schmerz NRS 6 bedeutet Normal (Grün)."},
{s:"40-jährige Frau, plötzliche Luftnot seit 30 Min., nimmt Pille und raucht, atemabhängiger Schmerz rechtsseitig, SpO2 96%.",diag:7,lvl:3,ex:"Atemproblem Erwachsene. Atemabhängiger Schmerz ohne Zyanose oder starken SpO2 Abfall bedeutet Gelb (Verdacht auf Lungenembolie)."},
{s:"65-jähriger Mann, Teerstuhl seit 2 Tagen, jetzt zuhause synkopiert, aktuell wach, HF 115.",diag:19,lvl:2,ex:"Gastrointestinale Blutung. Die begleitende Synkope weist auf eine Kreislaufinstabilität hin und triggert Orange."},
{s:"22-jähriger Mann, in einen rostigen Nagel getreten, letzte Tetanusimpfung vor 15 Jahren, kleine Stichwunde, NRS 3.",diag:51,lvl:4,ex:"Wunden. Die Wunde ist klein, keine starke Blutung. Impfstatus ist relevant für Therapie, ändert aber MTS Stufe nicht direkt, daher Grün."},
{s:"30-jährige Frau, Flankenschmerz links, Dysurie seit gestern, heute Fieber 39,2°C.",diag:48,lvl:3,ex:"Urologisches Problem. Flankenschmerz in Kombination mit Fieber bedeutet Dringend (Gelb)."},
{s:"12-jähriger Junge, beim Fußball das Knie verdreht, Knie dick geschwollen, kann nicht auftreten, Schmerzen NRS 7.",diag:17,lvl:3,ex:"Extremitätenprobleme. Starke Schmerzen und das Unvermögen aufzutreten bedeuten Gelb."},
{s:"80-jährige Frau, Bewohnerin Pflegeheim, zunehmend exsikkiert, GCS 12, Fieber 38,5°C.",diag:44,lvl:2,ex:"Unwohlsein bei Erwachsenen. Der veränderte Bewusstseinszustand (GCS unter 15) bedeutet Orange."},
{s:"50-jähriger Mann, Blutzucker über 500 mg/dl gemessen, Kussmaul-Atmung, Patient wirkt somnolent.",diag:15,lvl:2,ex:"Diabetes. Die Kussmaul-Atmung und die starke Entgleisung mit Symptomatik bedeuten Orange."},
{s:"7-jähriges Mädchen, Unterarmfraktur nach Sturz von Schaukel, deutliche Fehlstellung sichtbar.",diag:41,lvl:3,ex:"Stürze. Die offensichtliche Fehlstellung eines großen Knochens triggert Dringend (Gelb)."},
{s:"45-jähriger Mann, bemerkt kreisrunden Haarausfall am Hinterkopf seit 3 Wochen, keine Schmerzen, vital stabil.",diag:22,lvl:5,ex:"Hautausschläge. Keine akuten Symptome und keine Schmerzen bedeuten Nicht dringend (Blau)."},
{s:"19-jährige Frau, hyperventiliert nach Streit, Kribbeln in den Händen, weint stark, keine Vorerkrankungen.",diag:34,lvl:3,ex:"Psychische Erkrankung. Die starke Agitiertheit und Panik bedeuten Dringend (Gelb)."},
{s:"30-jähriger Handwerker, ist mit Kreissäge abgerutscht, starke unstillbare arterielle Blutung am Daumen.",diag:51,lvl:2,ex:"Wunden. Eine arterielle, spritzende Blutung bedeutet sofortige Gefährdung und triggert Orange."},
{s:"60-jähriger Mann, bekannte COPD, akute Dyspnoe, Sprechen ist nur noch in einzelnen Worten möglich.",diag:6,lvl:2,ex:"Asthma und COPD. Sprechunfähigkeit ist ein massives Warnsignal für Erschöpfung und bedeutet Orange."},
{s:"2-jähriger Junge, Fieberkrampf, krampft aktuell bei Eintreffen in der ZNA seit 10 Minuten durchgehend.",diag:31,lvl:1,ex:"Krampfanfall. Ein Status epilepticus (Krampf über 5 Minuten) bedeutet unmittelbare Lebensgefahr und triggert Rot."},
{s:"55-jährige Frau, Brustschmerz atemabhängig, NRS 5, leichter Reizhusten, kein Ausstrahlen.",diag:42,lvl:3,ex:"Thoraxschmerz. Ein atemabhängiger Schmerz ohne stärkste Begleitsymptome (Kaltschweiß) bedeutet Dringend (Gelb)."},
{s:"28-jähriger Chemielaborant, hat sich Lauge ins Gesicht gespritzt, starke Schmerzen, linkes Auge brennt massiv.",diag:10,lvl:2,ex:"Augenprobleme. Eine chemische Verätzung des Auges ist potenziell sichtgefährdend und triggert Orange."},
{s:"35-jährige Schwangere in der 32. SSW, plötzlich starke, kontinuierliche vaginale Blutung, kreislaufstabil.",diag:49,lvl:2,ex:"Vaginale Blutung. Eine starke unstillbare Blutung in der Schwangerschaft bedeutet Gefahr für Mutter und Kind und triggert Orange."},
{s:"50-jähriger Mann, Wespenstich am Unterarm, nur lokale Rötung und Schwellung, kein Juckreiz am Körper, NRS 2.",diag:4,lvl:4,ex:"Allergie. Eine rein lokale Reaktion ohne systemische Zeichen bedeutet Normal (Grün)."},
{s:"70-jähriger Mann, akute Harnverhaltung seit 24h, Blase tastbar, extreme Schmerzen NRS 8.",diag:48,lvl:2,ex:"Urologisches Problem. Ein akuter Harnverhalt gekoppelt mit starken Schmerzen triggert Orange."},
{s:"15-jähriges Mädchen, Überdosis Paracetamol vor 3 Stunden aus Liebeskummer, suizidale Absicht geäußert, GCS 15.",diag:43,lvl:3,ex:"Überdosierung und Vergiftung. Eine gezielte suizidale Einnahme bei wachem Patienten bedeutet Dringend (Gelb)."},
{s:"8-jähriger Junge, wurde von einem fremden Hund in die Wade gebissen, tiefe Wunde, blutet mäßig.",diag:13,lvl:3,ex:"Bisse und Stiche. Eine tiefe Bisswunde triggert Gelb, eine systemische allergische Reaktion läge bei Orange."},
{s:"75-jährige Frau, Verwirrtheitszustand seit heute morgen, Urin riecht streng, fieberfrei, GCS 14.",diag:44,lvl:2,ex:"Unwohlsein bei Erwachsenen. Ein veränderter Bewusstseinszustand oder eine akute Verwirrtheit triggert Orange."},
{s:"20-jähriger Mann, Schmerzen im rechten Unterbauch, Appendizitis-Zeichen positiv, verstärken sich beim Gehen, NRS 6.",diag:1,lvl:4,ex:"Abdominelle Schmerzen bei Erwachsenen. Schmerz bei Bewegung und NRS unter 7 bedeutet Normal (Grün)."},
{s:"50-jähriger Mann, plötzlicher Sehverlust am rechten Auge, komplett schmerzlos.",diag:10,lvl:2,ex:"Augenprobleme. Ein akuter Visusverlust ist ein massives Warnsignal und bedeutet Orange."},
{s:"60-jährige Frau, Verdacht auf tiefe Beinvenenthrombose, linkes Bein dick und gerötet, Schmerz NRS 4.",diag:17,lvl:4,ex:"Extremitätenprobleme. Keine Rot oder Orange Kriterien zutreffend, Schmerz mäßig, daher Normal (Grün)."},
{s:"90-jähriger Mann, unter Reanimationsbedingungen (CPR) vom Rettungsdienst mit Lucas in den Schockraum gebracht.",diag:44,lvl:1,ex:"Generelle Indikatoren oder Unwohlsein. Kreislaufstillstand bedeutet absolute Lebensgefahr und triggert Sofort (Rot)."}
];

