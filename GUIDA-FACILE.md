# Guida facile — passo 2 e 3

Hai già fatto il **punto 1** (SQL su Supabase). Restano solo 2 cose.

---

## PASSO 2 — Variabili su Vercel (5 minuti)

Sono “password segrete” che il sito usa sul server. **Non vanno nel codice**, vanno nel pannello Vercel.

### A) Apri questa pagina (clicca il link)

**Environment Variables del tuo progetto:**  
https://vercel.com/erdragon-32-s-projects/the-finals-rank-overlay32/settings/environment-variables

### B) Prendi le chiavi da Supabase

1. Apri: https://supabase.com/dashboard/project/dgmhxldfhmcywamgigji/settings/api  
2. Nella sezione **Project API keys** vedrai:
   - **anon** `public` → clicca l’icona copia → è la `SUPABASE_ANON_KEY`
   - **service_role** `secret` → clicca copia → è la `SUPABASE_SERVICE_ROLE_KEY`  
   ⚠️ La **service_role** è segreta: non mandarla in chat a nessuno.

### C) Aggiungi le variabili su Vercel (una per una)

Su Vercel, per ogni riga sotto clicca **Add New** (o **Add**):

| Name (nome) | Value (valore) | Environment |
|-------------|----------------|-------------|
| `SUPABASE_URL` | `https://dgmhxldfhmcywamgigji.supabase.co` | Production, Preview, Development (tutti e 3) |
| `SUPABASE_ANON_KEY` | incolla la chiave **anon** copiata da Supabase | tutti e 3 |
| `SUPABASE_SERVICE_ROLE_KEY` | incolla la chiave **service_role** copiata da Supabase | tutti e 3 |
| `ADMIN_PASSWORD` | inventa una password lunga (es. `RankTag-Admin-2026-Sicura!`) | tutti e 3 |
| `ADMIN_LAYOUT_KEY` | inventa una stringa a caso (es. `LayoutKey-VoidRage-2026`) | tutti e 3 |

**Opzionale** (puoi saltarlo per ora):

| Name | Value |
|------|--------|
| `OVERLAY_ACCESS_SECRET` | una stringa lunga a caso |

### D) Redeploy

1. Vai su: https://vercel.com/erdragon-32-s-projects/the-finals-rank-overlay32  
2. Tab **Deployments**  
3. Sull’ultimo deploy → tre puntini **⋯** → **Redeploy** → conferma  

Così Vercel rilegge le nuove variabili.

---

## PASSO 3 — Pubblicare il codice su GitHub (push)

Le modifiche 0.7.7 sono sul tuo PC ma **non ancora su GitHub**. Vercel prende il codice da GitHub, quindi serve il push.

### Opzione A — Chiedi a Cursor in chat

Scrivi semplicemente:

> **fai push**

L’AI farà commit e push per te.

### Opzione B — Tu da terminale in Cursor

1. In Cursor: menu **Terminal** → **New Terminal**  
2. Incolla tutto insieme:

```powershell
cd "C:\Users\dusan\OneDrive\Desktop\ranktag\the-finals-rank-overlay1"
git add .
git commit -m "RankTag 0.7.7 Supabase codici accesso"
git push origin main
```

3. Se chiede login GitHub:
   - **Username** = il tuo username GitHub  
   - **Password** = un **token** (non la password del sito)  
   - Token qui: https://github.com/settings/tokens → Generate → spunta **repo**

### Opzione C — GitHub Desktop (più facile se non vuoi terminale)

1. Scarica: https://desktop.github.com  
2. Login con GitHub  
3. **File → Add local repository** → scegli  
   `C:\Users\dusan\OneDrive\Desktop\ranktag\the-finals-rank-overlay1`  
4. A sinistra vedrai i file modificati  
5. In basso scrivi un messaggio → **Commit to main**  
6. Clicca **Push origin**

---

## Come capire se ha funzionato

| Cosa | Dove controllare |
|------|------------------|
| Push ok | https://github.com/eragon32-g/the-finals-rank-overlay1 — file recenti |
| Deploy ok | Vercel → Deployments → stato **Ready** (verde) |
| Versione sito | https://the-finals-rank-overlay32.vercel.app/version.json → deve dire **0.7.7** |
| Admin login | https://the-finals-rank-overlay32.vercel.app/admin.html → usa `ADMIN_PASSWORD` che hai messo su Vercel |
| Codice test | Admin → crea codice → Account → riscatta |

---

## Se qualcosa non va

- **Admin dice "non configurato"** → manca `ADMIN_PASSWORD` su Vercel + redeploy  
- **Codice non si riscatta online** → manca `SUPABASE_SERVICE_ROLE_KEY` su Vercel + redeploy  
- **Push fallisce** → usa token GitHub al posto della password  

Quando hai finito il passo 2, scrivi in chat **“passo 2 fatto”** e ti aiuto a verificare tutto.
