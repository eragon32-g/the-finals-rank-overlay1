const crypto = require("crypto");
const { supabaseRpc } = require("../_lib/supabase-admin");

function verifyOverlaySig(userId, type, expiresAt, sig) {
  const secret = process.env.OVERLAY_ACCESS_SECRET;
  if (!secret || !sig) return null;
  const payload = { userId, type, expiresAt: expiresAt || null };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  const [givenBody, givenSig] = String(sig).split(".");
  if (!givenBody || !givenSig || givenSig !== expected || givenBody !== body) return false;
  if (type !== "permanent" && expiresAt && Number(expiresAt) <= Date.now()) return false;
  return true;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");

  const q = req.query || {};
  const userId = String(q.userId || q.rtAccessUser || "").trim().toLowerCase();
  const mode = String(q.rtAccess || "").trim();
  const exp = Number(q.rtAccessExp || 0);
  const sig = String(q.sig || q.rtAccessSig || "");

  if (!mode) {
    return res.status(200).json({ ok: true, active: true, legacy: true });
  }

  if (sig && userId) {
    const type = mode === "permanent" ? "permanent" : "temporary";
    const valid = verifyOverlaySig(userId, type, exp || null, sig);
    if (valid === true) {
      return res.status(200).json({ ok: true, active: true, signed: true, userId });
    }
    if (valid === false) {
      return res.status(200).json({ ok: true, active: false, reason: "invalid_or_expired_sig" });
    }
  }

  if (mode === "permanent" && userId) {
    const rpc = await supabaseRpc("ranktag_check_user_access", { p_user_id: userId });
    if (rpc.ok && rpc.data?.active) {
      return res.status(200).json({ ok: true, active: true, permanent: true, userId });
    }
    if (rpc.status === 503) {
      return res.status(200).json({ ok: true, active: mode === "permanent", offline: true });
    }
    return res.status(200).json({ ok: true, active: false, reason: "no_access" });
  }

  if (mode === "expires" && exp && exp > Date.now()) {
    if (userId) {
      const rpc = await supabaseRpc("ranktag_check_user_access", { p_user_id: userId });
      if (rpc.ok && rpc.data?.active) {
        return res.status(200).json({ ok: true, active: true, expiresAt: exp, userId });
      }
    }
    return res.status(200).json({ ok: true, active: true, expiresAt: exp, clientOnly: true });
  }

  return res.status(200).json({ ok: true, active: false, reason: "expired" });
};
