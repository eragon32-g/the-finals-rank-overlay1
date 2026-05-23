# THE FINALS Rank Overlay V21 - Brand Debug Fix

Questa versione serve a capire definitivamente se Vercel sta servendo il codice nuovo.

## Fix inclusi
- `index.html` non contiene più il vecchio testo placeholder `ERDRAGON3`
- carica `style.css?v=21` e `app.js?v=21`
- `/api/brand` include `version: "21"`
- nuovo endpoint `/api/version`
- CSS forza branding mixed-case con `!important`

## Controlli dopo il deploy

Apri:

```text
https://TUO-PROGETTO.vercel.app/api/version?v=123
```

Deve mostrare:

```json
"version": "21",
"expectedBrand": "ERDRAGON32"
```

Poi apri:

```text
https://TUO-PROGETTO.vercel.app/api/brand?v=123
```

Deve mostrare:

```json
"version": "21",
"brandText": "ERDRAGON32",
"discordText": "discord.gg/cffTwCcCGD"
```

Se questi endpoint sono giusti ma l'overlay resta vecchio, allora è cache del browser/OBS/TikTok.
Se gli endpoint sono vecchi, allora il dominio Vercel non punta all'ultimo deploy Production.
