# RankTag BETA 0.7.6

Overlay rank fan-made per streamer di **THE FINALS** (OBS / TikTok LIVE Studio).

## Deploy su Vercel

1. Carica questa cartella su GitHub.
2. Collega il repo a Vercel (Framework Preset: **Other**).
3. Imposta le variabili ambiente (vedi `.env.example`):

| Variabile | Obbligatoria | Descrizione |
|-----------|--------------|-------------|
| `ADMIN_PASSWORD` | Sì | Password pannello Admin |
| `ADMIN_USERNAME` | No | Default: `admin` |
| `ADMIN_LAYOUT_KEY` | Consigliata | Chiave Layout Editor privato |
| `ADMIN_SESSION_SECRET` | No | Firma token sessione admin |

4. Build Command: `npm run build` (o lascia vuoto).
5. Output Directory: lascia vuoto.
6. Redeploy.

## Sviluppo locale

```bash
npm install -g vercel
npm run dev
```

Apri `http://localhost:3000/home.html`.

## Asset premium mancanti

Alcuni PNG non sono inclusi nel repo (copyright/dimensione). Vedi `public/assets/ASSETS-MANCANTI.md`.
Senza quei file i temi premium usano un **fallback gradient** automatico.

## Struttura

- `public/` — sito statico e overlay
- `api/` — serverless (player, admin-auth, layout-editor)
- `private/` — layout editor HTML (servito solo via API protetta)

## Note sicurezza

- Il login Admin **non** usa più password nel JavaScript: solo `/api/admin-auth`.
- Account utente e codici accesso restano locali nel browser (fase successiva: backend database).
