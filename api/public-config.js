const { getSupabaseConfig } = require("./_lib/supabase-admin");

const FALLBACK_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWh4bGRmaG1jeXdhbWdpZ2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTcyOTcsImV66cCI6MjA5NTE5MzI5N30.3EFk6f5CN9BVTL8SRCKVlPphriT4AFyUj8rpimIaGQI";

module.exports = function handler(req, res) {
  const { url, anonKey, ready } = getSupabaseConfig();
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.status(200).json({
    ok: true,
    supabaseUrl: url,
    supabaseAnonKey: anonKey || FALLBACK_ANON,
    serverDbReady: ready,
  });
};
