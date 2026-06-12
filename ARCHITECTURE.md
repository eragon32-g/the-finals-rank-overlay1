# Nexaris — Analisi & Architettura della Piattaforma

> Documento di sola **analisi**. Nessun file del progetto è stato modificato, eliminato o creato (eccetto questo `ARCHITECTURE.md`).
> Base analizzata: progetto attuale **RankTag BETA 0.7.5** (overlay rank fan-made per *THE FINALS*).

---

## Nota preliminare sullo stato del repository

Durante l'analisi è emerso che, nel **working tree locale**, tutti i file tracciati risultano **eliminati su disco** (lo stato `git status` riporta `deleted:` per ogni file e il branch locale è **1 commit indietro** rispetto a `origin/main`).
I contenuti esistono ancora interamente in **git (HEAD)** e l'analisi è stata svolta leggendo direttamente i blob da git, **senza ripristinare né toccare il working tree**.

Prima di iniziare lo sviluppo Nexaris sarà necessario (in un secondo momento, su tua conferma) riallineare il working tree:

```
git restore .
git pull --ff-only
```

Questo NON è stato eseguito, come da richiesta.

---

## 1. Struttura attuale del progetto

### 1.1 Albero file (essenziale, esclusi gli asset immagine)

```
/                         (repo root)
├── package.json          → solo "start": "vercel dev" (nessuna dipendenza, nessun build)
├── vercel.json           → header Cache-Control: no-store globale; rewrites vuoti
├── README.md             → 2 righe
├── GUIDA-ERRORE-VERCEL.md→ note deploy Vercel
├── admin-key.example.txt → chiave admin di esempio (in chiaro)
├── index.html            ⚠ LEGACY (overlay vecchio, duplicato di public/index.html)
├── app.js                ⚠ LEGACY (5 KB, vecchio renderer overlay)
├── style.css             ⚠ LEGACY (3 KB)
│
├── api/                   (Vercel Serverless Functions, CommonJS)
│   ├── player.js         → proxy leaderboard THE FINALS (unica API "viva")
│   ├── brand.js          → ritorna config branding statica
│   ├── version.js        → ritorna versione hardcoded (DISALLINEATA: dice 0.6.8)
│   └── layout-editor.js  → gate admin via ADMIN_LAYOUT_KEY, serve private/layout-editor.html
│
├── private/
│   └── layout-editor.html→ editor di posizionamento overlay premium (admin)
│
└── public/               (root statica servita da Vercel)
    ├── index.html        → overlay runtime (HTML target di OBS/TikTok)
    ├── app.js            → ⭐ 110 KB — RENDERER OVERLAY (cuore del prodotto)
    ├── style.css         → 115 KB — stili overlay + temi
    ├── access.js         → ⭐ sistema account + codici (localStorage)
    ├── home.html         → landing page marketing
    ├── account.html      → login/registrazione + libreria progetti (sistema localStorage)
    ├── generator.html    → ⭐ 82 KB — generator overlay + account ONLINE (Supabase)
    ├── builder.html      → ⭐ 65 KB — builder drag&drop (gate sistema localStorage)
    ├── layout-editor.html→ duplicato pubblico dell'editor layout admin
    ├── admin.html        → pannello admin codici/feedback (gate localStorage)
    ├── admin-login.html  → form chiave admin → /api/layout-editor
    ├── admin-access.html → redirect a /admin.html
    ├── launch.html       → checklist pre-lancio (gate admin Supabase)
    ├── updates.html      → changelog (legge changelog.json)
    ├── feedback.html     → bug/idee/showcase (localStorage)
    ├── test.html         → redirect a /home.html
    ├── 404.html
    ├── version.json / brand.json / changelog.json
    └── assets/
        ├── badges/       → 7 SVG stemmi rank (bronze…ruby + unranked)
        ├── plus/ , plus-processed/  → texture temi "plus"
        └── premium/      → ⚠ ~60 PNG versionati (voidrage-inferno-*-v97…v113, ecc.)
```

### 1.2 Stack tecnologico attuale

