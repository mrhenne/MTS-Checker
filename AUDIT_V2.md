# MTS-Checker V2 – Audit

Stand: 2026-10-04

## Arbeitsregeln
- main bleibt bis zur ausdrücklichen Freigabe unverändert.
- Backup-Branch: backup/pre-v2-2026-10-04
- Entwicklungsbranch: dev/mts-checker-v2
- Größere medizinische, strukturelle oder UI-Änderungen nur nach Freigabe.
- Jede Änderung wird technisch und auf Seiteneffekte geprüft.
- MTS-Logik, lokale SOP und ergänzende klinische Hinweise werden künftig getrennt betrachtet.

## Referenzbasis
1. Deutsche Ausgabe: Ersteinschätzung in der Notaufnahme – Das Manchester-Triage-System, 6. überarbeitete und erweiterte Auflage 2025, Hogrefe.
2. Deutsches Netzwerk Ersteinschätzung.
3. Helios SiNA Manchester Triage System Basiskurs, insbesondere Krefeld.
4. Ergänzende Leitlinien nur für Zusatzwissen, nicht zum Überschreiben der MTS-Logik.

## Bereits bestätigte Punkte
### Kritisch
1. SOP-Regeln können in rOvl() eine bereits höhere Dringlichkeit wieder herunterstufen:
   - r.v < lvl setzt höher.
   - direkt danach kann r.v > lvl wieder niedriger setzen.
   - Eine MTS-Entscheidungslogik darf eine bereits ausgelöste höhere Priorität nicht durch einen weniger dringlichen Zusatztrigger abschwächen.

2. Trainingsmodus prüft die gewählte Dringlichkeitsstufe nicht:
   - trnLvl(chosen, correct) ignoriert beide Parameter.
   - Nach Klick wird die Auflösung angezeigt, unabhängig davon, ob die gewählte Stufe korrekt war.

### Hohe Priorität
3. 55 Datensätze D[1..55], während die aktuelle deutsche Ausgabe 52 Präsentationssituationen beschreibt.
   - Nr. 53 Generelle Indikatoren
   - Nr. 54 Massenanfall primäres Diagramm
   - Nr. 55 Massenanfall sekundäres Diagramm
   Diese müssen fachlich als MTS, Sondermodul oder Nicht-MTS sauber klassifiziert werden.

4. MTS, lokale SOP und Behandlungsempfehlungen sind im selben Entscheidungsdialog vermischt.
   Beispiele: Monitoring, O2, PVK/IO, Labor, Immobilisation, Röntgenanforderung.
   Diese Maßnahmen dürfen nicht wie MTS-Diskriminatoren wirken.

5. Globale Vitalparameterlogik verändert die Dringlichkeitsstufe unabhängig vom Präsentationsdiagramm.
   Das ist gegen die aktuelle MTS-Referenz zu prüfen. MTS arbeitet mit diagrammbezogenen Diskriminatoren und nicht wie ein aggregierter Early-Warning-Score.

6. qSOFA wird bei >=2 Punkten mit "Verdacht auf Sepsis!" ausgegeben.
   Das ist als klinischer Zusatz zu kennzeichnen und darf nicht als MTS-Ergebnis erscheinen.

7. Schmerzlogik NRS 8–10 = Gelb und NRS 5–7 = Grün ist gegen das aktualisierte Schmerzkonzept der 6. Auflage 2025 zu validieren.

### Architektur
8. Die gesamte Anwendung liegt in einer index.html von rund 102 KB:
   - Daten
   - medizinische Regeln
   - UI
   - Training
   - Speicherung
   - Export
   - Service Worker
   Dies erhöht das Risiko unbeabsichtigter Seiteneffekte.

9. Medizinische Inhalte besitzen aktuell keine Quellen-, Versions- oder Prüfmetadaten.

10. Verlauf wird ausschließlich lokal in localStorage gespeichert. Für Patientendaten darf daraus keine klinische Dokumentation abgeleitet werden.

## Zielstruktur V2
- MTS Core
- lokale/Helios-SOP
- klinische Zusatzinformationen
- Training
- UI
- Daten/Versionierung
klar voneinander trennen.

## Statuslegende für den weiteren Audit
- GRÜN: gegen aktuelle Referenz plausibel/verifiziert
- GELB: noch zu validieren
- ROT: fachlich/technisch problematisch
- BLAU: lokale SOP/Zusatzregel, kein MTS
- WEISS: Zusatzfunktion ohne Einfluss auf MTS

## Noch offen
- vollständiger Abgleich aller 52/55 Präsentationsdiagramme
- generelle und spezifische Diskriminatoren
- psychiatrische Diagramme
- Pädiatrie
- Schmerz
- Sepsis
- Fremdkörper
- Trauma
- Verbrennungen
- Schwangerschaft/Gynäkologie
- Tox Board
- Trainingsfälle
- Suchbegriffe
- Bodymap-Verknüpfungen
- MANV/Sichtungslogik
- UI/Barrierefreiheit
- Offline/PWA-Verhalten
- Datenschutz

## Auditblock 1 – Hochrisikobereiche

### Trauma / auffälliger Verletzungsmechanismus – ROT/GELB
Aktueller Code:
- Fahrradsturz pauschal als Orange.
- Sturz aus eigener Körperhöhe pauschal als Orange.
- E-Scooter-Fall bei 20 km/h wird im Training pauschal als Orange bewertet.

