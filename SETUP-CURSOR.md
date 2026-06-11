# Collegare RankTag a Cursor (chat → GitHub + Supabase + Vercel)

**Non devi aggiungere l'AI come collaboratore GitHub.**  
Cursor lavora sul tuo computer con **il tuo** account. Tu apri il progetto in Cursor, configuri gli accessi una volta, e da lì in chat posso modificare codice, fare push, leggere il database, ecc.

---

## Stato attuale sul tuo PC

| Strumento | Stato |
|-----------|--------|
| Git | ❌ Non installato (da installare) |
| GitHub CLI (`gh`) | ❌ Non installato |
| Repo locale `.git` | ❌ Mancante |
| MCP Cursor | ❌ Non configurato |

---

## Passo 1 — Installa Git (obbligatorio)

1. Scarica **Git for Windows**: https://git-scm.com/download/win  
2. Installa con opzioni predefinite.  
3. Riavvia Cursor.  
4. Verifica in terminale: `git --version`

---

## Passo 2 — Collega il repo GitHub

### A) Se il repo esiste già su GitHub

Sostituisci `TUO-USER` e `TUO-REPO` con i tuoi dati:

```powershell
cd C:\Users\dusan\Projects
git clone https://github.com/TUO-USER/TUO-REPO.git ranktag
cd ranktag
```

Poi in Cursor: **File → Open Folder →** `C:\Users\dusan\Projects\ranktag`

### B) Se devi creare il repo

1. Su GitHub: **New repository** → nome es. `ranktag-finals-overlay`  
2. Carica i file dello ZIP `ranktag-fixed-0.7.6.zip`  
3. Poi clona come sopra.

### Token GitHub (per push da Cursor)

1. Vai su: https://github.com/settings/tokens  
2. **Generate new token (classic)**  
3. Spunta almeno: `repo`  
4. Copia il token e salvalo (lo userai una sola volta in setup)

In PowerShell (sostituisci il token):

```powershell
git config --global credential.helper manager
```

Al primo `git push` inserisci:
- Username: il tuo username GitHub  
- Password: **il token** (non la password del sito)

---

## Passo 3 — MCP Supabase (database)

Il progetto usa già Supabase (`dgmhxldfhmcywamgigji.supabase.co`).

1. In Cursor: **Settings → MCP → Add new MCP server**  
2. Usa la configurazione in `.cursor/mcp.json` (file incluso in questo progetto).  
3. Per Supabase, Cursor ti chiederà il **login OAuth** al dashboard Supabase — accetta e scegli l'organizzazione giusta.  
4. Dopo il salvataggio, **riavvia Cursor**.  
5. In MCP settings deve comparire un **pallino verde** accanto a `supabase`.

Da quel momento in chat posso:
- leggere tabelle e schema
- aiutarti con RPC (`ranktag_get_user_by_token`, ecc.)
- proporti migration SQL

Dashboard MCP Supabase:  
https://supabase.com/dashboard/project/dgmhxldfhmcywamgigji?showConnect=true&connectTab=mcp

---

## Passo 4 — MCP GitHub (issue, PR, repo)

Opzione consigliata (server ufficiale GitHub):

1. Installa **Docker Desktop** e avvialo: https://www.docker.com/products/docker-desktop/  
2. Crea un **Personal Access Token** GitHub (scope `repo`).  
3. In Cursor MCP, aggiungi il server `github` da `.cursor/mcp.json`.  
4. Incolla il token dove indicato (o in variabile d'ambiente `GITHUB_PERSONAL_ACCESS_TOKEN`).

**Alternativa senza Docker:** basta Git installato — posso usare `git` nel terminale per commit e push.

---

## Passo 5 — Vercel

Non serve un “account collaboratore” per l'AI.

### Collegamento progetto

```powershell
npm install -g vercel
vercel login
cd C:\Users\dusan\Projects\ranktag
vercel link
```

Scegli il team e il progetto Vercel già collegato a GitHub.

### Variabili ambiente (già richieste dal progetto)

In Vercel → Project → Settings → Environment Variables:

| Variabile | Uso |
|-----------|-----|
| `ADMIN_PASSWORD` | Login pannello admin |
| `ADMIN_LAYOUT_KEY` | Layout editor privato |
| `ADMIN_USERNAME` | Opzionale (default `admin`) |

Per Supabase lato server (futuro), aggiungerai anche:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (solo server, mai nel frontend)

---

## Passo 6 — Apri sempre il progetto giusto in Cursor

Per lavorare “solo da chat” sul sito live:

1. Apri la cartella **clonata da GitHub** (non solo Downloads).  
2. In chat scrivi cose come:  
   - *“Fai push su main”*  
   - *“Mostrami le tabelle Supabase”*  
   - *“Aggiungi variabile su Vercel”* (ti guido o uso `vercel env`)  
   - *“Fixa il generator e deploya”*

---

## Cosa darmi in chat (checklist)

Quando sei pronto, inviami **un solo messaggio** con:

```
1. Link repo GitHub: https://github.com/...
2. URL sito Vercel: https://....vercel.app
3. Conferma: Git installato + repo clonato in C:\Users\dusan\Projects\ranktag
4. Conferma: MCP Supabase verde in Cursor
5. (Opzionale) Nome progetto Vercel
```

**Non inviare in chat:** password admin, service role Supabase, token GitHub completi.  
Configurali solo in Vercel / MCP / credential manager.

---

## Sicurezza importante

- La `SUPABASE_ANON_KEY` nel `generator.html` è pubblica per design — ok nel frontend.  
- La **service role key** va solo in variabili Vercel server-side, mai nel codice client.  
- Dopo il setup, sposteremo le chiavi sensibili fuori dai file HTML.

---

## Risoluzione problemi

| Problema | Soluzione |
|----------|-----------|
| `git` non riconosciuto | Installa Git e riavvia Cursor |
| MCP Supabase grigio | Riavvia Cursor, rifai login OAuth |
| Push fallisce | Usa token GitHub al posto della password |
| Modifiche non sul sito live | Verifica che Vercel sia collegato al branch giusto su GitHub |
