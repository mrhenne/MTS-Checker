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
