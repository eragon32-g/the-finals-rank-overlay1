# THE FINALS Rank Overlay V15 - Integrated Locked Branding

Questa versione cambia il branding:
- non è più una pill esterna sotto la card
- è integrato nella parte bassa della targhetta
- brand, call to action e Discord sono divisi in 3 zone
- resta bloccato lato progetto, non modificabile dal link

## Modificare il branding

Apri su GitHub:

```text
api/brand.js
```

Modifica:

```js
brandText: "ERDRAGON3",
discordText: "DISCORD.GG/TUOLINK",
callToAction: "JOIN THE VOID",
mode: "split"
```

Opzioni `mode`:
- `split`: mostra brand + CTA + Discord
- `discord`: mostra solo Discord
- `cta`: mostra solo call to action
- `brand`: mostra solo brand

Poi fai **Commit changes** e aspetta Vercel.

## Generatore
```text
https://TUO-PROGETTO.vercel.app/generator.html
```
