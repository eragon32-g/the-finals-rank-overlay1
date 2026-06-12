const DEFAULT_URL = "https://dgmhxldfhmcywamgigji.supabase.co";

function normalizeSupabaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || raw.includes("supabase.com/dashboard")) return DEFAULT_URL;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(raw)) return DEFAULT_URL;
  return raw.replace(/\/$/, "");
}

function getSupabaseConfig() {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const anonKey = String(process.env.SUPABASE_ANON_KEY || "").trim();
  return { url, serviceKey, anonKey, ready: Boolean(serviceKey) };
}

async function supabaseRest(path, { method = "GET", body, prefer } = {}) {
  const { url, serviceKey } = getSupabaseConfig();
  if (!serviceKey) {
    return { ok: false, status: 503, data: null, message: "SUPABASE_SERVICE_ROLE_KEY non configurata su Vercel." };
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
    message: res.ok ? null : data?.message || data?.error || text || "Errore Supabase",
  };
}

async function supabaseRpc(fn, args = {}) {
  const { url, serviceKey } = getSupabaseConfig();
  if (!serviceKey) {
    return { ok: false, status: 503, data: null, message: "SUPABASE_SERVICE_ROLE_KEY non configurata su Vercel." };
  }

  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
    message: res.ok
      ? null
      : data?.message || data?.error || data?.hint || text || "Errore Supabase",
  };
}

function isInvalidSupabaseKeyError(status, message) {
  const text = String(message || "").toLowerCase();
  return status === 401 || text.includes("invalid api key") || text.includes("invalid jwt");
}

module.exports = { getSupabaseConfig, supabaseRest, supabaseRpc, isInvalidSupabaseKeyError };
