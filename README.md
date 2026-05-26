# RankTag 1.0.14

Admin restore + premium fixes.

## Include
- Ripristino admin dalla v1.0.6 admin-access-fix
- Layout Editor spostato in /private e servito da /api/layout-editor?key=...
- /layout-editor e /layout-editor.html bloccati verso 404
- Admin button nel generator
- Mantiene i fix premium più recenti inclusi Cyber Red Elite e VoidRage Inferno

## Vercel
Impostare la variabile ambiente:
ADMIN_LAYOUT_KEY

Accesso:
https://tuosito.vercel.app/api/layout-editor?key=LA_TUA_CHIAVE
