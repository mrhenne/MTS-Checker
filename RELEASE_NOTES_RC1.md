# TriageAssist 2.0.0 RC1

Datum: 2026-10-04

## Zusammenfassung

Der ursprüngliche MTS-Checker wurde technisch und sicherheitsseitig grundlegend überarbeitet. Ziel dieses Release Candidates ist nicht, eine vollständige medizinische Neuvalidierung vorzutäuschen, sondern eine transparente und überprüfbare Basis für die weitere institutionelle MTS-Validierung bereitzustellen.

## Enthalten

### A1 Safety
- Herunterstufungsfehler beseitigt.
- lokale Sonderregeln aus der Einstufungswirkung genommen.
- qSOFA als Zusatztool getrennt.
- Trainingsauswertung repariert.
- MANV und Tox sichtbar getrennt.

### B1 Architecture
- Monolith in CSS, Daten, Logik, Zusatzmodule und Tests aufgeteilt.
- versionierter Service Worker.
- maschinenlesbare Versionsmetadaten.

### C1 ZNA Cockpit
- neuer klinischer Cockpit-Look.
- Online/Offline-Status, Uhrzeit, Version.
- Schnellzugriffe.
- Entscheidungsweg „Warum diese Einstufung?“
- gezielte Pulsanimation nur Rot/Orange.
- Fokus- und Mobile-Optimierung.

### D1 Medical Model
- keine stillen Basisstufen mehr.
- keine globale automatische Vital-/NRS-Triage.
- explizite Einstufung nur über ausgewählte Diskriminatoren.
- lokale Altregeln nach `data/local-sop.js` verschoben.
- Diagramm- und Datenmetadaten eingeführt.

### E1 Validation Center
- Status, Quelle, Reviewer, Reviewdatum und Notizen je Diagramm.
- Export/Import.
- Governance-Metadaten technisch von der Einstufungsengine getrennt.

### F1 Quality System
- reine Regressionstests für Datenintegrität und Sicherheitsinvarianten.
- Browser-Testseite.
- Node-Test-Runner.
- GitHub Actions Quality Gate.
- System Health Panel in der App.

## Noch nicht freigegeben

Folgende Punkte bleiben bewusst offen:

- vollständiger Zeilenabgleich aller Diskriminatoren gegen eine lizenzierte aktuelle MTS-Vollreferenz.
- institutionelle fachliche Freigabe.
- finale lokale SOP-Freigabe.
- produktive Patientendatenspeicherung.
- vollständiger visueller Browser-Smoke-Test der ausgelieferten Branch-Version vor Merge nach `main`.

## Release-Entscheidung

Dieser RC darf als Entwicklungs-, Review- und Trainingsbasis verwendet werden. Ein produktiver klinischer Einsatz sollte erst nach vollständiger fachlicher und institutioneller Validierung erfolgen.