| Area | Tecnologia | Note |
|------|-----------|------|
| Hosting | Vercel (static + serverless) | nessun framework, nessun bundler |
| Frontend | HTML/CSS/JS vanilla multi-pagina | ogni pagina è un file monolitico con `<style>` e `<script>` inline |
| Backend | Vercel Functions (`/api/*.js`, CommonJS) | solo `player.js` realmente attivo |
| Auth #1 | **localStorage** (`access.js`) | account + codici single-use offline |
| Auth #2 | **Supabase** (RPC) | account "online" usato solo da `generator.html` e `launch.html` |
| Dati overlay | URL params + base64 nel link + Supabase | stato passato all'overlay via querystring/hash |
| Persistenza progetti | localStorage **e** Supabase (in parallelo) | due librerie progetti scollegate |

### 1.3 Sistemi funzionali (mappa)

**Account — DUE sistemi paralleli, NON collegati:**

- **Sistema A — localStorage** (`public/access.js`, namespace `RankTagAccess`)
  - Chiavi: `ranktagAuthV1`, `ranktagUsersV2`, `ranktagAccessCodesV1`, `ranktagProjectsV1`, `ranktagAdminUnlockedV1`.
  - Registrazione/login con **nickname + password in chiaro** salvati nel browser.
  - Admin "sbloccato" con credenziali **hardcoded nel client**: `ADMIN_PASSWORD = "RankTag-Admin-038"` (+ fallback `037/036`).
  - Usato da: `account.html`, `admin.html`, `builder.html`.

- **Sistema B — Supabase RPC** (inline in `generator.html` e `launch.html`)
  - `SUPABASE_URL` + `SUPABASE_ANON_KEY` hardcoded nel client (l'anon key è per design pubblica, ma è duplicata in più file).
  - RPC: `ranktag_login`, `ranktag_register`, `ranktag_get_user_by_token`, `ranktag_save_overlay`, `ranktag_list_overlays`, `ranktag_delete_overlay`.
  - Token salvato in `localStorage["ranktag_online_token"]` (utente) e `sessionStorage["ranktag_admin_token"]` (admin di `launch.html`).
  - Password inviata **in chiaro** all'RPC (l'hashing, se esiste, è lato DB — non verificabile dal client).

**Sistema codici (`access.js`):**
- Codici **portabili** `RT-A-<token>-<stamp>-<rnd>-<checksum>` con checksum base36, durata codificata nel token (`P`=permanente, `T<minuti>`).
- Single-use **per dispositivo/browser** (lo stato "usato" vive nel localStorage di chi riscatta): **non c'è invalidazione globale** → lo stesso codice è riutilizzabile su un altro browser.
- Admin genera/disattiva/esporta/importa codici via JSON (`admin.html`).

**Generatore / Builder / Editor — TRE strumenti sovrapposti:**
1. `generator.html` — generatore "a form": scelta tema, colori, modalità manuale/auto, anteprima live, **salvataggio Supabase**, integrazione layout premium.
2. `builder.html` — editor **drag & drop** di elementi (badge/testi/immagini custom) su canvas 470×160, gate via `RankTagAccess`, salva su **localStorage**.
3. `layout-editor.html` / `private/layout-editor.html` — strumento **admin** per posizionare gli elementi degli overlay *premium* (`cyber-red-elite`, `voidrage-inferno`); salva layout in localStorage + export JSON in `assets/premium/*-layout.json`.

**Overlay runtime (`public/app.js`) — il pezzo più critico:**
- Singolo file da ~110 KB, ~3000 righe.
- Legge tutto lo stato da **URL params** (`mode`, `player`, `league`, `badgeFile`, `rankScore`, `themeStyle`, `layout` base64, `customElements`, `rtAccess*`…).
- Contiene **molti motori di rendering "premium" stratificati e ridondanti**, ognuno aggiunto come patch versionata:
  `rankTagPremiumBackdropV78`, `…V80`, `rankTagPremiumRuntimeLayoutV89`, `…AuthoritativeV90`, `rankTagDetachedPremiumRendererV92`, `…V97`, `rankTagV103FinalPremiumRenderer`, più fallback `…012`.
