const crypto = require("crypto");
const { supabaseRpc, isInvalidSupabaseKeyError } = require("../_lib/supabase-admin");
const { parsePortableCode } = require("../_lib/access-code");

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function signOverlayAccess(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Metodo non consentito" });
  }

  const body = readBody(req);
  const code = String(body.code || "").trim().toUpperCase();
  const userId = String(body.userId || "").trim().toLowerCase();
  const nickname = String(body.nickname || "").trim();

  if (!code || !userId) {
    return res.status(400).json({ ok: false, message: "Codice e userId obbligatori." });
  }

  if (!parsePortableCode(code) && !code.startsWith("RT-A-")) {
    return res.status(400).json({ ok: false, message: "Formato codice non valido." });
  }

  const rpc = await supabaseRpc("ranktag_redeem_access_code", {
    p_code: code,
    p_user_id: userId,
    p_nickname: nickname || userId,
  });

  if (!rpc.ok) {
    if (rpc.status === 503) {
      return res.status(503).json({
        ok: false,
        offline: true,
        message: rpc.message,
      });
    }
    if (isInvalidSupabaseKeyError(rpc.status, rpc.message)) {
      return res.status(503).json({
        ok: false,
        offline: true,
        configError: true,
        message:
          "Chiave Supabase errata su Vercel. Controlla SUPABASE_SERVICE_ROLE_KEY (deve essere service_role, non anon).",
      });
    }
    return res.status(rpc.status || 500).json({
      ok: false,
      message: rpc.data?.message || rpc.message || "Errore riscatto codice",
    });
  }

  const result = rpc.data || {};
  if (!result.ok) {
    return res.status(400).json(result);
  }

  const secret = process.env.OVERLAY_ACCESS_SECRET;
  if (secret && result.access) {
    const overlaySig = signOverlayAccess(
      {
        userId,
        type: result.access.type,
        expiresAt: result.access.expires_at || null,
      },
      secret
    );
    result.overlaySig = overlaySig;
  }

  return res.status(200).json(result);
};
