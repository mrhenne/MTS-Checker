# TriageAssist 2.0.0 RC5

Datum: 2026-10-04

## Verlauf J1
- gespeicherte Einschätzungen speichern künftig die exakten ausgewählten Diskriminator-Schlüssel.
- Öffnen aus dem Verlauf stellt Diagramm, Vitalwerte, manuelle Priorisierung und Diskriminatoren wieder her.
- ältere Einträge werden bestmöglich aus gespeicherten Texten rekonstruiert.
- sehr alte Einträge zeigen mindestens die damals gespeicherte Stufe als historischen Verlauf, mit Hinweis dass Detailkriterien damals noch nicht gespeichert wurden.

## Suche H3
- Synonymlexikon auf über 200 Beschwerde-/Alltagsformulierungen erweitert.
- zusätzliche Gruppen für Trauma, Körperverletzung, Neurologie, Atemwege, Kardiologie, Abdomen, Urologie, Pädiatrie, Psychiatrie, Toxikologie, HNO/Auge und Wunden.

## Öffentlicher Zugriff
- RC5 ist für einen stabilen öffentlichen Vercel-Alias vorgesehen, damit die App ohne Vercel-Login auf anderen Rechnern geöffnet werden kann.
- Verlauf und Validierungsdaten bleiben browserlokal und synchronisieren sich nicht automatisch zwischen Computern.

Preview branch: `release/v2-rc5`