- Gate di accesso lato overlay: `ranktagValidateAccessFromUrl` / `ranktagBlockInactiveOverlay` (bloccano l'overlay se i parametri `rtAccess` sono scaduti) — **aggirabile** lato client.

**API (`/api`):**
- `player.js` → unico endpoint reale: normalizza leaderboard/platform, chiama `api.the-finals-leaderboard.com`, fa match del player, ritorna rank/league/score.
- `version.js` → versione **hardcoded e disallineata** (`0.6.8` vs `version.json` `0.7.5`).
- `brand.js` → branding statico (duplicato di `brand.json`).
- `layout-editor.js` → gate admin con `ADMIN_LAYOUT_KEY` (env), unico controllo server-side reale del progetto.

---

## 2. Componenti riutilizzabili

Da **conservare / portare** in Nexaris (eventualmente rifattorizzati ma concettualmente validi):

| Componente | File | Perché si salva |
|-----------|------|-----------------|
| **Proxy leaderboard** | `api/player.js` | Logica solida: normalizzazione input, match "best player", gestione errori. Riutilizzabile quasi as-is come endpoint Nexaris. |
| **Schema layout overlay v2** | `*-layout.json`, `scaleLayoutForOverlay()` | Modello dati pulito: `{canvas:{w,h}, elements:{badge,rank,score,player,brand:{x,y,w,h,fontSize,z}}}`. Ottima base per il formato Nexaris. |
| **Logica codici portabili** | `access.js` (encode/parse/checksum/durata) | L'algoritmo di codifica codici + durata è ben fatto; va spostato **server-side** per validazione reale. |
| **Engine drag & drop** | `builder.html` (pointer events, hitbox, resize, clamp canvas) | Interazione editor matura; riutilizzabile come componente UI dell'editor Nexaris. |
| **Proxy badge / mapping rank** | `app.js` (`iconFromLeague`, `getOfficialBadgeFile`, `baseLeague`, `romanToFileDivision`) | Mapping league→stemma→file riutilizzabile. |
| **Asset stemmi** | `assets/badges/*.svg` | 7 SVG puliti e leggeri: si tengono. |
| **Backend Supabase (concetto)** | RPC `ranktag_*` | L'idea di account+overlay su Supabase è la direzione giusta; va reso l'**unico** sistema. |
| **Branding/marquee drawer** | `app.js` (`buildBrandText`, `showBrandDrawer`) | Funzione brand animata riutilizzabile come modulo. |
| **Contenuti marketing** | `home.html`, `launch.html`, `updates.html` | Copy e struttura landing/changelog riutilizzabili (da ristilizzare sotto brand Nexaris). |

---

## 3. Componenti da rifare completamente

| Componente | Problema | Azione |
|-----------|----------|--------|
| **`public/app.js` (renderer)** | ~7 motori di rendering "premium" sovrapposti e versionati, codice morto, logica duplicata, impossibile da mantenere. | **Riscrivere da zero** un singolo renderer guidato da uno schema layout unico. |
| **Doppio sistema account** | localStorage (`access.js`) **e** Supabase coesistono e non si parlano. Progetti salvati in due posti diversi. | **Eliminare il sistema localStorage**, unificare tutto su Supabase Auth. |
| **Codici single-use** | Stato "usato" salvato nel browser → nessuna invalidazione reale, facilmente aggirabile. | Validazione + redenzione **server-side** (tabella + RPC transazionale). |
| **Admin client-side** | Password admin **hardcoded** in `access.js`; gate solo lato browser. | Ruoli/permessi su Supabase (RLS), niente credenziali nel client. |
| **Tre strumenti overlay** (`generator`/`builder`/`layout-editor`) | Funzioni sovrapposte, UX frammentata, stato salvato in posti diversi. | **Un solo Editor** unificato con modalità "form" + "drag&drop". |
| **Pagine monolitiche** | Ogni HTML ha CSS+JS inline, zero riuso, duplicazione massiccia (es. anon key in 2 file, due `layout-editor.html` identici). | Migrare a struttura a componenti + design system condiviso. |
| **Asset premium versionati** | ~60 PNG `*-v97…v113` (cruft di iterazioni). | Pulizia: tenere solo l'ultima versione, naming stabile, asset in storage. |
| **File legacy root** | `index.html`, `app.js`, `style.css` in root sono vecchie copie. | Rimuovere (in fase di sviluppo, non ora). |
| **`api/version.js` / `brand.js`** | Valori hardcoded e disallineati rispetto ai JSON. | Sostituire con singola source of truth. |
| **Feedback/showcase** | Salvati in localStorage del singolo browser (non condivisi). | Spostare su Supabase se la feature resta. |

---

## 4. Nuova architettura Nexaris

Obiettivo: **un'unica piattaforma coerente**, un solo sistema account, un solo motore overlay, uno schema dati unico, backend reale.

### 4.1 Principi guida
1. **Single source of truth**: account, codici/licenze, overlay e versione vivono **solo** su Supabase.
2. **Un solo renderer** overlay, data-driven da uno schema layout versionato.
3. **Separazione netta**: App (dashboard/editor) ↔ Overlay runtime (pagina leggera per OBS) ↔ Backend (Supabase + funzioni).
4. **Sicurezza server-side**: nessuna credenziale/segreto admin nel client; RLS su tutte le tabelle.
5. **Design system condiviso** (CSS/token unici) al posto di stili inline duplicati.

### 4.2 Diagramma logico

```
┌──────────────────────────────────────────────────────────────┐
│                          NEXARIS APP                           │
│  (Dashboard + Editor unificato + Admin)                        │
│  - Auth Supabase (sessione)                                    │
│  - CRUD overlay/progetti                                       │
│  - Gestione licenze/codici (admin)                             │
└───────────────┬───────────────────────────────┬───────────────┘
                │ genera link firmato            │ legge/scrive
                ▼                                 ▼
┌───────────────────────────┐         ┌──────────────────────────┐
│   NEXARIS OVERLAY RUNTIME  │         │        SUPABASE          │
│   (pagina leggera OBS)     │         │  Auth · Postgres · RLS   │
│  - 1 renderer data-driven  │◄────────│  Tabelle:                │
│  - layout via id+token     │  fetch  │   profiles, overlays,    │
│  - polling rank (opzionale)│         │   licenses/codes,        │
└───────────────┬───────────┘         │   feedback, themes       │
                │                       │  RPC/Edge Functions      │
                ▼                       └──────────────┬───────────┘
        api/leaderboard (proxy)                        │
        (Vercel Function, ex player.js)  ◄─────────────┘
```

### 4.3 Modello dati (Supabase, proposto)

- `profiles` — `id (uuid, = auth.uid)`, `nickname`, `role (user|admin)`, `created_at`.
- `licenses` — `id`, `code`, `type (temporary|permanent)`, `duration_ms`, `note`, `disabled`, `redeemed_by`, `redeemed_at`, `expires_at`. (Sostituisce i codici localStorage; redenzione via RPC transazionale.)
- `overlays` — `id`, `owner_id`, `name`, `config (jsonb: tema+colori+modalità)`, `layout (jsonb: schema layout v2)`, `updated_at`, `created_at`.
- `themes` — temi/preset premium (config + asset refs), con flag `premium`.
- `feedback` — `type (bug|idea|showcase)`, `payload (jsonb)`, `votes`, `status`.
- **RLS**: utente vede/modifica solo i propri `overlays`; `licenses` scrivibili solo da admin; redenzione via funzione `redeem_license(code)`.

### 4.4 Layer applicativi
- **Frontend**: scelta tra (a) restare multi-pagina ma con **moduli JS condivisi + design system**, oppure (b) introdurre un framework (es. Vite + componenti). Vista l'attuale assenza di build, l'opzione pragmatica è **Vite** come bundler con CSS/token condivisi, mantenendo l'overlay runtime come pagina ultra-leggera separata.
- **Overlay runtime**: bundle minimo, zero dipendenze pesanti, riceve `?overlay=<id>&token=<...>` o stato compatto; renderer unico.
- **Backend**: Supabase (Auth, DB, RLS, RPC/Edge Functions) + 1 Vercel Function come proxy leaderboard (cache breve).

---

## 5. Struttura pagine proposta

| Rotta | Pagina | Sostituisce | Accesso |
|-------|--------|-------------|---------|
| `/` | Landing Nexaris | `home.html` | pubblico |
| `/login` | Auth (login/registrazione) | `account.html` (parte auth) + auth inline generator | pubblico |
| `/dashboard` | Lista progetti/overlay dell'utente | libreria progetti di `account.html` + `generator.html` | utente |
| `/editor/:id` | **Editor unificato** (form + drag&drop + temi + anteprima live) | `generator.html` + `builder.html` + `layout-editor.html` | utente con licenza |
| `/overlay` | Overlay runtime (target OBS/TikTok) | `public/index.html` + `app.js` | via link firmato |
| `/account` | Profilo, licenza/codice, impostazioni | `account.html` (parte codici) | utente |
| `/admin` | Gestione codici/licenze, utenti, feedback | `admin.html` + `launch.html` | admin (ruolo Supabase) |
| `/admin/themes` | Editor temi/layout premium | `layout-editor.html` / `private/` | admin |
| `/changelog` | Note di rilascio | `updates.html` | pubblico |
| `/feedback` | Bug/idee/showcase | `feedback.html` | pubblico/utente |

Pagine da **eliminare**: `test.html`, `admin-access.html`, `admin-login.html` (sostituiti da auth a ruoli), root `index.html`/`app.js`/`style.css` legacy, `private/layout-editor.html` (duplicato).

---

## 6. Flusso utente

### 6.1 Streamer (utente finale)
1. Arriva sulla **landing** → "Crea il tuo overlay".
2. **Registrazione/Login** (Supabase Auth, nickname+password o magic link).
3. (Se richiesto) **Riscatta un codice/licenza** → validazione server-side, licenza legata all'account.
4. **Dashboard**: crea un nuovo overlay o apre uno esistente.
5. **Editor unificato**: sceglie tema, modalità (manuale/auto da leaderboard), personalizza colori e posizioni (drag&drop), vede l'**anteprima live**.
6. **Salva** → overlay persistito su Supabase, generato un **link firmato** `/overlay?...`.
7. Incolla il link in **OBS / TikTok LIVE Studio** come Browser Source (470×160, sfondo trasparente).
8. L'overlay runtime carica config+layout dall'`id`, opzionalmente fa polling del rank via proxy leaderboard.

### 6.2 Admin
1. Login con account a **ruolo admin** (Supabase, RLS).
2. **/admin**: genera/disattiva licenze, vede stato redenzioni reali (lato DB), gestisce utenti.
3. **/admin/themes**: crea/posiziona temi premium con l'editor layout; pubblica il tema (config in `themes`).
4. Triage **feedback** (bug/idee/showcase) condivisi.

---

## 7. Roadmap tecnica

> Suddivisa in fasi incrementali; ogni fase è rilasciabile.

**Fase 0 — Preparazione (no-code-change)**
- Riallineare working tree (`git restore` / `git pull`), confermare branch di lavoro.
- Definire progetto Supabase, segreti in env (anon key fuori dal codice duplicato, service key solo server-side).
- Decidere stack frontend (consigliato: Vite + moduli condivisi).

**Fase 1 — Fondamenta backend**
- Creare schema DB (`profiles`, `licenses`, `overlays`, `themes`, `feedback`) + RLS.
- RPC: `register`, `login` (o Supabase Auth nativa), `redeem_license`, CRUD `overlays`.
- Migrare/normalizzare l'algoritmo codici dentro `redeem_license` (validazione transazionale, invalidazione globale).

**Fase 2 — Auth unica**
- Implementare `/login`, `/account`, gestione sessione/token unica.
- **Rimuovere** `access.js` e l'auth inline duplicata; eliminare credenziali admin hardcoded → ruoli Supabase.

**Fase 3 — Renderer overlay unico**
- Definire **schema layout v2 definitivo** (estensione di quello esistente).
- Riscrivere `public/app.js` come **singolo renderer data-driven** (eliminare i ~7 motori premium stratificati).
- `/overlay` legge config+layout da `id`/token; mantenere modalità manuale + auto (proxy leaderboard).

**Fase 4 — Editor unificato**
- Unire generator + builder + layout-editor in `/editor/:id` (tab "Stile" / "Posizioni" / "Anteprima").
- Riuso engine drag&drop di `builder.html`; salvataggio su Supabase.

**Fase 5 — Dashboard, admin, temi**
- `/dashboard` con libreria overlay reale; `/admin` licenze+utenti; `/admin/themes` per temi premium.

**Fase 6 — Rifinitura**
- Pulizia asset versionati, design system, SEO/branding Nexaris, changelog/feedback su DB.
- Rimozione file legacy e pagine ridondanti.

---

## 8. Rischi della migrazione

| Rischio | Impatto | Mitigazione |
|--------|---------|-------------|
| **Working tree eliminato / branch indietro** | Si lavora su stato sbagliato o si perdono modifiche locali | Riallineare con git **prima** di scrivere codice; confermare `origin/main` come base. |
| **Doppio sistema account → dati orfani** | Progetti localStorage non migrati spariscono per l'utente | Migrazione/import una-tantum dei progetti localStorage; comunicare che i dati locali sono per-browser. |
| **Codici già distribuiti** | Codici vecchi (localStorage) non validi nel nuovo sistema server | Mantenere compatibilità del formato codice e/o procedura di re-issue; il formato attuale è già parsabile. |
| **Riscrittura `app.js`** | Regressioni visive sugli overlay esistenti in live | Congelare lo **schema layout v2**, test di parità visiva su tutti i temi prima di sostituire. |
| **Segreti nel client** | Anon key/admin password esposte (admin password è un vero rischio) | Spostare logica admin server-side; ruotare credenziali compromesse. |
| **Link overlay esistenti** | Link già incollati in OBS smettono di funzionare | Mantenere endpoint `/overlay` retro-compatibile con i parametri attuali per un periodo di transizione. |
| **RLS mal configurate** | Leak o blocco accessi | Test espliciti delle policy per ruolo prima del rilascio. |
| **Vendor lock-in / limiti Supabase** | Costi/limiti su free tier | Stimare carico (overlay = molte letture); cache lato proxy e CDN. |
| **Assenza di build attuale → introduzione bundler** | Curva e rischio di rottura deploy Vercel | Introdurre Vite isolatamente, mantenere overlay runtime come entry separata e leggera. |

---

## 9. Priorità di sviluppo

**P0 — Bloccanti / fondamenta (fare per primi)**
1. Riallineo git del working tree (fuori da questo documento, su tua conferma).
2. Schema Supabase + RLS + Auth unica.
3. Rimozione credenziali admin hardcoded → ruoli server-side.
4. `redeem_license` server-side (codici a prova di abuso).

**P1 — Cuore del prodotto**
5. Renderer overlay **unico** data-driven (riscrittura `app.js`).
6. Schema layout v2 definitivo + parità visiva temi.
7. `/overlay` retro-compatibile.

**P2 — Esperienza utente**
8. Editor unificato (`/editor/:id`).
9. Dashboard progetti reale su Supabase.
10. Migrazione/import progetti legacy.

**P3 — Operatività & contorno**
11. `/admin` licenze+utenti, `/admin/themes`.
12. Landing + changelog + feedback sotto brand Nexaris (su DB).
13. Pulizia asset versionati e file legacy; design system condiviso.

---

### Sintesi esecutiva
RankTag oggi è un insieme di pagine HTML monolitiche con **due sistemi account paralleli** (localStorage + Supabase), **tre strumenti overlay sovrapposti** e un **renderer (`app.js`) stratificato e non manutenibile**. Le parti realmente riutilizzabili sono il **proxy leaderboard**, lo **schema layout**, l'**engine drag&drop** e il **concetto Supabase**. Nexaris deve consolidare tutto su **un'unica auth Supabase**, **un solo renderer data-driven**, **un editor unificato** e una **dashboard reale**, partendo dalle fondamenta backend (P0) prima di toccare l'UI.