Aktuelle Referenz 2025:
- Auffälliger Verletzungsmechanismus wird konkreter definiert.
- Dazu zählen u. a. schwere Verkehrsunfälle mit >30 km/h Geschwindigkeitsunterschied, Fußgänger/Zweiradfahrer gegen PKW oder größer, Herausschleudern/Tod eines anderen Insassen, Sturz ab 3 m bzw. bei Kindern ab zweifacher Körperhöhe.
- Bei Senioren kann auch ein Sturz aus dem Stand die Bedingung erfüllen.

Bewertung:
- Pauschalregeln im aktuellen Code sind zu grob.
- Besonders „Fahrradsturz = Orange“ und „Sturz aus eigener Körperhöhe = Orange“ sind so nicht als allgemeine Regel haltbar.
- Der Trainingsfall E-Scooter 20 km/h ohne weitere Hochrisikomerkmale ist zu überprüfen und wahrscheinlich zu ändern.

### Kardialer Schmerz / Thorax – GELB
Aktueller Code:
- Sonderregel „Thoraxschmerzen (AP) – Immer Orange“.
- Training nutzt teils symptomatische Heuristiken.

Aktuelle Referenz 2025:
- Kardialer Schmerz wird als typisches intensives Engegefühl/heftigster retrosternaler Schmerz mit typischer oder atypischer Ausstrahlung beschrieben.
- Schweißausbruch/Erbrechen können dazugehören.
- Atypische Präsentationen, insbesondere bei Frauen, werden ausdrücklich berücksichtigt.
- Kardialer Schmerz ist typischerweise nicht atemabhängig und nicht provozierbar.

Bewertung:
- „Thoraxschmerz immer Orange“ ist zu undifferenziert.
- Die App muss künftig zwischen „Thoraxschmerz“ als Präsentationsdiagramm und „kardialer Schmerz“ als Diskriminator unterscheiden.
- Atypische kardiale Präsentationen müssen in Suche/Training besser berücksichtigt werden.

### Akutes neurologisches Defizit <24 h – ROT/GELB
Aktueller Code:
- „Neues neurologisches Defizit“ und „Neurologisches Defizit akut“ sind vorhanden, aber nur sehr knapp definiert.
- Stroke-Training ist teilweise an Kopfschmerz gekoppelt.

Aktuelle Referenz 2025:
- Der Indikator umfasst u. a. Sprachstörung, Fazialisdefizit, einseitige Kraftminderung, reduziertes Bewusstsein, akute Orientierungsstörung, akut einsetzenden Schwindel, Blickparese, Gesichtsfelddefizit, Neglect, Koordinationsstörung sowie deutliche lokale Sensibilitäts-/Motorikdefizite.
- Bei unklarem Beginn, z. B. Wake-up-Stroke, soll von <24 h ausgegangen werden.

Bewertung:
- Die aktuelle Definition ist zu dünn für eine sichere Entscheidungshilfe.
- Der Stroke-Fall gehört nicht einfach in „Kopfschmerz“, sondern die Diagrammwahl muss anhand der Präsentation nachvollziehbar sein.
- Die App sollte später eine Definition/Infoebene für den Diskriminator anbieten.

### Vitalparameter Erwachsene – GELB
Aktueller Code:
- Globale automatische Trigger, z. B. SpO2 <92 % => mindestens Orange.
- GCS <15 => Orange; GCS <12 => Rot.
- Temperatur >39 => Gelb; >41 => Orange.

Aktuelle Referenz / internationales MTS-Update 2025:
- MTS-Vitalparameter sollen die Priorität bei vorhandenem Wert erhöhen.
- NEWS2 soll nicht die MTS-Vitalparameter ersetzen, sondern kann zusätzlich genutzt werden.
- Es gibt keine starke Evidenz für eine Umstellung des MTS auf einen aggregierten NEWS2-Ansatz.

Bewertung:
- Die Grundidee automatischer Prioritätserhöhung ist nicht grundsätzlich falsch.
- Aber die App muss sicherstellen, dass nur tatsächlich im jeweiligen MTS-Kontext vorgesehene Vitalparameter-Diskriminatoren greifen.
- Der globale Einheitsmechanismus ist zu grob und muss diagramm-/indikatorbezogen werden.

### Pädiatrische Vitalparameter – ROT/GELB
Aktueller Code:
- Altersgruppen und Normwert-Text werden angezeigt.
- Diese Werte wirken überwiegend informativ und treiben die Einstufung nicht systematisch.
- Es fehlen AF/HF Eingabefelder in der dynamischen Triage.

Aktuelle internationale MTS-Unterlagen 2025:
- stärkste Tachypnoe Orange: <1 Jahr AF >=55/min, >=1 Jahr AF >=45/min in ausgewählten pädiatrischen Diagrammen.
- Tachypnoe Gelb: <1 Jahr AF >=45/min, >=1 Jahr AF >=35/min.
- Tachykardie beim Kind Gelb: <1 Jahr HF >=160/min, >=1 Jahr HF >=140/min in ausgewählten Diagrammen.

Bewertung:
- Die aktuelle Päd.-Ansicht ist als Entscheidungshilfe unvollständig.
- Die generischen Alters-Normwerte ersetzen die MTS-Diskriminatoren nicht.
- Später sollten AF/HF als strukturierte Werte erfassbar sein und nur in den passenden Diagrammen wirken.

### Sepsis / qSOFA – ROT
Aktueller Code:
- qSOFA >=2 erzeugt direkt „Verdacht auf Sepsis!“.

Aktuelle MTS-Unterlagen 2025:
- „Sepsisverdacht“ ist ein eigener MTS-Indikator.
- Andere nationale Sepsistools können ergänzend statt qSOFA verwendet werden.
- qSOFA ist damit nicht identisch mit dem MTS-Sepsisindikator.

