const { supabaseRest, supabaseRpc } = require("../_lib/supabase-admin");
const { makePortableCode, durationToMs } = require("../_lib/access-code");

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

function isAdmin(req) {
  const header = req.headers["x-admin-key"] || req.headers["authorization"];
  const key = process.env.ADMIN_PASSWORD;
  if (!key) return false;
  if (header === key) return true;
  if (String(header || "").replace(/^Bearer\s+/i, "") === key) return true;
  return false;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");

  if (!isAdmin(req)) {
    return res.status(401).json({ ok: false, message: "Admin non autorizzato." });
  }

  if (req.method === "GET") {
    const list = await supabaseRest("ranktag_access_codes?select=*&order=created_at.desc&limit=200");
    if (!list.ok) return res.status(list.status || 500).json({ ok: false, message: list.message });
    return res.status(200).json({ ok: true, codes: list.data || [] });
  }

  if (req.method === "POST") {
    const body = readBody(req);
    const type = body.type === "permanent" ? "permanent" : "temporary";
    const durationMs = type === "permanent" ? null : durationToMs(body.duration || { days: body.days, hours: body.hours, minutes: body.minutes });
    const code = String(body.code || makePortableCode(type, body.duration || { days: body.days, hours: body.hours, minutes: body.minutes })).trim().toUpperCase();
    const note = String(body.note || "").slice(0, 120);

    const insert = await supabaseRest("ranktag_access_codes", {
      method: "POST",
      body: {
        code,
        type,
        duration_ms: durationMs,
        note,
        disabled: false,
      },
      prefer: "return=representation",
    });

    if (!insert.ok) {
      return res.status(insert.status || 500).json({ ok: false, message: insert.message });
    }

    return res.status(200).json({ ok: true, code: Array.isArray(insert.data) ? insert.data[0] : insert.data });
  }

  if (req.method === "PATCH") {
    const body = readBody(req);
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ ok: false, message: "Codice mancante." });

    const patch = await supabaseRest(`ranktag_access_codes?code=eq.${encodeURIComponent(code)}`, {
      method: "PATCH",
      body: { disabled: !!body.disabled },
      prefer: "return=representation",
    });

    if (!patch.ok) return res.status(patch.status || 500).json({ ok: false, message: patch.message });
    return res.status(200).json({ ok: true, code: Array.isArray(patch.data) ? patch.data[0] : patch.data });
  }

  res.setHeader("Allow", "GET, POST, PATCH");
  return res.status(405).json({ ok: false, message: "Metodo non consentito" });
};
