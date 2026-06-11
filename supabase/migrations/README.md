# Supabase — setup codici accesso

1. Apri **Supabase Dashboard** → SQL Editor  
2. Incolla ed esegui `001_access_codes.sql`  
3. Su **Vercel**, aggiungi:
   - `SUPABASE_URL` = `https://dgmhxldfhmcywamgigji.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (Settings → API → service_role)
   - `SUPABASE_ANON_KEY` = (Settings → API → anon)
   - `OVERLAY_ACCESS_SECRET` = stringa casuale lunga (opzionale, firma overlay)

4. Redeploy Vercel

Dopo il setup, i codici creati da Admin passano su Supabase e il riscatto funziona su qualsiasi dispositivo.
