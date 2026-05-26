# RankTag v1.0.6

Patch admin finale.

## Fix

- Il tasto **Layout Editor** non viene più mostrato nel generator.
- Rimane solo il tasto **Admin**.
- Dopo aver inserito la chiave admin, si apre direttamente:
  `/api/layout-editor?key=LA_TUA_CHIAVE`
- Corretto il bug che mandava la login admin verso `/api/admin-login.html`.
- Gli URL pubblici `/layout-editor` e `/layout-editor.html` restano bloccati.
- L’editor reale resta solo in `private/layout-editor.html` e viene servito dall’API protetta.

## Variabile Vercel richiesta

```txt
ADMIN_LAYOUT_KEY
```

Release corrente: `v1.0.6`
