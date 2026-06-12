# Nexaris — Piano di Migrazione (Fase P0)

> Documento di sola **pianificazione**. Nessun file del progetto è stato modificato, eliminato o creato (eccetto questo `MIGRATION_PLAN.md`).
> Riferimento: `ARCHITECTURE.md`. Obiettivo: preparare la rifondazione **Nexaris** consolidando i sistemi sovrapposti in **cinque sistemi unici** (A–E).
> **Vincolo P0**: nessuna modifica alla UI, nessun refactor del codice. Qui si definiscono *decisioni*, *file coinvolti*, *dipendenze* e *ordine di migrazione*.

---

## 0. Quadro di partenza (focus sui 4 file critici)

| File | Ruolo attuale | Sistema account usato | Persistenza | Destino |
|------|---------------|----------------------|-------------|---------|
| `public/generator.html` (82 KB) | Generator "a form" + anteprima + **account online Supabase** | **Supabase RPC** | `overlays` su Supabase + localStorage layout keys | **Unificare** dentro Editor + Account/Project Nexaris |
| `public/builder.html` (65 KB) | Editor **drag & drop** elementi su canvas 470×160 | **localStorage** (`RankTagAccess`) | `ranktagProjectsV1` (localStorage) | **Unificare** (engine D&D salvato) / cambiare backend |
| `public/layout-editor.html` (21 KB) + `private/layout-editor.html` (duplicato) | Editor admin posizioni overlay **premium** | nessuno (gate via `api/layout-editor.js`) | localStorage layout keys + export `assets/premium/*-layout.json` | **Unificare** in Admin/Themes; eliminare il duplicato |
| `public/app.js` (110 KB) | **Renderer overlay runtime** (target OBS) | gate `rtAccess` via URL (client) | nessuna (stato da URL) | **Riscrivere** come Overlay Engine unico |

Problema centrale: questi 4 file usano **tre fonti di verità diverse** (Supabase, localStorage, URL params) e **due sistemi account scollegati**. La migrazione consiste nel ricondurli a **un'unica spina dorsale** (Supabase) e **un solo motore di rendering**.

---

## 1. Cosa MANTENERE

> Da conservare (eventualmente spostato/rifattorizzato), perché concettualmente valido o a basso rischio.

| Elemento | File / posizione | Motivo | Trattamento in P1+ |
|----------|------------------|--------|--------------------|
| Proxy leaderboard | `api/player.js` | Unica API viva, logica robusta | Mantenere; rinominabile `api/leaderboard` con cache breve |
| Schema layout overlay v2 | `assets/premium/*-layout.json`, `builder.html → scaleLayoutForOverlay()` | Modello dati pulito `{canvas, elements{badge,rank,score,player,brand}}` | Diventa **schema canonico** dell'Overlay Engine |
| Algoritmo codici portabili | `access.js` (`makeCode`/`parsePortableCode`/`checksumCode`/`encodeDurationToken`) | Codifica + durata + checksum ben fatti | Portare **server-side** dentro `redeem_license` |
| Engine drag & drop | `builder.html` (pointer events, hitbox, resize, `clampToCanvas`, `point()`) | Interazione editor matura | Estratto come **modulo UI** dell'Editor |
| Mapping rank → stemma | `app.js` (`iconFromLeague`, `getOfficialBadgeFile`, `baseLeague`, `romanToFileDivision`, `sanitizeBadgeFile`) | Mapping corretto e testato | Riusare nell'Overlay Engine |
| Branding/marquee | `app.js` (`buildBrandText`, `showBrandDrawer`, `setupLockedBranding`) | Brand drawer animato | Modulo del renderer |
| Asset stemmi | `assets/badges/*.svg` (7 file) | Leggeri e puliti | Mantenere |
| Concetto backend Supabase | RPC `ranktag_*` (in `generator.html`/`launch.html`) | Direzione corretta | Diventa **l'unico** backend |
| Contenuti marketing/changelog | `home.html`, `updates.html`, `changelog.json`, copy `launch.html` | Copy riutilizzabile | Re-skin Nexaris (no logica) |
| Proxy leaderboard fetch client | `app.js` (`loadAuto`), `builder.html`/`generator.html` (`fetch('/api/player...')`) | Pattern valido | Centralizzare in un solo client |

---

## 2. Cosa ELIMINARE

> Da rimuovere **in fase di sviluppo** (NON ora). In P0 si pianifica soltanto.

