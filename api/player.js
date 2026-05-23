const API_BASE = "https://api.the-finals-leaderboard.com/v1/leaderboard";

function normalizeLeaderboard(value) {
  const input = String(value || "s10").toLowerCase().trim();

  if (input === "ranked" || input === "current" || input === "live") return "s10";
  if (input === "worldtour" || input === "world_tour") return "s10worldtour";

  return input || "s10";
}

function cleanPlayer(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function pickBestPlayer(entries, requestedPlayer) {
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const requested = normalizeName(requestedPlayer);

  const exact = entries.find((entry) => normalizeName(entry.name) === requested);
  if (exact) return exact;

  const requestedNumber = requested.includes("#") ? requested.split("#").pop() : "";
  if (requestedNumber) {
    const sameNumber = entries.find((entry) => normalizeName(entry.name).endsWith(`#${requestedNumber}`));
    if (sameNumber) return sameNumber;
  }

  return entries[0];
}

module.exports = async function handler(req, res) {
  try {
    const player = cleanPlayer(req.query.player || req.query.name);
    const leaderboard = normalizeLeaderboard(req.query.leaderboard);
    const platform = String(req.query.platform || "crossplay").toLowerCase().trim();

    if (!player) {
      return res.status(400).json({
        ok: false,
        message: "Manca il player. Usa ?player=nome%231234 oppure ?embarkIdName=nome&embarkIdNumber=1234",
      });
    }

    if (!/^[a-z0-9]+[a-z0-9-]*$/i.test(leaderboard)) {
      return res.status(400).json({ ok: false, message: "Leaderboard non valida" });
    }

    if (!/^[a-z0-9]+$/i.test(platform)) {
      return res.status(400).json({ ok: false, message: "Platform non valida" });
    }

    const apiUrl = `${API_BASE}/${leaderboard}/${platform}?name=${encodeURIComponent(player)}`;

    const apiResponse = await fetch(apiUrl, {
      headers: {
        "accept": "application/json",
        "user-agent": "the-finals-rank-overlay-v1",
      },
      cache: "no-store",
    });

    const text = await apiResponse.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({
        ok: false,
        message: "La API ha risposto in modo non valido",
        status: apiResponse.status,
      });
    }

    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({
        ok: false,
        message: parsed?.message || "Errore API THE FINALS",
        status: apiResponse.status,
      });
    }

    const entries = Array.isArray(parsed) ? parsed : parsed?.data || parsed?.entries || [];
    const best = pickBestPlayer(entries, player);

    if (!best) {
      return res.status(404).json({
        ok: false,
        message: "Player non trovato nella leaderboard pubblica. Controlla Embark ID o top leaderboard.",
        leaderboard,
        platform,
      });
    }

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

    return res.status(200).json({
      ok: true,
      player: best.name || player,
      rank: best.rank ?? null,
      change: best.change ?? 0,
      league: best.league || "Unranked",
      leagueNumber: best.leagueNumber ?? null,
      rankScore: best.rankScore ?? null,
      clubTag: best.clubTag || null,
      steamName: best.steamName || null,
      psnName: best.psnName || null,
      xboxName: best.xboxName || null,
      leaderboard,
      platform,
      resultCount: entries.length,
      source: "api.the-finals-leaderboard.com",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Errore server overlay",
      detail: error.message,
    });
  }
};
