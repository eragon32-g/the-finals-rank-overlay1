# THE FINALS Rank Overlay V19 - Brand Cache Fix

Questa versione corregge il problema in cui modifichi `api/brand.js` ma nel generatore/overlay resta il testo vecchio.

## Cosa cambia
- `/api/brand` non viene più cacheato da Vercel/CDN
- l'overlay chiama `/api/brand?v=timestamp`, quindi forza il refresh
- il generatore fa lo stesso
- il branding resta bloccato lato progetto

## Dopo aver modificato `api/brand.js`
1. Fai **Commit changes** su GitHub.
2. Aspetta che Vercel finisca il deploy.
3. Apri il generatore con Ctrl+F5 o in incognito.
4. Controlla direttamente:
   `https://TUO-PROGETTO.vercel.app/api/brand?v=1`

Se lì vedi i dati nuovi, anche l'overlay userà quelli.
