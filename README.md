# RankTag v1.0.5

Patch correttiva reale su admin-only Layout Editor e VoidRage Inferno.

## Fix principali

- Rimosso completamente `public/layout-editor.html`
- Aggiunta pagina pubblica separata `admin-login.html`
- URL pubblici `/layout-editor` e `/layout-editor.html` bloccati su 404
- Editor reale servito solo da `/api/layout-editor?key=...`
- API Layout Editor protetta solo tramite variabile ambiente `ADMIN_LAYOUT_KEY`
- VoidRage Inferno rigenerato con pannello interno opaco
- Trasparenza mantenuta solo fuori dall’area overlay
- Cache/asset aggiornati a v1.0.5

## Accesso admin

Su Vercel imposta:

```txt
ADMIN_LAYOUT_KEY
```

Poi entra da:

```txt
/admin-login.html
```

Oppure direttamente:

```txt
/api/layout-editor?key=LA_TUA_CHIAVE
```

## Versione

Release corrente: `v1.0.5`
