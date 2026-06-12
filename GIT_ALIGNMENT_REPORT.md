# Nexaris — Git Alignment Report (Fase 0.1)

> Documento di sola **verifica**. Eseguiti esclusivamente controlli git in **lettura**.
> NON sono stati eseguiti: `reset`, `pull`, `push`, `merge`, `fetch`, `restore`, né alcuna modifica a codice/UI/file applicativi.
> Generato analizzando lo stato locale al momento del controllo.

---

## ⚠ Esito sintetico

| Verifica | Esito |
|----------|-------|
| Working tree pulito | ❌ **NO** — 115 file risultano eliminati su disco |
| Allineato a `origin/main` | ❌ **NO** — HEAD è **1 commit indietro** (behind 1) |
| Pronto per iniziare P1 | ❌ **NO** — serve riallineamento manuale (vedi §6/§7) |

**Conclusione**: il working tree **non** è pulito né allineato. Su disco esistono soltanto `.git`, `ARCHITECTURE.md` e `MIGRATION_PLAN.md`; tutti gli altri file del progetto sono presenti **solo in git (HEAD)** ma non materializzati su disco. Inoltre il branch locale è indietro di 1 commit rispetto al remote-tracking `origin/main`. **Prima di P1 è necessario un riallineamento manuale**, qui solo proposto.

---

## 1. Stato branch

| Campo | Valore |
|-------|--------|
| Branch corrente | `main` |
| Upstream | `origin/main` |
| Remote | `origin` → `https://github.com/eragon32-g/the-finals-rank-overlay1.git` |
| Posizione vs upstream | **behind 1**, ahead 0 |
| Ahead / Behind (`HEAD...origin/main`) | `0  1` (0 avanti, 1 indietro) |

`git status -b` → `## main...origin/main [behind 1]`

---

## 2. Stato working tree

| Campo | Valore |
|-------|--------|
| Pulito? | **No** |
| File eliminati (D, non in stage) | **115** |
| File modificati (M) | 0 |
| File non tracciati (??) | 2 |
| Voci totali fuori sync | 117 |
| Contenuto reale su disco (top-level) | `.git/`, `ARCHITECTURE.md`, `MIGRATION_PLAN.md` |

**Osservazione chiave**: i 115 file appaiono come `deleted` perché **non sono materializzati sul filesystem locale**, pur essendo regolarmente tracciati e presenti in `HEAD`. È uno stato di working tree "svuotato" (probabile mancata sincronizzazione/hydration dei file, es. OneDrive on-demand o checkout incompleto). **Le modifiche NON sono state committate**: il commit `HEAD` contiene ancora tutti i file.

---

## 3. Commit locale (HEAD)

| Campo | Valore |
|-------|--------|
| SHA | `1c944b1f97081c67b6500668d7863e586fc6f870` |
| Autore | Sabrina V2 |
| Data | 2026-06-05 18:31:49 +0200 |
| Messaggio | `Add files via upload` |

---

## 4. Commit remoto (origin/main — remote-tracking, ultimo fetch noto)

| Campo | Valore |
|-------|--------|
| SHA | `34f66c1df68538cbbb36b792dedc0ebbc2877ff1` |
| Autore | Sabrina V2 |
| Data | 2026-06-11 12:15:35 +0200 |
| Messaggio | `Add files via upload` |

> ⚠ Questo valore proviene dal **remote-tracking locale** (ultimo `fetch` precedente a questa sessione). Non è stato eseguito un nuovo `git fetch` per non alterare i ref. Per conferma in tempo reale vedi il comando `git fetch origin` in §7 (da eseguire manualmente).

---

## 5. File fuori sync

### 5.1 Non tracciati (??) — sicuri, non interferiscono
- `ARCHITECTURE.md` (creato nelle fasi precedenti, non ancora committato)
- `MIGRATION_PLAN.md` (creato nelle fasi precedenti, non ancora committato)

> Nota: anche questo `GIT_ALIGNMENT_REPORT.md` risulterà come nuovo file non tracciato.

