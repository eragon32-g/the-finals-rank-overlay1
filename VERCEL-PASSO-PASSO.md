# Vercel — cosa incollare (copia-incolla)

Apri SOLO questa pagina e aggiungi **5 righe** con **Add New**:

https://vercel.com/erdragon-32-s-projects/the-finals-rank-overlay32/settings/environment-variables

---

## Riga 1

- **Key:** `SUPABASE_URL`
- **Value:** `https://dgmhxldfhmcywamgigji.supabase.co`
- Spunta: Production + Preview + Development
- **Save**

⚠️ NON usare il link del browser Supabase (quello con `/dashboard/`).

---

## Riga 2 — copia da Supabase

Apri: https://supabase.com/dashboard/project/dgmhxldfhmcywamgigji/settings/api

Sotto **anon** `public` → clicca **Copy**

Su Vercel **Add New**:
- **Key:** `SUPABASE_ANON_KEY`
- **Value:** incolla (inizia con `eyJ...`)
- **Save**

---

## Riga 3 — copia da Supabase

Sempre sulla stessa pagina Supabase.

Sotto **service_role** `secret` → clicca **Reveal** poi **Copy**

Su Vercel **Add New**:
- **Key:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** incolla
- **Save**

---

## Riga 4 — la inventi tu

Su Vercel **Add New**:
- **Key:** `ADMIN_PASSWORD`
- **Value:** es. `RankTag-Admin-2026!` (ricordati questa password!)
- **Save**

---

## Riga 5 — la inventi tu

Su Vercel **Add New**:
- **Key:** `ADMIN_LAYOUT_KEY`
- **Value:** es. `LayoutKey-2026`
- **Save**

---

## Fine

1. Vai su Deployments → ⋯ → **Redeploy**
2. Scrivi in chat: **vercel fatto**