Bewertung:
- Die aktuelle Formulierung ist medizinisch und UX-seitig zu absolut.
- qSOFA muss als Zusatztool vom MTS-Core getrennt werden.
- Ein positives qSOFA-Ergebnis darf nicht als Diagnose oder als alleiniger MTS-Trigger dargestellt werden.

### Psychiatrie – GELB
Die 6. deutsche Auflage 2025 beschreibt eine grundlegende Überarbeitung psychiatrischer Diagramme und Indikatoren.
Aktueller Code enthält „Auffälliges Verhalten“, „Psychische Erkrankung“ und „Selbstverletzung“, jedoch ohne nachgewiesene Versionierung.
Bewertung:
- Diese drei Bereiche werden in einem eigenen Auditblock vollständig gegen aktuelle Referenzen geprüft.
- Bis dahin Status GELB, nicht freigegeben als „aktuell verifiziert“.

## Erste Freigabeempfehlung
Noch keine Änderungen am MTS-Core umsetzen.
Nächster Schritt:
1. komplette Klassifikation der 52/55 Diagramme,
2. Sondermodule abtrennen,
3. danach Änderungspaket A „Sicherheitsbugs ohne medizinische Neudefinition“ zur Freigabe vorlegen.

# ABSCHLUSSAUDIT V2

## Methodische Grenze
Die öffentlich zugängliche Referenz bestätigt die Struktur der deutschen 6. Auflage 2025 (Third Edition v3.8), 52 reguläre Notfallsituationen sowie wesentliche Neuerungen. Die vollständigen urheberrechtlich geschützten Diagramme und jede einzelne Diskriminatorzeile stehen öffentlich nicht vollständig zur Verfügung. Daher bedeutet „plausibel“ in diesem Audit nicht „wortgleich gegen das komplette Lehrbuch verifiziert“. Vor einer produktiven klinischen Freigabe ist eine lizenzierte Vollreferenz bzw. institutionelle Validierung notwendig.

## 1. Klassifikation aller 55 aktuellen Datensätze

Legende:
- GELB-MTS: plausibles reguläres MTS-Präsentationsdiagramm, Detailinhalt gegen Vollreferenz zu prüfen
- ROT: aktuelle Implementierung enthält problematische/zu pauschale Logik
- BLAU: Sonder-/Zusatzmodul, getrennt vom normalen MTS-Workflow behandeln
- WEISS: App-Hilfsfunktion, kein eigenständiges MTS-Diagramm

