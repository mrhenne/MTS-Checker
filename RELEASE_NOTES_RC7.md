# TriageAssist 2.0.0 RC7 — L1 Workflow Hardening

Datum: 2026-10-04

## L1 Ziel
Den bestehenden Funktionsumfang nicht weiter aufblasen, sondern Suche, lokale Datensicherheit, Triage-Workflow und Offline-Betrieb messbar robuster machen.

## Suchqualität L1
- Suchlogik in eine eigenständige, testbare Engine ausgelagert.
- bestehende Synonyme + semantische Symptom/Körperregion-Logik bleiben kombiniert.
- feste Top-3-Qualitätsmatrix mit typischen ZNA-Eingaben.
- Suchregressionen laufen automatisch in GitHub Actions.
- Beispiele: "Schmerzen Fuß", "Körperverletzung", "Atemnot Kind", "Mundwinkel hängt", "Teerstuhl", "Baby trinkt nicht".
- gewünschtes Diagramm muss in den ersten drei Ergebnissen liegen.

## Triageansicht L1
- Rot und Orange bleiben immer vollständig sichtbar.
- Gelb, Grün und Blau sind standardmäßig kompakt.
- niedrigere Stufen lassen sich gezielt aufklappen.
- eine bereits ausgewählte niedrigere Stufe öffnet automatisch.
- Einstufungsengine selbst wurde dabei nicht verändert.

## Lokales Komplettbackup L1
- vollständiges Backup aller TriageAssist-localStorage-Daten.
- umfasst u. a. Verlauf, Validierungsstatus, Theme/Fokus und weitere App-Einstellungen.
- Restore ersetzt nach expliziter Bestätigung die lokalen App-Daten.
- kein Cloud-Sync, kein Server-Upload.
- bestehender Verlaufsexport bleibt zusätzlich separat verfügbar und wurde eindeutig beschriftet.

## Offline / Update L1
- kontrollierter Service-Worker-Updateflow.
- neue Versionen überschreiben keine laufende Sitzung mehr ungefragt.
- sichtbarer Hinweis "Neue Version verfügbar".
- Aktualisierung wird bewusst durch den Nutzer ausgelöst.
- App-Shell bleibt offline gecacht.
- Navigation und version.json verwenden Network-First mit Offline-Fallback.
- statische Assets werden aus dem Cache bedient und im Hintergrund aktualisiert.

## System Health
- Search Top-3 Quality wird direkt im System-Panel angezeigt.
- Offline-Cache-Status wird geprüft.
- bestehende Safety-, Daten- und Regressionstests bleiben erhalten.

## Sicherheitsgrenze
L1 verändert keine medizinischen Diskriminatorinhalte und fügt keine neue automatische MTS-Einstufungslogik hinzu.

Preview branch: `release/v2-rc7`
