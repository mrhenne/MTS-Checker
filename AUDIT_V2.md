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
