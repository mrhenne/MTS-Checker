# TriageAssist

TriageAssist ist eine browserbasierte Entscheidungshilfe für geschulte Anwender des Manchester Triage Systems (MTS) in der Zentralen Notaufnahme.

## Status

Aktueller Entwicklungsstand: **2.0.0-rc1**

- Architecture: B1
- UI: C1
- Medical Model: D1
- Validation Center: E1
- Quality System: F1

**Wichtig:** Der medizinische Datenbestand ist noch nicht vollständig gegen eine lizenzierte aktuelle MTS-Vollreferenz validiert. Der Release Candidate ist daher nicht als institutionell freigegebene klinische Produktivversion zu verstehen.

## Sicherheitsprinzipien

- Eine MTS-Stufe entsteht nur durch explizit gewählte Diskriminatoren.
- Keine automatische Basiseinstufung.
- Keine globale automatische Einstufung über GCS, SpO2, Temperatur oder NRS.
- Lokale Altregeln sind technisch vom MTS-Kern getrennt.
- qSOFA, Tox-Hinweise und lokale Maßnahmen sind Zusatzmodule und kein MTS.
- MANV ist vom regulären MTS-Workflow getrennt.
- Validierungsstatus und lokale Freigaben verändern niemals die Triage-Engine.

## Projektstruktur

```
index.html
css/app.css
js/app.js
data/mts-data.js
data/clinical-addons.js
data/training-cases.js
data/local-sop.js
tests/triage-regression.js
tests/run-tests.cjs
tests/index.html
service-worker.js
version.json
AUDIT_V2.md
.github/workflows/quality.yml
```

## Qualitätsprüfung

Lokal / CI:

```bash
node tests/run-tests.cjs
```

Die GitHub Action prüft zusätzlich die JavaScript-Syntax.

## Validierungsworkflow

Im Menü **Validierung** kann jedes Diagramm den Status Ungeprüft, In Prüfung, Geprüft, Lokal freigegeben oder Gesperrt erhalten. Zusätzlich können Quelle, Reviewer, Reviewdatum und Notizen hinterlegt sowie exportiert/importiert werden.

Diese Metadaten sind bewusst von der Triage-Engine entkoppelt.

## Rückkehrpunkte

Wichtige Checkpoints wurden während der Entwicklung als Branches gesichert, unter anderem:

- checkpoint-A1-safety-fixes
- checkpoint-B1-architecture
- checkpoint-C1-zna-cockpit
- checkpoint-D1-medical-model
- checkpoint-E1-validation-center

Siehe `AUDIT_V2.md` für die vollständige Änderungshistorie und bekannte offene Punkte.
