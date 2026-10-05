# TriageAssist 2.0.0 RC8 — NRS M1

Datum: 2026-10-05

## NRS-Schmerzeinstufung
Die vom Nutzer vorgegebene NRS-Systematik ist nun durchgängig umgesetzt:

- NRS 1–3 -> Stufe 4 (Grün) -> max. 90 Minuten
- NRS 4–6 -> Stufe 3 (Gelb) -> max. 30 Minuten
- NRS 7–10 -> Stufe 2 (Orange) -> max. 10 Minuten

## Angepasst
- generelle Schmerz-Diskriminatoren
- NRS-Hinweise in der Vitalwertansicht
- direkte manuelle Farbauswahl
- farbliche Darstellung des NRS-Feldes
- sichtbare NRS-Kurzskala
- Trainingsfälle mit expliziten NRS-Werten
- Regressionstests gegen die drei NRS-Bänder

## Sicherheitsregel
Die NRS-Eingabe setzt weiterhin nicht automatisch die MTS-Stufe. Sie zeigt die passende Stufe an und bietet die bewusste manuelle Auswahl an. Eine bereits höhere Priorität kann dadurch nicht herabgestuft werden.
