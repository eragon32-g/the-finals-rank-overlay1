# Asset PNG da aggiungere manualmente

Questi file sono referenziati dal codice ma **non inclusi** in questo pacchetto.
Copiali nella cartella indicata se li hai dalla versione precedente o dal tuo deploy Vercel.

## `public/assets/premium/`

- `cyber-red-elite-bg-v96.png`
- `cyber-red-elite-thumb-v96.png`
- `voidrage-inferno-fit-v113.png`

## `public/assets/plus/`

- `cyber-red-base.png`
- `cyber-red.png`

## Comportamento senza PNG

Se i file mancano, l'overlay premium mostra un **gradient di fallback** (patch 0.7.6).
Per la resa originale, carica i PNG nelle path sopra e fai redeploy.
