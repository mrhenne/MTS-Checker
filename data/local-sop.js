/* Legacy local / heuristic rules extracted from the MTS core.
 * They are intentionally disabled and MUST NOT alter the MTS classification.
 * Retained only for review and migration into a future institutionally approved SOP layer.
 */
const LOCAL_RULES = Object.freeze({
  "7": [
    {
      "l": "Belastungsdyspnoe",
      "v": 2,
      "t": "Mindestens Gelb, eher Orange prüfen"
    }
  ],
  "30": [
    {
      "l": "Sturz auf Kopf + Antikoagulantien",
      "v": 2,
      "t": "Auffälliger Mechanismus (Orange) oder Blutungsneigung (Gelb)"
    }
  ],
  "35": [
    {
      "l": "Ausstrahlung ins Bein (< 24 Std)",
      "v": 2,
      "t": "Neurologisches Defizit akut auf Orange"
    },
    {
      "l": "Ausstrahlung ins Bein (> 24 Std)",
      "v": 3,
      "t": "Chronisch auf Gelb"
    }
  ],
  "38": [
    {
      "l": "Verkehrsunfall (mit RTW) unpassend",
      "v": 3,
      "t": "Trauma auf Gelb"
    }
  ],
  "41": [
    {
      "l": "Fahrradsturz",
      "v": 2,
      "t": "Auffälliger Verletzungsmechanismus auf Orange"
    },
    {
      "l": "Sturz aus eigener Körperhöhe",
      "v": 2,
      "t": "Auffälliger Verletzungsmechanismus auf Orange"
    }
  ],
  "42": [
    {
      "l": "Thoraxschmerzen (AP)",
      "v": 2,
      "t": "Immer Orange"
    }
  ]
});
