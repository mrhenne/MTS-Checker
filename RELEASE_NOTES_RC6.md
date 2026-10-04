# TriageAssist 2.0.0 RC6

Datum: 2026-10-04

## Mobile / iPhone K1
- iPhone Safe Areas berücksichtigt.
- horizontale, touchfreundliche Hauptnavigation.
- größere Touch-Flächen und Eingabefelder.
- Vollbild-Triage-Overlay auf Mobilgeräten.
- 16-px-Eingabeschrift zur Vermeidung des iOS-Auto-Zooms.
- mobile Bodymap, Health-, Verlauf- und Validierungsansichten optimiert.
- horizontale Schnellzugriffe und zuletzt verwendete Diagramme.

## Suche H4
- semantische Kombination aus Symptom + Körperregion.
- Beispiel: „Schmerzen Fuß“ erkennt Schmerz + Fuß und priorisiert „Extremitäten-Probleme“.
- Regionen u. a. Fuß/Sprunggelenk, Bein/Hüfte, Arm/Hand, Kopf, Gesicht, Auge, Ohr, Hals, Nacken, Rücken, Thorax, Abdomen, Flanke, Hoden und Haut.
- Symptome u. a. Schmerz, Wunde, Trauma, Schwellung, Taubheit, Schwäche und Fieber.
- bestehendes Synonymlexikon mit >200 Formulierungen bleibt zusätzlich aktiv.

## Training K1
- 20 neue Diagramm-Trainingsfälle.
- Gesamt: 65 Trainingsfälle.
- neue Fälle trainieren bewusst die richtige Präsentationsdiagramm-Auswahl ohne neue unvalidierte Dringlichkeitsstufen zu erfinden.
- bestehende 45 Fälle mit Stufentraining bleiben unverändert erhalten.

## Datenspeicherung
- bleibt vollständig browserlokal. Keine Cloud-Synchronisation.

Preview branch: `release/v2-rc6`
