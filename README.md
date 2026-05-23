# THE FINALS Rank Overlay V23 - Generator Label Fix

Questa versione corregge solo il generatore che mostrava ancora "V17 Animated Brand".

## Cosa cambia
- Etichetta generatore aggiornata a V23 Static Brand
- Testo corretto: il branding si modifica da `public/brand.json`
- `public/version.json` aggiornato a versione 23
- Cache di app/style aggiornata a v23

## Controllo
Dopo il deploy apri:

```text
https://TUO-PROGETTO.vercel.app/version.json?v=123
```

Deve mostrare:

```json
"version": "23"
```
