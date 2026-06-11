# Fix errore Vercel

Questa versione include lo script `build` in `package.json`, così Vercel non fallisce se prova a eseguire `npm run build`.

## Impostazioni consigliate su Vercel

Project Settings → Build & Development Settings:

- **Framework Preset:** Other
- **Build Command:** `npm run build` oppure lascia vuoto
- **Output Directory:** lascia vuoto
- **Install Command:** lascia vuoto oppure `npm install`

## Variabili ambiente obbligatorie

Imposta almeno:

- `ADMIN_PASSWORD` — per il pannello Admin
- `ADMIN_LAYOUT_KEY` — per il Layout Editor privato

Vedi `.env.example` per l'elenco completo.

Poi fai **Redeploy**.