| ID | Aktueller Datensatz | Status | Auditbewertung |
|---:|---|---|---|
|1|Abdominelle Schmerzen bei Erwachsenen|GELB-MTS|Diagramm plausibel; aktuelle Indikatorauswahl nur Teilmenge und nicht als vollständiges MTS ausgeben.|
|2|Abdominelle Schmerzen bei Kindern|GELB-MTS|Pädiatrische Aktualisierungen 2025 berücksichtigen; „schlaffes Kind“/Temperaturkonzept prüfen.|
|3|Abszesse und lokale Infektionen|GELB-MTS|Plausibel; Sepsis nicht über eigene Fieberheuristik ableiten.|
|4|Allergie|GELB-MTS|Plausibel; Atemwegs-/Schockindikatoren sauber vom Therapieteil trennen.|
|5|Angriff Zustand nach|GELB-MTS|Plausibel; Trauma-/Blutungslogik gegen Vollreferenz prüfen.|
|6|Asthma|ROT/GELB-MTS|COPD wird in Keywords vermischt; globale SpO2-Regel ist zu grob.|
|7|Atemproblem bei Erwachsenen|ROT/GELB-MTS|„Belastungsdyspnoe => Orange“ als eigene SOP-Regel nicht ausreichend belegt; diagrammbezogene O2-Logik erforderlich.|
|8|Atemproblem bei Kindern|ROT/GELB-MTS|Pädiatrische AF/HF-Trigger fehlen strukturiert; aktuelle 2025-Päd.-Logik ergänzen.|
|9|Auffälliges Verhalten|GELB-MTS|Psychiatrische Inhalte wurden 2025 grundlegend überarbeitet; vorerst nicht als aktuell verifiziert kennzeichnen.|
|10|Augenprobleme|GELB-MTS|Plausibel; genaue Indikatorstufen prüfen.|
|11|Besorgte Eltern|GELB-MTS|Plausibel; pädiatrische Aktualisierung prüfen.|
|12|Betrunkener Eindruck|ROT/GELB-MTS|Default b:3 führt ohne ausgewählten Indikator direkt zu Gelb; diese Basiseinstufung ist kritisch zu validieren.|
|13|Bisse und Stiche|GELB-MTS|Plausibel; Allergie-/Infektionsrisiko nicht mit Therapie verwechseln.|
|14|Chemikalienkontakt|GELB-MTS|Plausibel; Dekontamination ist Prozess/SOP, nicht MTS.|
|15|Diabetes|ROT/GELB-MTS|Hypoglykämie/Hyperglykämie mit Ketose und aktuelle Definitionen benötigen saubere Mess-/Symptomlogik.|
|16|Durchfälle und Erbrechen|GELB-MTS|Plausibel; Kinder benötigen nach neuer Version differenzierte Betrachtung.|
|17|Extremitätenprobleme|ROT/GELB-MTS|Fehlstellung, Ischämie etc. plausibel; TVT als Keyword ist symptomatisch möglich, darf aber keine Diagnoseauswahl suggerieren.|
|18|Fremdkörper|ROT/GELB-MTS|2025 enthält neuen Indikator für gefährliche Fremdkörper; aktuelle vereinfachte Batterie-Regel reicht nicht.|
|19|Gastrointestinale Blutung|GELB-MTS|Plausibel; Kreislauf-/Blutungsdefinitionen vollständig prüfen.|
|20|Gesichtsprobleme|GELB-MTS|Plausibel.|
|21|Halsschmerzen|GELB-MTS|Plausibel; gefährdeter Atemweg korrekt priorisieren.|
|22|Hautausschläge|GELB-MTS|Plausibel; Petechien/Fieber-Logik gegen aktuelle Definition prüfen.|
|23|Herzklopfen|ROT/GELB-MTS|HF >150 als pauschaler Spezialindikator ist gegen Vollreferenz zu prüfen; Vitalparameter nicht frei erfinden.|
|24|Hinkendes Kind|GELB-MTS|Plausibel; neue Päd.-Indikatoren berücksichtigen.|
|25|Hodenschmerz|ROT/GELB-MTS|Zeitkritische Erkrankung plausibel, aber „Verdacht auf Hodentorsion = Orange“ darf nur übernommen werden, wenn im aktuellen Diagramm so abgebildet.|
|26|Irritables oder unruhiges Kind|GELB-MTS|Pädiatrische Aktualisierungen nötig.|
|27|Körperstammverletzung|ROT/GELB-MTS|Auffälliger Verletzungsmechanismus im aktuellen Code unvollständig/uneinheitlich.|
|28|Kollaps|GELB-MTS|Plausibel; Ursachen nicht diagnostisch vorwegnehmen.|
|29|Kopfschmerz|ROT/GELB-MTS|Neues neurologisches Defizit/anhaltender frischer Schwindel müssen aktueller definiert werden.|
|30|Kopfverletzung|ROT/GELB-MTS|Antikoagulation-Sonderregel aktuell frei formuliert; gegen aktuelle MTS-Definition validieren.|
|31|Krampfanfall|ROT/GELB-MTS|Status epilepticus ist hochkritisch; frischer anhaltender Schwindel/neurologische Updates berücksichtigen.|
|32|Nackenschmerz|GELB-MTS|Plausibel; Meningismus/Neurologie vollständig prüfen.|
|33|Ohrenprobleme|GELB-MTS|Plausibel.|
|34|Psychische Erkrankung|GELB-MTS|2025 grundlegend überarbeitet, derzeit nicht verifiziert.|
|35|Rückenschmerz|ROT/GELB-MTS|Default b:3 macht jeden geöffneten Rückenschmerz ohne Auswahl Gelb; zusätzlich frei formulierte <24h/>24h-Regel problematisch.|
|36|Schreiendes Baby|GELB-MTS|Pädiatrische Aktualisierung und „schlaffes Kind“ beachten.|
|37|Schwangerschaftsproblem|GELB-MTS|Plausibel; obstetrische Warnzeichen vollständig validieren.|
|38|Schweres Trauma|ROT/GELB-MTS|Verkehrsunfall-Sonderregel „unpassend => Gelb“ ist fachlich unklar; Mechanismus sauber abbilden.|
|39|Selbstverletzung|GELB-MTS|Psychiatrische 2025-Revision zwingend berücksichtigen.|
|40|Sexualinfektion|GELB-MTS|Plausibilität als Präsentation prüfen; aktuelle Benennung/Diagrammbezeichnung gegen Vollreferenz verifizieren.|
|41|Stürze|ROT/GELB-MTS|Pauschal „Fahrradsturz = Orange“ und „Sturz aus eigener Körperhöhe = Orange“ entfernen/ersetzen durch definierte Mechanismuslogik.|
|42|Thoraxschmerz|ROT/GELB-MTS|„Thoraxschmerzen (AP) immer Orange“ zu pauschal; kardialer Schmerz ist der relevante Diskriminator.|
|43|Überdosierung und Vergiftung|ROT/GELB-MTS|Toxizität und Suizidalität plausibel, aber Zusatz-Toxboard/Antidote strikt trennen.|
|44|Unwohlsein bei Erwachsenen|ROT/GELB-MTS|Sepsisindikator und qSOFA sauber trennen; GCS globale Regel nicht als Ersatz für Diagrammindikator verwenden.|
|45|Unwohlsein bei Kindern|ROT/GELB-MTS|2025 neu differenziert; aktuelle vereinfachte Implementierung reicht nicht.|
|46|Unwohlsein bei Neugeborenen|ROT/GELB-MTS|Kindliche Temperaturindikatoren 2025 verändert; aktuelle >38°C-Pauschalregel validieren.|
|47|Unwohlsein bei Säuglingen|ROT/GELB-MTS|2025 neue Differenzierung; derzeit nicht ausreichend aktuell.|
|48|Urologisches Problem|ROT/GELB-MTS|„Harnverhalt + starke Schmerzen => Orange“ und Anurie-Regel gegen Vollreferenz prüfen.|
|49|Vaginale Blutung|GELB-MTS|Plausibel; Schwangerschaft/EUG/Blutung exakt validieren.|
|50|Verbrennungen und Verbrühungen|ROT/GELB-MTS|KOF-Grenzen im Code sind zu prüfen; Alter/Körperregion/Inhalation getrennt abbilden.|
|51|Wunden|GELB-MTS|Plausibel; Blutungsdefinitionen und neurovaskuläre Kriterien exakt prüfen.|
|52|Zahnprobleme|GELB-MTS|Plausibel; Hogrefe beschreibt Spektrum ausdrücklich bis Zahnschmerz.|
|53|Generelle Indikatoren|BLAU/MTS-Sonderdiagramm|Ist ein zusätzliches Präsentationsdiagramm und soll laut aktueller Forschung nur in Ausnahmefällen verwendet werden. Nicht wie reguläres Beschwerdediagramm listen.|
|54|Massenanfall primäres Diagramm|BLAU|MANV/Sichtung ist Sonderbetrieb. Aktueller Datensatz mit 4/5 MTS-Stufen passt nicht zur veröffentlichten Massenanfall-Logik mit Sichtungskategorien.|
|55|Massenanfall sekundäres Diagramm|BLAU/ROT|Zweites eigenständiges MANV-Diagramm ist in der öffentlich geprüften Referenz so nicht belegt. Aktuelle Logik daher nicht als MTS ausweisen.|

