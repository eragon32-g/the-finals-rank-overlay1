window.RankTagConfig = window.RankTagConfig || {
  loaded: false,
  supabaseUrl: "",
  supabaseAnonKey: "",
  serverDbReady: false,
};

async function loadRankTagPublicConfig() {
  if (window.RankTagConfig.loaded) return window.RankTagConfig;
  try {
    const res = await fetch(`/api/public-config?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("config fetch failed");
    const data = await res.json();
    window.RankTagConfig = {
      loaded: true,
      supabaseUrl: data.supabaseUrl || "",
      supabaseAnonKey: data.supabaseAnonKey || "",
      serverDbReady: !!data.serverDbReady,
    };
  } catch {
    window.RankTagConfig.loaded = true;
  }
  return window.RankTagConfig;
}

function createRankTagSupabaseClient() {
  if (!window.supabase || !window.RankTagConfig.supabaseUrl || !window.RankTagConfig.supabaseAnonKey) {
    return null;
  }
  return window.supabase.createClient(window.RankTagConfig.supabaseUrl, window.RankTagConfig.supabaseAnonKey);
}