### 5.2 Eliminati su disco (D) — da ripristinare, NON committare la cancellazione
115 file, tra cui (estratto):
- Root: `package.json`, `vercel.json`, `index.html`, `app.js`, `style.css`, `README.md`, `GUIDA-ERRORE-VERCEL.md`, `admin-key.example.txt`
- `api/`: `player.js`, `brand.js`, `version.js`, `layout-editor.js`
- `private/layout-editor.html`
- `public/`: `index.html`, `app.js`, `style.css`, `access.js`, `home.html`, `account.html`, `generator.html`, `builder.html`, `layout-editor.html`, `admin.html`, `admin-login.html`, `admin-access.html`, `launch.html`, `updates.html`, `feedback.html`, `test.html`, `404.html`, `brand.json`, `version.json`, `changelog.json`
- `public/assets/`: 82 file (7 badge SVG, texture `plus/`+`plus-processed/`, ~60 PNG premium versionati, 3 `*-layout.json`)

> Questi file **esistono in `HEAD`**: sono recuperabili con un semplice `git restore` (vedi §7). Lo stato "deleted" è solo nel working tree, non nella storia.

---

## 6. Azioni consigliate

| # | Azione | Necessità | Distruttiva? |
|---|--------|-----------|--------------|
| 1 | (Opzionale) Confermare lo stato remoto reale con `git fetch origin` | Consigliata | No (aggiorna solo remote-tracking) |
| 2 | Ripristinare i 115 file eliminati nel working tree con `git restore .` | **Necessaria** | No (riallinea il working tree a HEAD; non tocca la storia) |
| 3 | Allineare HEAD al remoto con `git pull --ff-only` (solo fast-forward, +1 commit) | **Necessaria** | No (nessun merge/commit nuovo; rifiuta se non FF) |
| 4 | Verificare di nuovo con `git status` (atteso: *working tree clean*, *up to date*) | Necessaria | No |
| 5 | (Decisione separata) Committare `ARCHITECTURE.md` / `MIGRATION_PLAN.md` / questo report | Da valutare | No |

**Ordine corretto**: prima `git restore .` (recupera i file), **poi** `git pull --ff-only` (porta il commit remoto). Eseguire il pull con il working tree svuotato può generare conflitti di checkout: ripristinare prima.

> I file non tracciati (`*.md`) **non** vengono toccati da `git restore .` né da `git pull --ff-only`: sono al sicuro.

---

## 7. Comandi da eseguire manualmente (se confermi)

> ⚠ Da eseguire **tu manualmente**. Nessuno di questi è stato eseguito automaticamente. Nessun comando distruttivo (no `reset --hard`, no pull forzato, no push, no merge).

```bash
# 0) Posizionarsi nella cartella del progetto
cd "c:/Users/dusan/OneDrive/Documenti/GitHub/the-finals-rank-overlay1"

# 1) (Opzionale) Aggiornare il remote-tracking per conferma stato reale
git fetch origin

# 2) Ripristinare i file eliminati nel working tree (NON distruttivo: riallinea a HEAD)
git restore .

# 3) Verificare che ora risultino solo i file non tracciati (i .md)
git status

# 4) Allineare al remoto SOLO se fast-forward (porta il +1 commit, niente merge)
git pull --ff-only

# 5) Verifica finale (atteso: "working tree clean" + "up to date with 'origin/main'")
git status
```

### Stato atteso dopo i comandi
```
On branch main
Your branch is up to date with 'origin/main'.

Untracked files:
  ARCHITECTURE.md
  MIGRATION_PLAN.md
  GIT_ALIGNMENT_REPORT.md

nothing added to commit but untracked files present
```

### Note di sicurezza
- `git restore .` **non** elimina i file `.md` non tracciati e **non** modifica la storia: ripristina solo i file tracciati mancanti.
- `git pull --ff-only` **fallisce volutamente** se non è possibile un fast-forward (a quel punto fermati e rivaluta: nessun merge automatico).
- Se `git restore .` segnalasse problemi su file specifici, ispezionare con `git status` prima di procedere; **non** usare `git checkout -f` o `reset --hard` senza una valutazione esplicita.

---

### Sintesi finale
Branch `main` corretto e upstream impostato, ma **working tree non pulito** (115 file solo in HEAD, non su disco) e **branch behind 1** rispetto a `origin/main`. `ARCHITECTURE.md` e `MIGRATION_PLAN.md` presenti su disco (non tracciati). Strutture `public/assets/*` presenti **in git** (82 file) ma **non su disco**; cartella `supabase/migrations` **non esistente** (attesa, verrà creata in P1). Per essere pronti a P1 servono i due passi non distruttivi `git restore .` + `git pull --ff-only`, qui **solo proposti**.