### Ergebnis der 55er-Klassifikation
- Regulärer Kern: IDs 1–52 als Präsentationsbereiche grundsätzlich plausibel, aber zahlreiche Detailindikatoren sind nicht vollständig verifiziert.
- ID 53: MTS-Sonderdiagramm „Generelle Indikatoren“, Ausnahmefall.
- IDs 54–55: aus dem normalen MTS-Workflow entfernen und als gesondertes MANV/Sichtungsmodul neu validieren.
- Kein Datensatz darf allein durch einen frei gesetzten Basiswert `b` zu einer klinisch wirksamen Stufe führen, solange diese Basiseinstufung nicht aus der Referenz belegt ist.

## 2. Generelle Indikatoren und Entscheidungsengine – ROT

### Aktueller Fehler
Die App mischt:
1. generelle Indikatoren,
2. spezielle Diagrammindikatoren,
3. eigene SOP-Höherstufungen,
4. globale Vitalwertregeln.

Dadurch entsteht eine synthetische Einstufung, die nicht transparent genug dem eigentlichen MTS-Entscheidungsweg entspricht.

### Erforderliche V2-Regel
- Jede Dringlichkeitsänderung besitzt Quelle/Typ:
  - MTS-generell
  - MTS-speziell
  - MTS-Vitalparameter
  - lokale SOP
  - klinischer Hinweis
- Nur MTS-Elemente dürfen die angezeigte MTS-Farbe erzeugen.
- Lokale SOP darf Warnungen/Workflow auslösen, aber nicht heimlich die MTS-Farbe verändern.
- Eine einmal ausgelöste höhere Priorität darf niemals durch einen weniger dringlichen Trigger heruntergestuft werden.

## 3. Schmerz – ROT/GELB

Aktuell:
- NRS 8–10 => Gelb
- NRS 5–7 => Grün
- NRS 1–4 => Blau/leichter Schmerz

Problem:
- Die 6. Auflage 2025 hat das Schmerzmeter ausdrücklich angepasst.
- MTS-Schmerz ist nicht sauber durch eine nackte NRS-Spanne ersetzbar; Kontext, beobachtete/berichtete Intensität und definierte MTS-Schmerzindikatoren sind relevant.

V2:
- NRS als dokumentierter Messwert anzeigen.
- MTS-Schmerzindikator separat bestimmen.
- Keine globale NRS->Farbe-Abkürzung ohne validierte aktuelle Zuordnung.

## 4. Vitalparameter – ROT/GELB

Aktuell erfasst: GCS, SpO2, Temperatur, NRS.
Es fehlen im Triagefenster: AF, HF, systolischer RR.

Probleme:
- globale Regeln statt diagrammbezogener MTS-Parameter,
- Kinderwerte überwiegend nur als Text,
- COPD-Sonderannahmen im Cheatsheet,
- qSOFA in GCS-Modal vermischt.

V2:
- strukturierte Vitalwerte: AF, SpO2, HF, RR syst., Temperatur, GCS/AVPU, Schmerz.
- Alter/Kindergruppe explizit.
- MTS-Vitalparameter nur dort triggern, wo die aktuelle MTS-Referenz sie vorsieht.
- NEWS2/qSOFA optional als klar separater Zusatzscore.

## 5. Pädiatrie – ROT/GELB

Bestätigte 2025er Weiterentwicklung:
- kindliche Temperaturindikatoren verändert,
- „Unwohlsein beim Kind“ neu differenziert,
- internationale Weiterentwicklung: „schlaffes Kind“ in pädiatrischen Diagrammen,
- altersabhängige AF/HF-Grenzen.

Aktuelle App:
- grobe Altersnormwerttabellen,
- keine echte AF/HF-Eingabe,
- diverse pädiatrische Warnzeichen nur in einzelnen selbst zusammengestellten Listen.

V2:
- eigenes pädiatrisches Regelprofil.
- Alter als Pflichtkontext für Kinderdiagramme.
- passende MTS-Päd.-Indikatoren kontextbezogen.
- keine pauschale Erwachsenenlogik auf Kinder anwenden.

## 6. Psychiatrie / Suizidalität – GELB mit Sperrvermerk

Die 6. Auflage 2025 hat psychiatrische Diagramme und Indikatoren grundlegend überarbeitet.
Daher:
- IDs 9, 34, 39 nicht als „aktuell verifiziert“ ausgeben.
- Trainingsfälle mit Suizidalität/Agitiertheit ebenfalls neu validieren.
- Fremd-/Eigengefährdung bleibt klinisch hoch relevant, genaue Stufenzuordnung jedoch nur nach aktueller Referenz.

## 7. Sepsis / qSOFA – ROT

Aktuell:
- qSOFA >=2 => „Verdacht auf Sepsis!“

Korrekturkonzept:
- qSOFA ist Risikowerkzeug, keine Diagnose.
- aktuelles MTS hat einen Sepsisverdacht-Indikator.
- qSOFA/andere nationale Sepsistools können ergänzend sein.
- UI künftig: „qSOFA erhöht / klinische Sepsisabklärung nach lokalem Standard erwägen“, getrennt von MTS.