| Elemento | File / posizione | Motivo | Bloccante prima di eliminare |
|----------|------------------|--------|------------------------------|
| Sistema account localStorage | `public/access.js` (intero) | Doppio account; password in chiaro nel browser | Account System unico (B) attivo + migrazione progetti |
| Credenziali admin hardcoded | `access.js` (`ADMIN_PASSWORD`, fallback) | Rischio di sicurezza reale | Ruoli Supabase (D) attivi; ruotare credenziali |
| Gate accesso client overlay | `app.js` (`ranktagValidateAccessFromUrl`, `ranktagBlockInactiveOverlay`) | Aggirabile lato client | Validazione licenza server-side |
| Motori premium stratificati | `app.js` (`…V78`, `…V80`, `…V89`, `…V90`, `…V92`, `…V97`, `V103`, fallback `012`) | Codice morto/ridondante | Overlay Engine unico (A/E) con parità visiva |
| Duplicato editor layout | `private/layout-editor.html` | Identico a `public/layout-editor.html` | Admin/Themes (D) consolidato |
| File legacy root | `index.html`, `app.js`, `style.css` (root) | Vecchie copie non servite | Verifica che nessun deploy li referenzi |
| Pagine ponte / redirect | `test.html`, `admin-access.html`, `admin-login.html` | Sostituite da auth a ruoli | Routing Nexaris + `/admin` |
| API a valori hardcoded | `api/version.js`, `api/brand.js` | Disallineate dai JSON | Single source of truth (DB/JSON) |
| Anon key duplicata | inline in `generator.html` **e** `launch.html` | Duplicazione segreto | Config centralizzata (env/modulo unico) |
| Feedback per-browser | `feedback.html` (localStorage `ranktag_feedback_*`) | Non condiviso tra utenti | Tabella `feedback` su Supabase (se la feature resta) |
| Asset premium versionati | `assets/premium/*-v97…v113*` (~60 PNG) | Cruft di iterazioni | Naming stabile + storage |

---

## 3. Cosa UNIFICARE

> Le cinque consolidazioni richieste. Per ciascuna: file coinvolti, dipendenze, esito.

### A. Overlay Engine unico
- **Cosa unifica**: i ~7 motori di rendering presenti in `public/app.js` → **un solo motore data-driven**.
- **File coinvolti**: `public/app.js` (sorgente), `public/index.html` (host), `assets/premium/*-layout.json` (schema), `assets/badges/*` (stemmi), `api/player.js` (dati auto).
- **Dipendenze**: schema layout v2 (E) congelato; mapping rank→stemma (da mantenere); client leaderboard.
- **Esito**: modulo `overlay-engine` che riceve `config + layout` e produce il DOM dell'overlay, senza patch versionate.

### B. Account System unico
- **Cosa unifica**: account localStorage (`access.js`) **+** account Supabase (`generator.html`/`launch.html`) → **una sola Auth Supabase**.
- **File coinvolti**: `public/access.js`, `public/account.html`, `public/generator.html` (blocco RPC login/register/token), `public/launch.html`, `public/builder.html` (gate), `public/admin.html` (gate).
- **Dipendenze**: progetto/schema Supabase (`profiles`) + RLS (P1); decisione token/sessione unica (`ranktag_online_token` → sessione Supabase).
- **Esito**: un solo namespace auth (`NexarisAuth`), niente credenziali nel client, sessione unica condivisa da tutte le pagine.

### C. Project System unico
- **Cosa unifica**: progetti localStorage (`ranktagProjectsV1` via `access.js`/`account.html`/`builder.html`) **+** overlay Supabase (`ranktag_save_overlay`/`list`/`delete` in `generator.html`) → **una sola tabella `overlays`**.
- **File coinvolti**: `public/access.js` (`saveProject`/`listProjects`/`getProject`), `public/account.html` (libreria), `public/builder.html` (salva), `public/generator.html` (CRUD Supabase).
- **Dipendenze**: Account unico (B) per `owner_id`; schema `overlays (config jsonb, layout jsonb)`; **migrazione una-tantum** dei progetti localStorage.
- **Esito**: ogni progetto = riga `overlays` legata all'utente; libreria unica in dashboard.

### D. Admin System unico
- **Cosa unifica**: admin localStorage (`admin.html` + `access.js` unlock) **+** gate chiave (`api/layout-editor.js` + `admin-login.html`) **+** admin Supabase (`launch.html`) **+** editor layout (`layout-editor.html` ×2) → **un solo Admin a ruoli Supabase**.
- **File coinvolti**: `public/admin.html`, `public/admin-login.html`, `public/admin-access.html`, `public/launch.html`, `api/layout-editor.js`, `public/layout-editor.html`, `private/layout-editor.html`.
- **Dipendenze**: ruolo `admin` su `profiles` + RLS; licenze server-side (`licenses` + `redeem_license`).
- **Esito**: `/admin` (gestione licenze/utenti/feedback) + `/admin/themes` (editor layout premium), protetti da ruolo, senza chiavi/credenziali hardcoded.

