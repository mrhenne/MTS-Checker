# TriageAssist 2.0.0 RC11 — Vital Segments O1

Datum: 2026-10-05

## Neue Vitalansicht
- bisherige gedrungene Einzelkästchen durch zusammenhängende Segmentleisten ersetzt
- Desktop: 2-spaltige Vitalansicht statt zu schmaler Karten
- Mobile: 1-spaltige Karten mit touchfreundlichen Segmenten
- gemessener Wert hebt den passenden Bereich automatisch hervor
- farbige Segmente sind direkt anklickbar und setzen bewusst eine manuelle Priorisierung
- neutrale Bereiche bleiben nicht anklickbare Informationssegmente
- angeklickte Segmente bleiben sichtbar aktiv

## GCS
- keine numerische Farbleiste
- Erwachsene: klinische Karten „Bewusstsein unverändert“ und „Bewusstsein verändert → Orange“
- Pädiatrie: „nur Ansprache/Schmerz → Orange“ und „nicht ansprechbar → Rot“
- GCS Summenwert bleibt separat dokumentierbar

## Sicherheit
- keine automatische MTS-Farbe durch Vitalwerte
- manuelle Auswahl bleibt nachvollziehbar
- bestehende höhere MTS-Stufe kann durch Segmentklick nicht herabgestuft werden

## Prüfung
- Layout-/Responsive- und Funktionsprüfung separat durchgeführt
- UI-Verträge zusätzlich im CI verankert