## 8. Tox Board – BLAU/ROT

Das Tox Board ist kein MTS-Modul, sondern eine klinische Zusatzhilfe.
Probleme:
- konkrete Antidot-Dosen wirken therapieanweisend,
- „KEINE Betablocker!“ bei Kokain/Amphetaminen ist zu pauschal,
- Flumazenil ist besonders kontextabhängig und birgt relevante Risiken,
- hochdosiertes Insulin/Glukagon bei Betablockerintoxikation gehört in SOP/Giftnotruf-/ärztlichen Entscheidungsrahmen.

V2:
- Tox Board komplett aus MTS-Core herauslösen.
- höchstens Toxidrom-Erkennung + Hinweis „Giftnotruf/lokale SOP“.
- konkrete Medikamentendosierungen nur aus freigegebener institutioneller SOP.

## 9. Action Checklist – BLAU/ROT

Aktuell erzeugt die App Behandlungsschritte nach MTS-Farbe/Kategorie.
Beispiele:
- O2 max.
- PVK/IO
- Labor/Troponin
- Immobilisation
- Röntgenanforderung
- Antipyrese/Analgesie

Bewertung:
- Kein MTS.
- Teilweise fachlich zu pauschal.
- Muss als lokales SOP-Modul separat versioniert und administrativ freigegeben werden.

## 10. Training – ROT

Gefundene Probleme:
- Dringlichkeitsantwort wird technisch nicht bewertet.
- Score zählt aktuell nur Diagrammwahl.
- einige Fallauflösungen beruhen auf den problematischen Eigenregeln.
- Diagnosebegriffe wie „Pankreatitis“, „Lungenembolie“, „SAB“, „Hodentorsion“ fördern diagnostisches Denken, obwohl MTS symptomorientiert arbeitet.
- ein Stroke-Fall ist an Diagramm „Kopfschmerz“ gebunden, obwohl die Wahl vom präsentierten Hauptproblem abhängen muss.

V2:
- getrennte Punkte für Diagrammwahl und Dringlichkeitsstufe.
- Begründung über gewählten Diskriminator statt Diagnose.
- Fälle versionieren und fachlich freigeben.
- Fehlerstatistik für Lernzwecke, nicht für klinische Dokumentation.

## 11. Suche – GELB

Stärken:
- Synonyme und freie Suchbegriffe sind im Alltag hilfreich.
- keine KI/Blackbox notwendig.

Probleme:
- Diagnosebegriffe und Symptome sind vermischt.
- Keyword-Matching kann ein falsches Diagramm zu hoch ranken.
- Suchscore ist nicht medizinisch validiert.
- Nutzer kann Treffer als Empfehlung missverstehen.

V2:
- Suche ausdrücklich „Diagramm finden“, nicht „Triage bestimmen“.
- Symptome höher gewichten als Diagnosen.
- kritische Treffer nicht automatisch farblich priorisieren.
- Treffergrund anzeigen („gefunden über: Atemnot“).
- optional Favoriten/Häufige Diagramme.

## 12. Bodymap – WEISS/GELB

Bodymap ist Navigation, keine medizinische Logik.
Problem:
- Regionen verknüpfen teilweise sehr breit mit Kategorien und können unpassende Diagramme suggerieren.
V2:
- nur als Filter/Navigationshilfe.
- Text „mögliche Präsentationsdiagramme“, niemals automatische Auswahl.
- Körperseite und Region können moderner visualisiert werden.

## 13. MANV – BLAU/ROT

Öffentlich publizierte MTS-Massenanfalllogik unterscheidet sich grundsätzlich vom normalen 5-Stufen-Alltags-MTS und arbeitet mit Sichtungskategorien.
Daher:
- IDs 54/55 aus der normalen Diagrammliste herausnehmen.
- eigenständiger Modus „MANV / klinische Sichtung“.
- nur nach eigener validierter Quelle/SOP produktiv nutzen.
- keine Mischung der MANV-Kategorien mit Rot/Orange/Gelb/Grün/Blau des normalen MTS.

## 14. ISBAR – BLAU

Nützliche Zusatzfunktion.
Probleme:
- generiert aktuell „Bitte um zügige ärztliche Sichtung gemäß MTS Vorgabe“ unabhängig von Kontext.
- Patientendaten könnten später versehentlich dauerhaft gespeichert werden.

V2:
- ISBAR klar als Kommunikationshilfe.
- nichts personenbezogen dauerhaft speichern.
- automatische Felder transparent anzeigen.
- keine Therapieempfehlung.

## 15. Verlauf / Datenschutz – ROT für produktive Patientendaten

Aktuell:
- Speicherung in browser-localStorage.
- Export JSON/CSV.
- max. 200 Einträge.
- Name/Alter werden aktuell nicht gespeichert, aber die Funktion lädt zur Nutzung als Verlauf ein.

Risiken:
- Gerät gemeinsam genutzt.
- kein Benutzer-/Rollenmodell.
- keine Verschlüsselung.
- keine Lösch-/Aufbewahrungsrichtlinie.
- keine Audit-Trail-Integrität.
- Export kann unkontrolliert auf Endgerät landen.

V2-Empfehlung:
- Für klinische Produktionsnutzung zunächst KEINE personenbezogenen Patientendaten speichern.
- Verlauf primär als anonymisierte lokale Lern-/Nutzungsstatistik oder ganz entfernen.
- Klinische Dokumentation gehört in das freigegebene KIS, nicht in diese PWA, solange keine institutionelle Datenschutz-/IT-Freigabe existiert.

## 16. PWA / Offline – ROT/GELB

