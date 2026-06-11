const DEFAULT_URL = "https://dgmhxldfhmcywamgigji.supabase.co";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || DEFAULT_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || "";
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
    message: res.ok ? null : data?.message || text || "Errore RPC Supabase",
  };
}

module.exports = { getSupabaseConfig, supabaseRest, supabaseRpc };
