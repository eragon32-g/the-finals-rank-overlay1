# RankTag BETA 0.7.7

Overlay rank per streamer di **THE FINALS**.

- Live: https://the-finals-rank-overlay32.vercel.app
- GitHub: https://github.com/eragon32-g/the-finals-rank-overlay1

## Setup Vercel (env)

| Variabile | Obbligatoria |
|-----------|--------------|
| `ADMIN_PASSWORD` | Sì |
| `ADMIN_LAYOUT_KEY` | Consigliata |
| `SUPABASE_SERVICE_ROLE_KEY` | Sì (codici accesso) |
| `SUPABASE_URL` | Sì |
| `SUPABASE_ANON_KEY` | Consigliata |
| `OVERLAY_ACCESS_SECRET` | Opzionale (firma link overlay) |

## Setup Supabase (una volta)

Esegui `supabase/migrations/001_access_codes.sql` nel SQL Editor.

## Sync

```powershell
git pull origin main
git add .
git commit -m "messaggio"
git push origin main
```

Vercel redeploya automaticamente.