Aktuell:
- Service Worker wird dynamisch aus einem Blob registriert.
- Cache-Name fest `mts-v1`.
- nur '/' wird gecacht.
- externe Fonts/FontAwesome sind nicht zuverlässig offline.
- kein sauberer Update-/Cache-Invalidierungsmechanismus.
- PWA kann dadurch alte medizinische Inhalte weiter anzeigen.

Das ist bei medizinisch versionierten Regeln besonders problematisch.

V2:
- echter service-worker.js.
- versionsgebundener Cache.
- sichtbare App-/Regelversionsnummer.
- kontrollierter Update-Hinweis.
- kritische medizinische Daten nicht unbemerkt aus altem Cache verwenden.
- Offlinefähigkeit explizit testen.

## 17. UI/UX – GELB

Aktuelle UI ist ordentlich, aber für Stressbetrieb zu informationsreich in einem Modal.

Ziel V2:
- drei klar getrennte Ebenen:
  1. Präsentationsdiagramm wählen,
  2. Diskriminatoren von höchster zu niedrigster Dringlichkeit prüfen,
  3. Ergebnis + Entscheidungsgrund.
- Rot/Orange nur für echte klinische Dringlichkeit verwenden.
- dezente Pulsanimation ausschließlich bei aktivem kritischem Ergebnis/offenem kritischem Schritt.
- keine Daueranimation im Normalbetrieb.
- sticky Ergebnisleiste.
- „Warum diese Stufe?“ mit Entscheidungsweg.
- große Touchflächen für Arbeitsplatz-PC/Tablet.
- Dark Mode behalten, aber Kontrast/Barrierefreiheit prüfen.
- Behandlung/SOP in separatem nachgeordnetem Bereich.

## 18. Architektur – ROT

Aktuell eine index.html ~102 KB mit CSS, Daten, Regeln und Logik.

V2-Struktur empfohlen:
```
/index.html
/assets/
/css/app.css
/js/app.js
/js/search.js
/js/triage-engine.js
/js/training.js
/js/storage.js
/data/mts-flowcharts.js
/data/mts-discriminators.js
/data/clinical-addons.js
/data/local-sop.js
/service-worker.js
/version.json
/tests/
```

Wichtig:
- Daten von Entscheidungsengine trennen.
- Regeln maschinenlesbar mit Quelle, Versionsstand, Status und Reviewdatum.
- automatisierte Tests für „höhere Priorität darf nie heruntergestuft werden“.
- Tests für jeden freigegebenen Trainingsfall.

## 19. Doppelte technische Prüfung des Ist-Zustands

### Check A – Entscheidungslogik
Bestätigt:
- Sonderregeln können höher priorisierte Ergebnisse herunterstufen.
- Training bewertet Stufe nicht.
- Defaultwerte `b` können ohne aktive Auswahl bereits eine Stufe erzwingen.
- globale Vitalregeln wirken unabhängig vom Diagramm.

### Check B – Seiteneffekte / Betrieb
Bestätigt:
- medizinische Daten und UI sind eng gekoppelt.
- Service-Worker-Versionierung unzureichend.
- lokaler Verlauf ist keine klinisch belastbare Dokumentation.
- externe Ressourcen schwächen Offlinezuverlässigkeit.
- keine Regel-/Quellenversion wird in der UI angezeigt.

## 20. Freigabeampel des jetzigen Programms

### GRÜN – kann als Konzept erhalten bleiben
- Suche als Diagrammfinder
- Bodymap als Navigation
- Dark/Focus Mode
- ISBAR als separate Hilfsfunktion
- Trainingsidee
- Export für rein anonymisierte Lernhistorie
- fünf MTS-Farben und Wartezeiten als UI-Grundstruktur

### GELB – überarbeiten/validieren
- IDs 1–52 und deren genaue Diskriminatoren
- Päd.-Regeln
- Psychiatrie
- Schmerz
- Vitalparameter
- Suchranking
- Trainingstexte
- GCS als Hilfstool

### ROT – vor klinischem Einsatz korrigieren
- mögliche Herunterstufung durch Sonderregeln
- nicht bewertete Trainingsstufe
- qSOFA-Ausgabe als „Verdacht auf Sepsis“
- globale erfundene/vereinfachte Farbtrigger
- unvalidierte Basisstufen `b`
- MANV als normales MTS-Modul
- Tox-Antidot-/Therapieanweisungen im selben Produktbereich
- Action Checklist als scheinbarer Teil von MTS
- medizinische Regeln ohne Versions-/Quellenstatus
- produktive Patientendatenspeicherung im localStorage

## 21. Empfohlene Umsetzungspakete

### Paket A – Sicherheitsreparatur, keine neue medizinische Logik
1. Herunterstufungsbug entfernen.
2. Training Dringlichkeitsantwort korrekt bewerten.
3. qSOFA-Text entschärfen und als Zusatztool markieren.
4. MTS, Zusatztool und lokale SOP visuell kennzeichnen.
5. MANV aus normaler Diagrammliste herausnehmen/kennzeichnen.
6. Versionsbanner „MTS-Datenbestand in Validierung“ ergänzen.
7. bestehende problematische Sonderregeln deaktivieren statt neu erfinden.
8. keine Änderung der geschützten/unklaren MTS-Diskriminatoren ohne Referenz.

### Paket B – Architektur
- Dateien modularisieren.
- Regelmetadaten einführen.
- Tests aufbauen.
- Service Worker sauber versionieren.
- Backup/Checkpoint nach jedem stabilen Paket.

### Paket C – neues ZNA-Design
- moderner klinischer Cockpit-Look.
- Ebenen, klare Hierarchie, subtile Animation.
- Entscheidungsweg prominent.
- mobile/tablet/desktop responsive.

