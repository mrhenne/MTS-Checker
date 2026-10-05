# TriageAssist 2.0.0 RC10 — MTS Core Review N1

Datum: 2026-10-05

## Quellenbasis
- Deutschsprachige MTS-Ausgabe, 6. Auflage 2025 (Hogrefe)
- Offizielles deutschsprachiges MTS-Update 2025
- Deutsches Netzwerk Ersteinschätzung

## Korrigiert

### Bewusstsein
- Erwachsene: veränderter Bewusstseinszustand -> Orange.
- Erwachsene: anhaltender Krampfanfall -> Rot.
- Kinder: nicht ansprechbar -> Rot.
- Kinder: Reaktion nur auf Ansprache oder Schmerz -> Orange.
- Bericht über Bewusstlosigkeit -> Gelb.
- pauschale numerische GCS-Rot-Grenzen aus der MTS-Kernlogik entfernt.

### SpO2
- Raumluft <92 % -> sehr niedrig / Orange.
- Raumluft 92–94 % -> niedrig / Gelb.
- unter laufender O2-Gabe <95 % -> sehr niedrig / Orange.
- Messkontext Raumluft/O2-Gabe ist jetzt auswählbar und wird gespeichert.

### Temperatur Erwachsene
- <35,0 °C -> Kalt / Orange.
- 35,0–37,4 °C -> kein Temperatur-Diskriminator.
- 37,5–38,4 °C -> Warm / Grün.
- 38,5–40,9 °C -> Heiß / Gelb.
- >=41,0 °C -> Sehr heiß / Orange.
- Pädiatrische Temperatur wird nicht pauschal mit Erwachsenen-Schwellen bewertet.

### NRS
- bestehende Nutzer-Vorgabe bleibt: 1–3 Grün, 4–6 Gelb, 7–10 Orange.

## Sicherheit
Vitalwerte bleiben Entscheidungshilfen. Sie verändern die MTS-Stufe nicht automatisch.

Preview branch: `release/v2-rc10`
