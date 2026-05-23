# THE FINALS Rank Overlay V14 - Locked Branding

Questa versione blocca il branding: non è più modificabile dal link overlay.

## Cosa cambia
- Il branding Discord viene caricato da `/api/brand`
- Il generatore non mostra più campi modificabili per il branding
- Chi cambia `brandText`, `discordText` o `extraText` nel link non modifica più la targhetta
- Solo chi ha accesso al repository/progetto può cambiare `api/brand.js`

## Come cambiare il branding
Apri su GitHub:

```text
api/brand.js
```

Modifica:

```js
brandText: "ERDRAGON3",
discordText: "DISCORD.GG/TUOLINK",
callToAction: "JOIN THE VOID",
mode: "full"
```

Poi fai **Commit changes** e aspetta Vercel.

## Generatore
```text
https://TUO-PROGETTO.vercel.app/generator.html
```