### Paket D – medizinische V2-Daten
- nur mit lizenzierter/institutionell freigegebener Vollreferenz.
- dann Diagramm für Diagramm final validieren.
- lokale Helios-SOP getrennt ergänzen.

## 22. Auditfazit

Der aktuelle MTS-Checker sollte nicht einfach „auf aktuellen Stand gebracht“ werden, indem einzelne Grenzwerte ersetzt werden. Die sichere Lösung ist eine Neuordnung der Entscheidungsarchitektur.

Die bestehende Anwendung ist eine gute funktionale Basis, aber die medizinische Entscheidungsengine ist derzeit ein Hybrid aus MTS, Heuristik, lokalen Vorstellungen und Zusatztools. Für eine professionelle ZNA-Anwendung muss die Herkunft jeder Entscheidung transparent sein.

Empfohlener nächster Commit nach Nutzerfreigabe:
`checkpoint-A1-safety-fixes`

Vorher keine Änderung an main.


## Paket A abgeschlossen – 2026-10-04

Checkpoint: `checkpoint-A1-safety-fixes`

Umgesetzt:
- alte lokale Sonderregeln `d.r` aus der MTS-Einstufungsengine entfernt; sie werden nur noch als deaktivierter Altbestand angezeigt.
- damit ist die bekannte Herunterstufung einer höheren Dringlichkeit durch eine weniger dringliche Sonderregel beseitigt.
- qSOFA sichtbar als klinisches Zusatztool getrennt; Formulierung „Verdacht auf Sepsis!“ entfernt.
- Action Checklist als klinische Zusatzhinweise und ausdrücklich nicht als Teil der MTS-Einstufung markiert.
- Trainingsmodus bewertet Diagrammwahl und Dringlichkeitsstufe jetzt separat.
- falsche Dringlichkeitsauswahl wird sichtbar markiert; richtige Lösung und getrennte Scores werden angezeigt.
- MANV-Altmodule als eigener Sonderbereich gekennzeichnet und vom regulären MTS-Workflow abgegrenzt.
- Tox Board sichtbar als klinisches Zusatzmodul markiert; Therapieangaben als zu validierender Altbestand gekennzeichnet.
- sichtbarer Validierungsstatus in der Anwendung ergänzt.
- Laufzeit-Selbsttests für Kern-Sicherheitsbedingungen ergänzt.

Doppelte Prüfung:
1. gesamter Inline-JavaScript-Block syntaktisch erfolgreich kompiliert.
2. gezielte Prüfung der Funktion `rOvl()`: keine `d.r`-Mutation der Stufe mehr; Minimum-Logik der gewählten MTS-Diskriminatoren und Vitalparameter bleibt erhalten.
3. Diff gegen `backup/pre-safety-fixes`: nur `index.html`, 79 Ergänzungen / 48 Löschungen.
4. `main` wurde nicht verändert.

Noch bewusst nicht umgesetzt:
- endgültige Aktualisierung aller geschützten MTS-Diskriminatoren.
- große Architekturmodernisierung.
- finales ZNA-Redesign.
- institutionell freigegebene lokale SOP.


## Paket B abgeschlossen – Architekturmodernisierung

Checkpoint: `checkpoint-B1-architecture`

### Neue Struktur
- `index.html`: nur noch App-Shell und Script-/Style-Einbindung
- `css/app.css`: gesamte Darstellung
- `data/mts-data.js`: MTS-Kerndaten, Navigation und Stufen
- `data/clinical-addons.js`: klinische Zusatzdaten, aktuell Tox
- `data/training-cases.js`: Trainingsfälle
- `js/app.js`: Anwendungslogik
- `service-worker.js`: versionierter Offline-Cache
- `version.json`: App-/Validierungsmetadaten

### Wichtige Architekturverbesserungen
- index.html von ca. 106 KB auf ca. 6 KB reduziert.
- medizinische Daten von Anwendungslogik und CSS getrennt.
- klinische Zusatzdaten und Trainingsfälle zusätzlich vom MTS-Kern getrennt.
- dynamischer Blob-Service-Worker entfernt und durch echte versionierte Datei ersetzt.
- alter Cache wird beim Aktivieren eines neuen Service Workers gelöscht.
- Daten-/App-Version ist separat maschinenlesbar dokumentiert.

### Doppelte technische Prüfung
1. Syntaxprüfung erfolgreich für:
   - data/mts-data.js
   - data/clinical-addons.js
   - data/training-cases.js
   - js/app.js
   - service-worker.js
2. Datenintegrität:
   - 55 Datensätze erhalten
   - alle IDs eindeutig
   - 5 MTS-Stufen erhalten
   - 45 Trainingsfälle erhalten
   - alle Trainingsdiagramm-Referenzen gültig
   - alle Bodymap-Referenzen gültig
3. HTML:
   - CSS extern geladen
   - Inline-Styleblock entfernt
   - Inline-Appscript entfernt
   - Script-Reihenfolge Daten -> Zusatzdaten -> Training -> App korrekt
   - kritische DOM-Anker erhalten
4. Service Worker:
   - alle App-Shell-Dateien im Cache
   - Cache-Invalidierung vorhanden
   - clients.claim vorhanden
5. Diff gegen backup/pre-architecture-b:
   - ausschließlich Struktur-/Dateiaufteilung
   - keine medizinische Regeländerung in Paket B

### Noch offen
- lokale SOP vollständig aus den MTS-Datensätzen herausmodellieren
- echte automatisierte Test-Suite/CI
- finales ZNA-UI-Redesign
- vollständige fachliche Validierung gegen lizenzierte MTS-Vollreferenz