### E. Rendering System unico
- **Cosa unifica**: le **molteplici sorgenti di stato/CSS** che alimentano l'overlay → **un solo schema + una sola pipeline di rendering**.
- **File coinvolti**: `public/app.js` (`cssFromLayout`/`normalizeLayout`/`applyLayout` nelle varie versioni), `public/style.css` (115 KB), `assets/premium/*-layout.json`, generazione link in `generator.html`/`builder.html` (`buildLink`/`encode`).
- **Dipendenze**: Overlay Engine (A); schema layout v2 canonico; design token CSS condivisi.
- **Esito**: stato overlay = un solo `layout v2` (da `id` Supabase o param compatto); un solo `cssFromLayout`; niente CSS duplicati per versione.

> Nota relazione A vs E: **A** = il motore (componente che disegna); **E** = il contratto dati + pipeline CSS che lo alimentano. Vanno congelati insieme.

---

## 4. File coinvolti (mappa completa)

```
BACKEND / API
  api/player.js          → MANTENERE (proxy leaderboard) ............ A,E
  api/layout-editor.js   → UNIFICARE in Admin a ruoli ............... D
  api/version.js         → ELIMINARE (hardcoded) .................... —
  api/brand.js           → ELIMINARE (duplicato di brand.json) ...... —

ACCOUNT / CODICI
  public/access.js       → ELIMINARE; logica codici → server ....... B,C,D
  public/account.html    → UNIFICARE (auth+libreria) ............... B,C
  public/admin.html      → UNIFICARE in /admin .................... D
  public/admin-login.html→ ELIMINARE .............................. D
  public/admin-access.html→ ELIMINARE ............................. D
  public/launch.html     → UNIFICARE (admin Supabase) ............. B,D

OVERLAY / EDITOR
  public/generator.html  → UNIFICARE (Editor + account online) .... A,B,C,E
  public/builder.html    → UNIFICARE (engine drag&drop) .......... A,C,E
  public/layout-editor.html       → UNIFICARE in /admin/themes ... D,E
  private/layout-editor.html      → ELIMINARE (duplicato) ........ D
  public/app.js          → RISCRIVERE (Overlay Engine unico) ..... A,E
  public/index.html      → MANTENERE come host /overlay .......... A,E
  public/style.css       → UNIFICARE (design token) .............. E

CONTORNO
  public/home.html       → MANTENERE (re-skin) ................... —
  public/updates.html    → MANTENERE (re-skin) ................... —
  public/feedback.html   → UNIFICARE su Supabase (opzionale) ..... C
  public/test.html       → ELIMINARE ............................. —
  index.html/app.js/style.css (root) → ELIMINARE (legacy) ........ —
  assets/badges/*        → MANTENERE ............................. A
  assets/premium/*       → PULIRE (versioni) ..................... A,E
```

---

## 5. Dipendenze (grafo di migrazione)

### 5.1 Dipendenze attuali (stato AS-IS)
```
index.html ──► app.js ──► /api/player          (+ brand.json / /api/brand)
                      └──► assets/* (badges, premium layout json)

generator.html ──► supabase-js (CDN) ──► RPC ranktag_*  (account+overlay ONLINE)
               ├──► /api/player
               └──► localStorage "ranktag-layout-editor-*"  (prodotti da layout-editor)

builder.html ──► access.js (RankTagAccess: gate, saveProject) ──► localStorage
             ├──► /api/player
             └──► (output) link overlay ──► index.html + app.js (iframe preview)

account.html ──► access.js ──► localStorage (auth + progetti)
admin.html   ──► access.js ──► localStorage (unlock + codici)
launch.html  ──► supabase-js (CDN) ──► RPC (admin token)

layout-editor.html / private ──► localStorage layout keys ──► export *-layout.json ──► (runtime) app.js
api/layout-editor.js ──► gate ADMIN_LAYOUT_KEY ──► serve private/layout-editor.html
```

### 5.2 Dipendenze target (stato TO-BE)
```
Supabase (Auth + DB + RLS + RPC)  ◄── unico backend
   ├── profiles ───────── Account System (B)
   ├── licenses ───────── Admin System (D) [redeem_license]
   ├── overlays ───────── Project System (C)  {config, layout v2}
   ├── themes ─────────── Admin/Themes (D)
   └── feedback ───────── (opzionale)

Editor unificato ──► Auth(B) ──► overlays(C) ──► genera link /overlay
Overlay Engine (A/E) ──► legge layout v2 da overlays ──► /api/leaderboard (auto)
Admin (D) ──► ruolo admin (RLS) ──► licenses/themes/users/feedback
```

