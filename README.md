# THE FINALS Rank Overlay V17 - Animated Locked Branding

Questa versione risolve il problema del testo tagliato nel branding.

## Cosa cambia
- Il branding non è più sempre visibile
- Compare ogni X secondi
- Il testo scorre in stile marquee
- Dopo alcuni secondi la finestra si richiude
- Branding e tempi restano bloccati lato progetto, non modificabili dal link

## Modificare branding e tempi

Apri su GitHub:

```text
api/brand.js
```

Puoi cambiare:

```js
brandText: "ERDRAGON3",
discordText: "DISCORD.GG/TUOLINK",
callToAction: "JOIN THE VOID",

intervalSeconds: 18,
visibleSeconds: 7,
scrollSeconds: 8,
showOnLoad: true
```

## Generatore
```text
https://TUO-PROGETTO.vercel.app/generator.html
```
