const crypto = require("crypto");

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

function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Metodo non consentito" });
  }

  const configuredUser = String(process.env.ADMIN_USERNAME || "admin").trim();
  const configuredPass = process.env.ADMIN_PASSWORD;

  if (!configuredPass) {
    return res.status(503).json({
      ok: false,
      message: "Admin non configurato. Imposta ADMIN_PASSWORD su Vercel.",
    });
  }

  const body = readBody(req);
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (username.toLowerCase() !== configuredUser.toLowerCase() || password !== configuredPass) {
    return res.status(401).json({ ok: false, message: "Credenziali admin non valide." });
  }

  const secret = process.env.ADMIN_SESSION_SECRET || configuredPass;
  const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
  const token = signToken({ sub: username, exp: expiresAt, role: "admin" }, secret);

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  return res.status(200).json({ ok: true, token, expiresAt });
};
