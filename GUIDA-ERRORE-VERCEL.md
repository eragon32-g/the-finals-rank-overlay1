# Fix errore Vercel

Questa versione aggiunge lo script `build`, così Vercel non fallisce se prova a eseguire `npm run build`.

## Impostazioni consigliate su Vercel

Project Settings -> Build & Development Settings:

- Framework Preset: Other
- Build Command: `npm run build` oppure lascia vuoto
- Output Directory: lascia vuoto
- Install Command: lascia vuoto oppure `npm install`

Poi fai Redeploy.
