# THE FINALS Rank Overlay V18 - Case Sensitive Branding

Questa versione corregge il problema del branding che diventava tutto maiuscolo.

## Cosa cambia
- Il testo animato del branding mantiene maiuscole/minuscole come scritto in `api/brand.js`
- Esempio: `discord.gg/tuolink` resta minuscolo
- Il branding resta bloccato lato progetto

## Modificare il branding

Apri su GitHub:

```text
api/brand.js
```

E scrivi il testo come vuoi che venga mostrato:

```js
brandText: "ErDragon32",
discordText: "discord.gg/tuolink",
callToAction: "Join the Void"
```

Poi fai **Commit changes** e aspetta Vercel.
