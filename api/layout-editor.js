const fs = require("fs");
const path = require("path");

module.exports = function handler(req, res) {
  const configuredKey = process.env.ADMIN_LAYOUT_KEY || "VoidRage32Admin";
  const suppliedKey = (req.query && req.query.key) || req.headers["x-admin-key"];

  if (!configuredKey) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Admin key mancante</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#07080c;color:#fff;font-family:Arial}.box{max-width:620px;padding:28px;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:rgba(255,255,255,.06)}code{color:#ffd36a}</style></head><body><div class="box"><h1>Layout Editor bloccato</h1><p>Per abilitarlo solo admin, imposta su Vercel la variabile ambiente:</p><p><code>ADMIN_LAYOUT_KEY</code></p><p>Poi apri: <code>/api/layout-editor?key=LA_TUA_CHIAVE</code></p></div></body></html>`);
    return;
  }

  if (!suppliedKey || suppliedKey !== configuredKey) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Accesso negato</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#07080c;color:#fff;font-family:Arial}.box{max-width:520px;padding:28px;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:rgba(255,255,255,.06)}</style></head><body><div class="box"><h1>Accesso negato</h1><p>Layout Editor disponibile solo per admin.</p></div></body></html>`);
    return;
  }

  const file = path.join(process.cwd(), "private", "layout-editor.html");
  const html = fs.readFileSync(file, "utf8").replace("</body>", `<script>try{localStorage.setItem('ranktag-admin','1')}catch{}</script></body>`);
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(html);
};
