# THE FINALS Rank Overlay V22 - Static Brand Fix

Questa versione elimina il problema del 404 su `/api/version`.

## Cosa cambia
Vercel nel tuo progetto non sta servendo le route `/api`.
Quindi il branding ora viene letto da file statici dentro `public`:

```text
public/brand.json
public/version.json
```

Questi funzionano sempre perché Vercel sta già servendo la cartella `public`.

## Controllo dopo il deploy

Apri:

```text
https://TUO-PROGETTO.vercel.app/version.json?v=123
```

Devi vedere:

```json
"version": "22",
"expectedBrand": "ERDRAGON32"
```

Poi apri:

```text
https://TUO-PROGETTO.vercel.app/brand.json?v=123
```

Devi vedere:

```json
"brandText": "ERDRAGON32",
"discordText": "discord.gg/cffTwCcCGD"
```

## Come modificare il branding

Apri su GitHub:

```text
public/brand.json
```

Modifica:

```json
"brandText": "ERDRAGON32",
"discordText": "discord.gg/cffTwCcCGD",
"callToAction": "Join the Void"
```

Poi fai **Commit changes** e aspetta Vercel.

## Nota
Il file `api/brand.js` è ancora presente come backup, ma l'overlay usa `public/brand.json`.