### 5.3 Ordine di dipendenza (chi blocca chi)
```
Supabase schema + RLS
        │
        ▼
B. Account unico ──► C. Project unico ──► (Editor)
        │                                   ▲
        └──► D. Admin unico (licenze)       │
                                            │
E. Schema layout v2 (congelato) ──► A. Overlay Engine ──► /overlay
```
- **B** è prerequisito di **C** e **D** (serve `owner_id` / ruolo).
- **E** (schema layout) è prerequisito di **A** (il motore deve avere un contratto dati stabile).
- **A/E** sono indipendenti da B/C/D fino al punto di salvataggio (l'Editor li ricongiunge).

---

## 6. Ordine corretto di migrazione

> Sequenza sicura, incrementale e reversibile. P0 è solo **preparazione** (passi 0.x). I passi 1–7 sono la traccia per P1+ ma elencati qui per definire l'ordine.

**P0 — Preparazione (questa fase, nessuna modifica codice)**
- 0.1 Riallineo git del working tree (`git restore .` / `git pull --ff-only`) — su tua conferma, **non incluso qui**.
- 0.2 Creazione progetto Supabase + spostamento `SUPABASE_URL`/anon key in **config unica** (no duplicati).
- 0.3 Congelare lo **schema layout v2** come contratto (E) a partire da `*-layout.json` + `scaleLayoutForOverlay()`.
- 0.4 Inventario codici/licenze esistenti e progetti localStorage da migrare.

**P1 — Fondamenta backend (sblocca tutto)**
1. Schema DB (`profiles`, `licenses`, `overlays`, `themes`, `feedback`) + **RLS** + `redeem_license` (porta l'algoritmo da `access.js`).

**P2 — Account System unico (B)**
2. Auth Supabase unica + sessione condivisa; gate di `builder.html`/`admin.html`/`generator.html` puntati alla nuova auth (senza ancora rimuovere `access.js`).

**P3 — Project System unico (C)**
3. `overlays` come unica persistenza; **migrazione una-tantum** dei progetti localStorage; libreria unica.

**P4 — Overlay Engine + Rendering unico (A + E)**
4. Riscrittura `app.js` come motore data-driven sullo schema v2; **test di parità visiva** su tutti i temi; `/overlay` retro-compatibile con i link esistenti.

**P5 — Editor unificato**
5. Fusione `generator.html` + `builder.html` + `layout-editor.html` in un solo Editor (tab Stile/Posizioni/Anteprima) che salva su `overlays`.

**P6 — Admin System unico (D)**
6. `/admin` (licenze/utenti/feedback) + `/admin/themes` a **ruoli Supabase**; rimozione `api/layout-editor.js` gate-chiave e duplicato `private/`.

**P7 — Pulizia finale**
7. Eliminazione `access.js`, file legacy root, pagine ponte, API hardcoded, asset versionati; design token CSS condivisi.

### Regola di sicurezza dell'ordine
Ogni "ELIMINARE" del §2 avviene **solo dopo** che l'unificazione corrispondente del §3 è attiva e verificata:
```
access.js            → eliminare DOPO B+C (passi 2–3)
credenziali admin    → eliminare DOPO D (passo 6)
gate overlay client  → eliminare DOPO licenza server-side (passi 1–4)
motori premium app.js→ eliminare DOPO A/E con parità visiva (passo 4)
private/layout-editor→ eliminare DOPO D (passo 6)
file legacy/redirect → eliminare in P7 (passo 7)
```

---

## 7. Checklist P0 (output atteso prima di scrivere codice)

- [ ] Working tree riallineato a `origin/main` (git) — *su conferma utente*.
- [ ] Progetto Supabase pronto; chiavi in config unica (no duplicati in HTML).
- [ ] Schema layout v2 **congelato** e documentato (contratto E).
- [ ] Decisione stack frontend (consigliato: Vite + moduli condivisi; overlay runtime separato e leggero).
- [ ] Inventario licenze/codici + export progetti localStorage da migrare.
- [ ] Mappa di compatibilità link `/overlay` AS-IS → TO-BE definita (per non rompere gli OBS già in live).

---

### Sintesi
La migrazione P0 stabilisce che **tutto converge su Supabase** (account, progetti, licenze, admin) e su **un solo Overlay Engine** guidato dallo **schema layout v2**. I quattro file critici si dissolvono così: `generator.html` + `builder.html` + `layout-editor.html` → **Editor unico** (con Admin/Themes per la parte premium), e `public/app.js` → **Overlay Engine unico**. L'ordine obbligato è **backend → account → progetti → engine → editor → admin → pulizia**, eliminando ogni componente legacy **solo dopo** che il suo sostituto unificato è attivo e verificato.
