const $ = (id) => document.getElementById(id);

const badge = $("badge");
const statusText = $("statusText");
const rankText = $("rankText");
const scoreText = $("scoreText");
const nameText = $("nameText");
const rankIcon = $("rankIcon");

const params = new URLSearchParams(window.location.search);

function normalizeHexColor(value, fallback) {
  if (!value) return fallback;
  let raw = String(value).trim().replace("#", "");

  if (![3, 4, 6, 8].includes(raw.length)) return fallback;

  if (raw.length === 3 || raw.length === 4) {
    raw = raw.split("").map((c) => c + c).join("");
  }

  const rgb = raw.slice(0, 6);
  const alpha = raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1;

  if (!/^[0-9a-fA-F]{6}$/.test(rgb) || Number.isNaN(alpha)) return fallback;

  const r = parseInt(rgb.slice(0, 2), 16);
  const g = parseInt(rgb.slice(2, 4), 16);
  const b = parseInt(rgb.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function applyColors() {
  const textColor = normalizeHexColor(params.get("textColor"), "#ffffff");
  const backgroundColor = normalizeHexColor(params.get("backgroundColor"), "rgba(0,0,0,0.88)");
  const borderColor = normalizeHexColor(params.get("borderColor"), "#d0021b");
  const borderWidth = Number(params.get("borderWidth") || 5);

  document.documentElement.style.setProperty("--text-color", textColor);
  document.documentElement.style.setProperty("--background-color", backgroundColor);
  document.documentElement.style.setProperty("--border-color", borderColor);
  document.documentElement.style.setProperty("--accent-color", borderColor);
  document.documentElement.style.setProperty("--border-width", `${Math.max(0, Math.min(14, borderWidth))}px`);
}

function getPlayerFromUrl() {
  const directPlayer = params.get("player");
  if (directPlayer) return directPlayer.trim();

  const name = params.get("embarkIdName");
  const number = params.get("embarkIdNumber");

  if (name && number) return `${name.trim()}#${number.trim()}`;
  if (name) return name.trim();

  return "erdragon32#2577";
}

function normalizeLeaderboard(value) {
  const input = (value || "s10").toLowerCase().trim();

  if (input === "ranked" || input === "current" || input === "live") return "s10";
  if (input === "worldtour" || input === "world_tour") return "s10worldtour";

  return input || "s10";
}

function compactNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return new Intl.NumberFormat("it-IT").format(num);
}

function iconFromLeague(league) {
  const clean = String(league || "").toLowerCase();
  if (clean.includes("ruby")) return "RB";
  if (clean.includes("diamond")) return "D";
  if (clean.includes("platinum")) return "P";
  if (clean.includes("gold")) return "G";
  if (clean.includes("silver")) return "S";
  if (clean.includes("bronze")) return "B";
  return "TF";
}

function setLoading() {
  badge.classList.remove("error");
  badge.classList.add("loading");
  statusText.textContent = "LOADING";
  rankText.textContent = "RANKED";
  scoreText.textContent = "Cerco il player...";
  nameText.textContent = getPlayerFromUrl();
  rankIcon.textContent = "TF";
}

function setError(message, detail) {
  badge.classList.add("error");
  badge.classList.remove("loading");
  statusText.textContent = "ERRORE";
  rankText.textContent = message || "NON TROVATO";
  scoreText.textContent = detail || "Controlla Embark ID";
  nameText.textContent = getPlayerFromUrl();
  rankIcon.textContent = "!";
}

function setData(data) {
  badge.classList.remove("error", "loading");

  const league = data.league || "Unranked";
  const rankScore = data.rankScore ?? data.score ?? "-";
  const rank = data.rank ? `#${compactNumber(data.rank)}` : "";
  const change = Number(data.change || 0);
  const changeText = change === 0 ? "" : change > 0 ? ` ▲${compactNumber(change)}` : ` ▼${compactNumber(Math.abs(change))}`;

  statusText.textContent = "LIVE";
  rankText.textContent = String(league).toUpperCase();
  scoreText.textContent = `${compactNumber(rankScore)} RS ${rank}${changeText}`;
  nameText.textContent = data.player || data.name || getPlayerFromUrl();
  rankIcon.textContent = iconFromLeague(league);
}

async function loadPlayer() {
  try {
    const player = getPlayerFromUrl();
    const leaderboard = normalizeLeaderboard(params.get("leaderboard"));
    const platform = (params.get("platform") || "crossplay").toLowerCase();

    const query = new URLSearchParams({
      player,
      leaderboard,
      platform,
    });

    const res = await fetch(`/api/player?${query.toString()}`, {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.message || "Player non trovato");
    }

    setData(data);
  } catch (err) {
    setError("NON TROVATO", err.message);
  }
}

applyColors();
setLoading();
loadPlayer();

const refreshSeconds = Math.max(30, Math.min(600, Number(params.get("refresh") || 60)));
setInterval(loadPlayer, refreshSeconds * 1000);
