# Istruzioni deploy GitHub + Vercel

## 1. Carica su GitHub

Estrai lo ZIP e carica **tutto il contenuto** della cartella `the-finals-rank-overlay1-main` nella root del repository (non la cartella wrapper esterna).

## 2. Variabili Vercel (importante)

In Vercel → Project → Settings → Environment Variables aggiungi:

```
ADMIN_PASSWORD = la-tua-password-sicura
ADMIN_LAYOUT_KEY = la-tua-chiave-layout-editor
ADMIN_USERNAME = admin
```

## 3. Asset PNG (opzionale ma consigliato)

Se hai i PNG dalla versione precedente, copiali come indicato in `public/assets/ASSETS-MANCANTI.md`.

## 4. Redeploy

Dopo il push su GitHub, Vercel farà deploy automatico.

## 5. Test rapido

- `/home.html` — landing
- `/generator.html` — crea overlay
- `/admin.html` — login admin (usa ADMIN_PASSWORD)
- `/?mode=manual&player=Test%231234&league=Platinum&division=1&rankScore=10000` — overlay test

## Cosa è cambiato nella 0.7.6

- Password admin **rimossa** dal file JavaScript
- Login admin solo via server
- Versioni allineate automaticamente
- API player con rate limit
- Build script per Vercel
