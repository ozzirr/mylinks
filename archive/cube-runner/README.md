# Cube Runner Archive

Questo folder conserva il mini game del cubo rimosso dalla home attiva.

File inclusi:
- `cube-runner-face.html`: markup originale della faccia del cubo.
- `cube-runner.css`: stili originali del runner.
- `cube-runner.js`: logica originale del runner estratta da `js/main.js`.

Note:
- Il file JS e' salvato come estratto quasi identico all'originale.
- Per riutilizzarlo devi reinserire anche le dipendenze di contesto che aveva in `main.js`:
  - `reduceMotion`
  - `t(key, fallback)`
  - `getCurrentLanguage()`
- Il markup si aspetta le classi del cubo gia' presenti nel progetto.

