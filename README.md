# RankTag v1.0.4

Patch correttiva e pulizia progetto.

## Cosa include

- README aggiornato al versionamento ufficiale `v1.0.x`
- Layout Editor non pubblico
- Accesso Layout Editor solo tramite area admin e chiave `ADMIN_LAYOUT_KEY`
- Pulizia asset e file vecchi delle patch precedenti
- VoidRage Inferno ricaricato con trasparenza solo fuori dai contorni
- Interno VoidRage Inferno opaco/scuro per evitare bug visivi in OBS, browser source e link finale
- Link premium stabile e senza parametro `layout` pubblico

## Accesso admin

Imposta su Vercel la variabile ambiente:

```txt
ADMIN_LAYOUT_KEY
```

Poi accedi da:

```txt
/api/layout-editor?key=LA_TUA_CHIAVE
```

La pagina pubblica `/layout-editor.html` non contiene l’editor reale: serve solo come login admin.

## Versione

Release corrente: `v1.0.4`
