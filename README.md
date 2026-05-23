# THE FINALS Rank Overlay V20 - Hard Cache + Case Fix

Questa versione corregge due problemi:
1. Il branding restava tutto maiuscolo.
2. Dopo aver cambiato `api/brand.js`, il generatore/overlay poteva mostrare ancora dati vecchi.

## Cosa cambia
- `index.html` carica `style.css?v=20` e `app.js?v=20`, così il browser non usa file vecchi in cache.
- Il CSS forza il branding a NON usare `text-transform: uppercase`.
- `/api/brand` è impostato con `no-store`.
- L'overlay chiama `/api/brand?v=timestamp`.
- Il fallback ora usa `ERDRAGON32`, non più `ERDRAGON3`.

## Dopo aver aggiornato
Apri in incognito oppure fai Ctrl+F5.

Controlla direttamente:
```text
https://TUO-PROGETTO.vercel.app/api/brand?v=123
```

Se lì vedi:
```json
"brandText": "ERDRAGON32"
```
allora l'overlay userà quello.
