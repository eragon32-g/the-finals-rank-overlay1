const $ = (id) => document.getElementById(id);

const badge = $("badge");
const statusText = $("statusText");
const rankText = $("rankText");
const scoreText = $("scoreText");
const nameText = $("nameText");
const brandDrawer = $("brandDrawer");
const brandMarqueeText = $("brandMarqueeText");
const rankIcon = $("rankIcon");
const badgeImage = $("badgeImage");

const OVERLAY_VERSION = "022";
const params = new URLSearchParams(window.location.search);

const VOIDRAGE_INFERNO_LAYOUT_LOCKED = {
  "version": "0.2.2",
  "schema": "ranktag-premium-layout-v2",
  "style": "voidrage-inferno",
  "note": "Secondo overlay premium separato. Posizioni gestibili via Layout Editor.",
  "canvas": {
    "width": 470,
    "height": 160
  },
  "background": "/assets/premium/voidrage-inferno-fit-v113.png",
  "elements": {
    "badge": {
      "x": 12,
      "y": 20,
      "w": 118,
      "h": 110,
      "fontSize": 0,
      "z": 5
    },
    "rank": {
      "x": 150,
      "y": 42,
      "w": 230,
      "h": 30,
      "fontSize": 25,
      "z": 6
    },
    "score": {
      "x": 152,
      "y": 78,
      "w": 120,
      "h": 16,
      "fontSize": 12,
      "z": 6
    },
    "player": {
      "x": 265,
      "y": 78,
      "w": 150,
      "h": 16,
      "fontSize": 10.5,
      "z": 6
    },
    "brand": {
      "x": 152,
      "y": 108,
      "w": 260,
      "h": 18,
      "fontSize": 9.5,
      "z": 6
    }
  }
};

const CYBER_RED_ELITE_LAYOUT_LOCKED = {
  "version": "0.2.2",
  "schema": "ranktag-premium-layout-v2",
  "style": "cyber-red-elite",
  "note": "Include posizione e dimensioni: x/y/w/h/fontSize/z. Questi valori devono essere importati nel pubblico e nel link finale.",
  "canvas": {
    "width": 470,
    "height": 160
  },
  "background": "/assets/premium/cyber-red-elite-bg-v96.png",
  "elements": {
    "badge": {
      "x": 7,
      "y": 9,
      "w": 136,
      "h": 121,
      "fontSize": 0,
      "z": 5
    },
    "rank": {
      "x": 164,
      "y": 39,
      "w": 215,
      "h": 30,
      "fontSize": 25,
      "z": 6
    },
    "score": {
      "x": 165,
      "y": 78,
      "w": 120,
      "h": 16,
      "fontSize": 12,
      "z": 6
    },
    "player": {
      "x": 271,
      "y": 78,
      "w": 142,
      "h": 16,
      "fontSize": 10.5,
      "z": 6
    },
    "brand": {
      "x": 165,
      "y": 100,
      "w": 270,
      "h": 16,
      "fontSize": 9.5,
      "z": 6
    }
  }
};


function normalizeThemeStyle(value) {
  const input = String(value || "default").toLowerCase().trim();
  const allowed = ["default", "cyber-red-elite", "voidrage-inferno", "cyber-red", "glass-minimal", "premium-gold", "tournament-panel"];
  return allowed.includes(input) ? input : "default";
}

const themeStyle = normalizeThemeStyle(params.get("themeStyle"));
document.documentElement.dataset.themeStyle = themeStyle;
document.body?.classList?.add(`theme-${themeStyle}`);

function applyThemeStyleClass() {
  const card = document.querySelector(".rank-card") || document.getElementById("rankCard") || document.querySelector(".badge");
  if (!card) return;
  ["default","cyber-red-elite","voidrage-inferno","cyber-red","glass-minimal","premium-gold","tournament-panel"].forEach((s) => {
    card.classList.remove(`theme-${s}`);
  });
  card.classList.add(`theme-${themeStyle}`);
  card.setAttribute("data-theme-style", themeStyle);
  document.documentElement.dataset.themeStyle = themeStyle;
}



const EMBARK_BADGE_BASE = "https://id.embark.games/images/leaderboards/leagues/";

const ALLOWED_BADGE_FILES = new Set([
  "bronze-4", "bronze-3", "bronze-2", "bronze-1",
  "silver-4", "silver-3", "silver-2", "silver-1",
  "gold-4", "gold-3", "gold-2", "gold-1",
  "platinum-4", "platinum-3", "platinum-2", "platinum-1",
  "diamond-4", "diamond-3", "diamond-2", "diamond-1",
  "ruby"
]);

const LEAGUE_NUMBER_TO_FILE = [
  "",
  "bronze-4.png",
  "bronze-3.png",
  "bronze-2.png",
  "bronze-1.png",
  "silver-4.png",
  "silver-3.png",
  "silver-2.png",
  "silver-1.png",
  "gold-4.png",
  "gold-3.png",
  "gold-2.png",
  "gold-1.png",
  "platinum-4.png",
  "platinum-3.png",
  "platinum-2.png",
  "platinum-1.png",
  "diamond-4.png",
  "diamond-3.png",
  "diamond-2.png",
  "diamond-1.png",
  "ruby.png",
];

let lockedBrandConfig = null;
let brandTimersStarted = false;
let brandHideTimer = null;

function normalizeHexColor(value, fallback) {
  if (!value) return fallback;
  let raw = String(value).trim().replace("#", "");
  if (![3, 4, 6, 8].includes(raw.length)) return fallback;
  if (raw.length === 3 || raw.length === 4) raw = raw.split("").map((c) => c + c).join("");
  const rgb = raw.slice(0, 6);
  const alpha = raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1;
  if (!/^[0-9a-fA-F]{6}$/.test(rgb) || Number.isNaN(alpha)) return fallback;
  const r = parseInt(rgb.slice(0, 2), 16);
  const g = parseInt(rgb.slice(2, 4), 16);
  const b = parseInt(rgb.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function applyColors() {
  const textColor = normalizeHexColor(params.get("textColor"), "#f4f7fb");
  const backgroundColor = normalizeHexColor(params.get("backgroundColor"), "rgba(10,12,16,0.98)");
  const borderColor = normalizeHexColor(params.get("borderColor"), "#7c848f");
  const borderWidth = Number(params.get("borderWidth") || 2);
  const rankColor = normalizeHexColor(params.get("rankColor"), "#f5f7fa");
  const scoreColor = normalizeHexColor(params.get("scoreColor"), "#f0d9aa");
  const nameColor = normalizeHexColor(params.get("nameColor"), "rgba(232,237,244,0.94)");
  const extraColor = normalizeHexColor(params.get("extraColor"), "rgba(245,247,251,0.92)");
  const brandAccent = normalizeHexColor(params.get("brandAccent"), "#ff2a17");

  document.documentElement.style.setProperty("--text-color", textColor);
  document.documentElement.style.setProperty("--background-color", backgroundColor);
  document.documentElement.style.setProperty("--border-color", borderColor);
  document.documentElement.style.setProperty("--border-width", `${Math.max(0, Math.min(14, borderWidth))}px`);
  document.documentElement.style.setProperty("--rank-color", rankColor);
  document.documentElement.style.setProperty("--score-color", scoreColor);
  document.documentElement.style.setProperty("--name-color", nameColor);
  document.documentElement.style.setProperty("--extra-color", extraColor);
  document.documentElement.style.setProperty("--brand-accent", brandAccent);
}


function paramEnabled(name, fallback = false) {
  const raw = params.get(name);
  if (raw === null || raw === undefined || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(raw).toLowerCase());
}

function applyBaseVisualOptions() {
  if (!badge) return;
  const isBase = !["cyber-red-elite", "voidrage-inferno"].includes(themeStyle);
  const options = {
    "base-side-detail": paramEnabled("baseSideDetail", false),
    "base-badge-glow": paramEnabled("baseBadgeGlow", false),
    "base-badge-ring": paramEnabled("baseBadgeRing", false),
    "base-pulse": paramEnabled("basePulse", false),
    "base-scanline": paramEnabled("baseScanline", false),
  };

  Object.keys(options).forEach((className) => {
    badge.classList.toggle(className, Boolean(isBase && options[className]));
  });

  document.documentElement.dataset.baseVisual = isBase ? "enabled" : "off";
}



/* RankTag BETA 0.2.1 - base overlay layout renderer */

function decodeRankTagPayload(raw) {
  if (!raw) return "";
  const safe = String(raw).replace(/-/g, "+").replace(/_/g, "/").replace(/\./g, "=");
  try { return decodeURIComponent(escape(atob(safe))); } catch {}
  try { return atob(safe); } catch {}
  return String(raw);
}

function decodeBaseLayoutParam() {
  const raw = params.get("baseLayout");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeRankTagPayload(raw));
    return parsed && parsed.elements ? parsed : null;
  } catch {}
  try {
    const parsed = JSON.parse(raw);
    return parsed && parsed.elements ? parsed : null;
  } catch {}
  return null;
}

function applyBaseLayoutFromUrl() {
  if (!badge) return;
  const isBase = !["cyber-red-elite", "voidrage-inferno"].includes(themeStyle);
  if (!isBase) return;

  const layout = decodeBaseLayoutParam();
  const clipEnabled = paramEnabled("clipFrame", true);
  badge.classList.toggle("base-clip-frame", Boolean(clipEnabled));

  if (!layout || !layout.elements) return;

  const e = layout.elements;
  const shellOffsetX = 45;
  const shellOffsetY = 33;
  const apply = (node, cfg, rootCoords = true) => {
    if (!node || !cfg) return;
    const x = Number(cfg.x || 0) - (rootCoords ? shellOffsetX : 0);
    const y = Number(cfg.y || 0) - (rootCoords ? shellOffsetY : 0);
    node.style.position = "absolute";
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.width = `${Math.max(1, Number(cfg.w || 10))}px`;
    node.style.height = `${Math.max(1, Number(cfg.h || 10))}px`;
    node.style.zIndex = `${Number(cfg.z || 1)}`;
    if (cfg.fontSize) node.style.fontSize = `${Number(cfg.fontSize)}px`;
    if (cfg.h) node.style.lineHeight = `${Number(cfg.h)}px`;
  };

  // make base overlay absolute-layout capable
  badge.style.position = "relative";
  badge.style.width = "470px";
  badge.style.height = "160px";

  const shell = badge.querySelector(".card-shell");
  const rankMark = badge.querySelector(".rank-mark");
  const rankInfo = badge.querySelector(".rank-info");

  if (shell) {
    // Keep the real base frame visible while applying custom layout coordinates.
    shell.style.position = "absolute";
    shell.style.left = "58px";
    shell.style.top = "38px";
    shell.style.width = "400px";
    shell.style.height = "84px";
    shell.style.padding = "0";
    shell.style.margin = "0";
    shell.style.overflow = "visible";
  }

  apply(rankMark, e.badge);
  apply(rankText, e.rank);
  apply(scoreText, e.score);
  apply(nameText, e.player);
  apply(brandDrawer, e.brand);
  if (brandDrawer) {
    brandDrawer.style.display = "block";
    brandDrawer.style.overflow = "hidden";
  }

  if (rankInfo) {
    rankInfo.style.position = "static";
    rankInfo.style.padding = "0";
    rankInfo.style.height = "auto";
    rankInfo.style.display = "contents";
  }
}

(function rankTagBaseLayoutLoadHooks006(){
  window.addEventListener("load", () => {
    [50, 180, 450, 1000].forEach((ms) => setTimeout(() => {
      try { applyBaseLayoutFromUrl(); renderCustomImageElements(); } catch(e) {}
    }, ms));
  });
})();

/* RankTag BETA 0.2.1 - custom image elements renderer */
function decodeCustomElementsParam() {
  const raw = params.get("customElements");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeRankTagPayload(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {}
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {}
  return [];
}

function renderCustomImageElements() {
  if (!badge) return;
  badge.querySelectorAll(".rt-custom-image-layer").forEach((el) => el.remove());
  const elements = decodeCustomElementsParam()
    .filter((item) => item && item.type === "image" && item.src)
    .slice(0, 3);

  elements.forEach((item, index) => {
    const img = document.createElement("img");
    img.className = "rt-custom-image-layer";
    img.src = item.src;
    img.alt = "";
    img.style.position = "absolute";
    img.style.left = `${Number(item.x || 0)}px`;
    img.style.top = `${Number(item.y || 0)}px`;
    img.style.width = `${Math.max(1, Number(item.w || 64))}px`;
    img.style.height = `${Math.max(1, Number(item.h || 64))}px`;
    img.style.opacity = `${Math.max(0, Math.min(1, Number(item.opacity ?? 1)))}`;
    img.style.zIndex = `${Number(item.z || 30)}`;
    img.style.objectFit = "contain";
    img.style.pointerEvents = "none";
    img.style.userSelect = "none";
    img.draggable = false;
    badge.appendChild(img);
  });
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
  if (n === null || n === undefined || String(n).trim() === "") return "-";
  const normalized = String(n).replace(/[^\d.-]/g, "");
  const num = Number(normalized);
  if (!Number.isFinite(num)) return String(n);
  return new Intl.NumberFormat("it-IT").format(num);
}

function normalizeRankDisplay(value) {
  return String(value || "")
    .replace(/\bIV\b/g, "4")
    .replace(/\bIII\b/g, "3")
    .replace(/\bII\b/g, "2")
    .replace(/\bI\b/g, "1")
    .replace(/\s+/g, " ")
    .trim();
}

function baseLeague(league) {
  const clean = String(league || "").toLowerCase();
  if (clean.includes("ruby")) return "ruby";
  if (clean.includes("diamond")) return "diamond";
  if (clean.includes("platinum")) return "platinum";
  if (clean.includes("gold")) return "gold";
  if (clean.includes("silver")) return "silver";
  if (clean.includes("bronze")) return "bronze";
  return "unranked";
}

function romanToFileDivision(divisionOrLeague) {
  const clean = String(divisionOrLeague || "").toLowerCase().trim();
  if (clean === "i" || clean === "1" || clean.endsWith(" i") || clean.includes("division 1")) return "1";
  if (clean === "ii" || clean === "2" || clean.endsWith(" ii") || clean.includes("division 2")) return "2";
  if (clean === "iii" || clean === "3" || clean.endsWith(" iii") || clean.includes("division 3")) return "3";
  if (clean === "iv" || clean === "4" || clean.endsWith(" iv") || clean.includes("division 4")) return "4";
  return "";
}

function iconFromLeague(league) {
  const clean = baseLeague(league);
  if (clean === "ruby") return "RB";
  if (clean === "diamond") return "D";
  if (clean === "platinum") return "P";
  if (clean === "gold") return "G";
  if (clean === "silver") return "S";
  if (clean === "bronze") return "B";
  return "TF";
}

function sanitizeBadgeFile(value) {
  const clean = String(value || "").toLowerCase().replace(".png", "").replace(/[^a-z0-9-]/g, "");
  return ALLOWED_BADGE_FILES.has(clean) ? clean : "";
}

function getOfficialBadgeFile({ league, division, badge, badgeFile, leagueNumber }) {
  const exactFile = sanitizeBadgeFile(badgeFile);
  if (exactFile) return `${exactFile}.png`;
  const number = Number(leagueNumber);
  if (Number.isInteger(number) && LEAGUE_NUMBER_TO_FILE[number]) return LEAGUE_NUMBER_TO_FILE[number];
  const cleanBadge = baseLeague(badge || league);
  if (cleanBadge === "ruby") return "ruby.png";
  if (cleanBadge === "unranked") return "";
  const div = romanToFileDivision(division || league) || "1";
  return `${cleanBadge}-${div}.png`;
}

function getOfficialBadgeUrl(info) {
  const file = getOfficialBadgeFile(info);
  return file ? EMBARK_BADGE_BASE + file : "";
}

async function imageExists(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(false);
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.referrerPolicy = "no-referrer";
    img.src = src;
  });
}

async function setBadgeVisual({ league, division, forcedBadge, badgeFile, leagueNumber }) {
  const officialUrl = getOfficialBadgeUrl({ league, division, badge: forcedBadge, badgeFile, leagueNumber });
  const fallbackName = sanitizeBadgeFile(badgeFile) || String(forcedBadge || baseLeague(league)).toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const localPng = `/assets/badges/${fallbackName}.png`;
  const localSvg = `/assets/badges/${fallbackName}.svg`;

  badgeImage.classList.add("hidden");
  rankIcon.classList.remove("hidden");
  rankIcon.textContent = iconFromLeague(league);

  if (officialUrl && await imageExists(officialUrl)) {
    badgeImage.src = officialUrl;
    badgeImage.classList.remove("hidden");
    rankIcon.classList.add("hidden");
    return;
  }
  if (await imageExists(localPng)) {
    badgeImage.src = localPng;
    badgeImage.classList.remove("hidden");
    rankIcon.classList.add("hidden");
    return;
  }
  if (await imageExists(localSvg)) {
    badgeImage.src = localSvg;
    badgeImage.classList.remove("hidden");
    rankIcon.classList.add("hidden");
  }
}

async function loadLockedBranding() {
  if (lockedBrandConfig) return lockedBrandConfig;
  try {
    const res = await fetch(`/brand.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Brand API not available");
    lockedBrandConfig = await res.json();
    console.log("[Overlay brand]", lockedBrandConfig);
  } catch {
    lockedBrandConfig = {
      enabled: true,
      brandText: "ERDRAGON32",
      discordText: "discord.gg/cffTwCcCGD",
      callToAction: "Join the Void",
      mode: "marquee",
      separator: " • ",
      intervalSeconds: 18,
      visibleSeconds: 7,
      scrollSeconds: 8,
      showOnLoad: true
    };
  }
  return lockedBrandConfig;
}

function cleanBrand(value, max = 120) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

function buildBrandText(config) {
  if (!config || config.enabled === false) return "";

  const brand = cleanBrand(config.brandText, 35);
  const cta = cleanBrand(config.callToAction, 45);
  const discord = cleanBrand(config.discordText, 45);
  const separator = config.separator || " • ";
  const mode = String(config.mode || "marquee").toLowerCase();

  if (mode === "discord") return discord;
  if (mode === "brand") return brand;
  if (mode === "cta") return cta;

  return [brand, cta, discord].filter(Boolean).join(separator);
}

function showBrandDrawer(config) {
  if (!brandDrawer || !brandMarqueeText) return;

  const visibleSeconds = Math.max(2, Math.min(20, Number(config.visibleSeconds || 7)));

  brandDrawer.classList.add("is-visible");
  brandDrawer.closest(".card-shell")?.classList.add("brand-open");

  if (brandHideTimer) clearTimeout(brandHideTimer);
  brandHideTimer = setTimeout(() => {
    brandDrawer.classList.remove("is-visible");
    brandDrawer.closest(".card-shell")?.classList.remove("brand-open");
  }, visibleSeconds * 1000);
}

async function setupLockedBranding() {
  const config = await loadLockedBranding();
  const text = buildBrandText(config);

  if (!text || config.enabled === false) {
    brandDrawer.classList.add("is-empty");
    return;
  }

  brandDrawer.classList.remove("is-empty");
  brandMarqueeText.textContent = text;

  const scrollSeconds = Math.max(4, Math.min(30, Number(config.scrollSeconds || 8)));
  document.documentElement.style.setProperty("--brand-duration", `${scrollSeconds}s`);

  if (brandTimersStarted) return;
  brandTimersStarted = true;

  const intervalSeconds = Math.max(8, Math.min(180, Number(config.intervalSeconds || 18)));
  const showOnLoad = config.showOnLoad !== false;

  if (showOnLoad) setTimeout(() => showBrandDrawer(config), 800);
  setInterval(() => showBrandDrawer(config), intervalSeconds * 1000);
}

function shouldShowStatus(status) {
  const explicit = String(params.get("showStatus") || "").toLowerCase();
  if (["1", "true", "yes"].includes(explicit)) return true;
  if (["0", "false", "no"].includes(explicit)) return false;
  return false;
}

function setLoading() {
  badge.classList.remove("error");
  badge.classList.add("loading");
  statusText.textContent = "LIVE";
  statusText.classList.add("hidden");
  rankText.textContent = "RANKED";
  scoreText.textContent = `${(params.get("scoreLabel") || "ELO").toUpperCase()}: ...`;
  nameText.textContent = getPlayerFromUrl();
  setupLockedBranding();
  rankIcon.textContent = "TF";
  badgeImage.classList.add("hidden");
  rankIcon.classList.remove("hidden");
}

function setError(message, detail) {
  badge.classList.add("error");
  badge.classList.remove("loading");
  statusText.textContent = "ERRORE";
  if (shouldShowStatus("ERRORE")) statusText.classList.remove("hidden");
  else statusText.classList.add("hidden");
  rankText.textContent = message || "NON TROVATO";
  scoreText.textContent = detail || "Controlla Embark ID";
  nameText.textContent = getPlayerFromUrl();
  setupLockedBranding();
  rankIcon.textContent = "!";
  badgeImage.classList.add("hidden");
  rankIcon.classList.remove("hidden");
}

async function setData(data, status = "LIVE") {
  badge.classList.remove("error", "loading");

  const league = data.league || "Unranked";
  const division = data.division || "";
  const rankScoreRaw = data.rankScore ?? data.score ?? params.get("rankScore") ?? params.get("score") ?? params.get("points") ?? "-";
  const rankScore = compactNumber(rankScoreRaw);
  const rank = data.rank ? `#${compactNumber(data.rank)}` : "";
  const change = Number(data.change || 0);
  const changeText = change === 0 ? "" : change > 0 ? ` ▲${compactNumber(change)}` : ` ▼${compactNumber(Math.abs(change))}`;
  const scoreLabel = (params.get("scoreLabel") || "ELO").toUpperCase();

  if (shouldShowStatus(status) && status !== "MANUAL") {
    statusText.textContent = status;
    statusText.classList.remove("hidden");
  } else {
    statusText.classList.add("hidden");
  }

  rankText.textContent = normalizeRankDisplay(league).toUpperCase();
  scoreText.textContent = `${scoreLabel}: ${rankScore}${rank ? " " + rank : ""}${changeText}`;
  nameText.textContent = data.player || data.name || getPlayerFromUrl();
  setupLockedBranding();
  try { applyBaseLayoutFromUrl(); } catch(e) { console.warn(e); }
  try { renderCustomImageElements(); } catch(e) { console.warn(e); }

  await setBadgeVisual({
    league,
    division,
    forcedBadge: data.badge,
    badgeFile: data.badgeFile,
    leagueNumber: data.leagueNumber,
  });
  try { renderBaseBuilderLayoutAuthoritative(); } catch(e) { console.warn(e); }
  try { renderCustomImageElements(); } catch(e) { console.warn(e); }
  try { scheduleAuthoritativeBuilderLayout(); } catch(e) { console.warn(e); }
}

async function loadManual() {
  const player = getPlayerFromUrl();
  const leagueBase = params.get("league") || "Unranked";
  const division = params.get("division") || "";
  const league = normalizeRankDisplay(`${leagueBase}${division ? " " + division : ""}`.trim());
  const rankScore = params.get("rankScore") || params.get("score") || params.get("points") || "0";
  const rank = params.get("rank") || "";
  const badge = params.get("badge") || baseLeague(leagueBase);
  const badgeFile = params.get("badgeFile") || "";
  const leagueNumber = params.get("leagueNumber") || "";

  await setData({ player, league, division, rankScore, rank, badge, badgeFile, leagueNumber }, "MANUAL");
}

async function loadAuto() {
  try {
    const player = getPlayerFromUrl();
    const leaderboard = normalizeLeaderboard(params.get("leaderboard"));
    const platform = (params.get("platform") || "crossplay").toLowerCase();
    const query = new URLSearchParams({ player, leaderboard, platform });
    const res = await fetch(`/api/player?${query.toString()}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.message || "Player non trovato");
    await setData(data, "LIVE");
  } catch (err) {
    setError("NON TROVATO", err.message);
  }
}

function isManualMode() {
  return ["manual", "1", "true", "yes"].includes(String(params.get("mode") || params.get("manual") || "").toLowerCase());
}

applyColors();
try { applyBaseVisualOptions(); } catch(e) { console.warn(e); }
try { applyBaseLayoutFromUrl(); } catch(e) { console.warn(e); }
try { renderCustomImageElements(); } catch(e) { console.warn(e); }
setLoading();

if (isManualMode()) {
  loadManual();
} else {
  loadAuto();
  const refreshSeconds = Math.max(30, Math.min(600, Number(params.get("refresh") || 60)));
  setInterval(loadAuto, refreshSeconds * 1000);
}

try { applyThemeStyleClass(); } catch(e) { console.warn(e); }
try { applyBaseVisualOptions(); } catch(e) { console.warn(e); }


/* RankTag BETA 0.2.1 Plus style finalizer */
(function applyRankTagPlusStyleV38() {
  const allowed = ["default", "cyber-red-elite", "voidrage-inferno", "cyber-red", "glass-minimal", "premium-gold", "tournament-panel"];
  const style = typeof themeStyle !== "undefined" ? themeStyle : (new URLSearchParams(window.location.search).get("themeStyle") || "default");
  const normalized = allowed.includes(String(style).toLowerCase()) ? String(style).toLowerCase() : "default";
  const card =
    document.querySelector(".rank-card") ||
    document.querySelector(".overlay-card") ||
    document.querySelector(".badge") ||
    document.querySelector("[data-rank-card]") ||
    document.body.firstElementChild;

  if (!card) return;

  allowed.forEach((name) => card.classList.remove(`theme-${name}`));
  card.classList.add("rank-card");
  card.classList.add(`theme-${normalized}`);
  card.setAttribute("data-theme-style", normalized);

  const badgeImg =
    document.querySelector(".rank-badge img") ||
    document.querySelector(".rank-badge-wrap img") ||
    document.querySelector("#rankBadge") ||
    document.querySelector("img");

  if (badgeImg) {
    badgeImg.classList.add("rank-plus-emblem");
    const wrap = badgeImg.closest(".rank-badge-wrap") || badgeImg.parentElement;
    if (wrap) wrap.classList.add("rank-badge-wrap", "plus-emblem-wrap");
  }

  document.documentElement.dataset.themeStyle = normalized;
})();


/* RankTag BETA 0.2.1 - single source image-base Plus engine */
let rankTagPlusLayoutsPromise = null;

function loadRankTagPlusLayouts() {
  if (!rankTagPlusLayoutsPromise) {
    rankTagPlusLayoutsPromise = fetch(`/assets/plus/styles-layout.json?v=${OVERLAY_VERSION}`)
      .then((response) => response.ok ? response.json() : {})
      .catch(() => ({}));
  }
  return rankTagPlusLayoutsPromise;
}

(function rankTagImageBaseEngineV52() {
  const IMAGE_BASE_STYLES = ["cyber-red"];
  if (!IMAGE_BASE_STYLES.includes(themeStyle)) return;

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }

  function parseScoreParts(text) {
    const raw = String(text || "").trim();
    const match = raw.match(/^([^:]+):\s*([^#▲▼]+)(.*)$/i);

    if (!match) {
      return {
        label: String(params.get("scoreLabel") || "ELO").trim(),
        value: raw || "-",
        extra: ""
      };
    }

    return {
      label: String(match[1] || "ELO").trim(),
      value: String(match[2] || "-").trim(),
      extra: String(match[3] || "").trim()
    };
  }

  function readOverlayState() {
    const rankFromDom = rankText?.textContent || `${params.get("league") || "Platinum"} ${params.get("division") || "1"}`;
    return {
      player: String(nameText?.textContent || getPlayerFromUrl() || params.get("player") || "NomePlayer#1234").trim(),
      rank: normalizeRankDisplay(rankFromDom).toUpperCase(),
      score: parseScoreParts(scoreText?.textContent || `${params.get("scoreLabel") || "ELO"}: ${params.get("rankScore") || "37705"}`),
      emblemSrc: badgeImage?.getAttribute("src") || buildBadgeImageUrl(params.get("badgeFile") || "platinum-1")
    };
  }

  function applyPosition(element, config) {
    if (!element || !config) return;

    element.style.left = `${config.x}px`;
    element.style.top = `${config.y}px`;

    if (config.w != null) element.style.width = `${config.w}px`;
    if (config.h != null) element.style.height = `${config.h}px`;
    if (config.fontSize != null) element.style.fontSize = `${config.fontSize}px`;
    if (config.lineHeight != null) element.style.lineHeight = String(config.lineHeight);
    if (config.letterSpacing != null) element.style.letterSpacing = `${config.letterSpacing}px`;
    if (config.textTransform) element.style.textTransform = config.textTransform;
    if (config.align) element.style.textAlign = config.align;
  }

  async function renderImageBaseStyle() {
    const layouts = await loadRankTagPlusLayouts();
    const config = layouts[themeStyle];
    const root = badge || document.getElementById("badge");

    if (!config || !root) return;

    const state = readOverlayState();

    root.className = "badge rt52-root";
    root.setAttribute("data-theme-style", themeStyle);
    root.style.setProperty("--rt52-width", `${config.canvas.width}px`);
    root.style.setProperty("--rt52-height", `${config.canvas.height}px`);

    root.innerHTML = `
      <div class="rt52-card rt52-${themeStyle}" data-animation="${esc(config.animation || "")}">
        <img class="rt52-base" src="${esc(config.baseImage)}?v=${OVERLAY_VERSION}" alt="${esc(themeStyle)} base" />
        <div class="rt52-shine"></div>

        <div class="rt52-emblemWrap">
          <img class="rt52-emblem" src="${esc(state.emblemSrc)}" alt="rank emblem" />
        </div>

        <div class="rt52-player" title="${esc(state.player)}">${esc(state.player)}</div>

        <div class="rt52-rankLabel">RANK</div>
        <div class="rt52-rankValue">${esc(state.rank)}</div>

        <div class="rt52-scoreLabel">${esc(state.score.label)}</div>
        <div class="rt52-scoreValue">${esc(state.score.value)}</div>
      </div>
    `;

    const card = root.querySelector(".rt52-card");
    const emblemWrap = root.querySelector(".rt52-emblemWrap");
    const emblem = root.querySelector(".rt52-emblem");

    card.style.width = `${config.canvas.width}px`;
    card.style.height = `${config.canvas.height}px`;

    applyPosition(emblemWrap, config.emblem);
    if (config.emblem?.w != null) emblem.style.width = `${config.emblem.w}px`;
    if (config.emblem?.h != null) emblem.style.height = `${config.emblem.h}px`;

    applyPosition(root.querySelector(".rt52-player"), config.player);
    applyPosition(root.querySelector(".rt52-rankLabel"), config.rankLabel);
    applyPosition(root.querySelector(".rt52-rankValue"), config.rank);
    applyPosition(root.querySelector(".rt52-scoreLabel"), config.scoreLabel);
    applyPosition(root.querySelector(".rt52-scoreValue"), config.score);
  }

  const originalSetData = setData;
  setData = async function(...args) {
    await originalSetData.apply(this, args);
    await renderImageBaseStyle();
  };

  window.addEventListener("load", () => {
    setTimeout(() => renderImageBaseStyle(), 120);
    setTimeout(() => renderImageBaseStyle(), 500);
    setTimeout(() => renderImageBaseStyle(), 1000);
  });
})();

/* RankTag BETA 0.2.1 render marker */
document.documentElement.setAttribute("data-ranktag-version", "0.2.2");











/* RankTag BETA 0.2.1 - Premium backdrop engine: Cyber Red Elite keeps the stable CSS layout and adds a premium skin image */
(function rankTagPremiumBackdropV78(){
  if (themeStyle !== "cyber-red-elite") return;

  function ensureStyle() {
    if (document.getElementById("rt78-premium-backdrop-style")) return;
    const style = document.createElement("style");
    style.id = "rt78-premium-backdrop-style";
    style.textContent = `
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: transparent;
      }

      body {
        display: grid;
        place-items: center;
      }

      #overlay.overlay {
        width: 470px !important;
        height: 160px !important;
        display: grid !important;
        place-items: center !important;
        overflow: hidden !important;
      }

      #badge.badge.rt78-cyber-red-elite {
        position: relative !important;
        width: 402px !important;
        min-width: 402px !important;
        max-width: 402px !important;
        height: 128px !important;
        min-height: 128px !important;
        max-height: 128px !important;
        overflow: hidden !important;
        display: block !important;
        color: var(--text-color);
        background: transparent url('/assets/premium/cyber-red-elite-bg-v96.png?v=021') center / 100% 100% no-repeat !important;
        box-shadow: none !important;
        border: none !important;
        transform: none !important;
      }

      #badge.rt78-cyber-red-elite.loading,
      #badge.rt78-cyber-red-elite.error {
        background-color: transparent !important;
      }

      #badge.rt78-cyber-red-elite .rank-mark {
        position: absolute !important;
        left: 18px !important;
        top: 35px !important;
        width: 77px !important;
        height: 75px !important;
        margin: 0 !important;
        flex: 0 0 77px !important;
        z-index: 5 !important;
        display: grid !important;
        place-items: center !important;
      }

      #badge.rt78-cyber-red-elite .badge-image {
        width: 77px !important;
        height: 75px !important;
        object-fit: contain !important;
        filter: drop-shadow(0 2px 10px rgba(255,255,255,.18)) drop-shadow(0 2px 10px rgba(255,42,23,.22)) !important;
      }

      #badge.rt78-cyber-red-elite .rank-icon {
        width: 77px !important;
        height: 75px !important;
        font-size: 18px !important;
        border-radius: 14px !important;
        background: linear-gradient(145deg, #dbe2ec, #515865) !important;
        border: 1px solid rgba(255,255,255,0.24) !important;
        box-shadow: 0 0 8px rgba(255,255,255,.12), 0 0 12px rgba(255,42,23,.12) !important;
      }

      #badge.rt78-cyber-red-elite .card-shell {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        overflow: visible !important;
      }

      #badge.rt78-cyber-red-elite .card-shell::before,
      #badge.rt78-cyber-red-elite .card-top-gloss,
      #badge.rt78-cyber-red-elite .card-bottom-line,
      #badge.rt78-cyber-red-elite .card-side-glow {
        display: none !important;
      }

      #badge.rt78-cyber-red-elite .rank-info {
        position: absolute !important;
        inset: 0 !important;
        padding: 0 !important;
        transform: none !important;
        opacity: 1 !important;
        display: block !important;
      }

      #badge.rt78-cyber-red-elite .title-row,
      #badge.rt78-cyber-red-elite .meta-row {
        display: block !important;
        min-width: 0 !important;
        gap: 0 !important;
        margin: 0 !important;
        white-space: normal !important;
        overflow: visible !important;
      }

      #badge.rt78-cyber-red-elite .rank-text {
        position: absolute !important;
        left: 114px !important;
        top: 41px !important;
        width: 215px !important;
        font-size: 25px !important;
        line-height: 1 !important;
        font-weight: 1000 !important;
        letter-spacing: .3px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        color: #4feaff !important;
        text-shadow: 0 0 12px rgba(79,234,255,.18), 0 2px 6px rgba(0,0,0,.72) !important;
        text-transform: uppercase !important;
      }

      #badge.rt78-cyber-red-elite .status {
        position: absolute !important;
        right: 58px !important;
        top: 14px !important;
        min-width: 54px !important;
        padding: 3px 8px !important;
        font-size: 9px !important;
        line-height: 1 !important;
        border-radius: 999px !important;
        background: rgba(255, 42, 23, 0.22) !important;
        border: 1px solid rgba(255, 112, 72, 0.28) !important;
        color: #ffd7cf !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
      }

      #badge.rt78-cyber-red-elite .score-text {
        position: absolute !important;
        left: 115px !important;
        top: 78px !important;
        width: 120px !important;
        font-size: 12px !important;
        line-height: 1 !important;
        font-weight: 1000 !important;
        color: #fff3ea !important;
        text-shadow: 0 1px 5px rgba(0,0,0,.75) !important;
        text-transform: uppercase !important;
        white-space: nowrap !important;
        overflow: hidden !important;
      }

      #badge.rt78-cyber-red-elite .name-text {
        position: absolute !important;
        left: 212px !important;
        right: 116px !important;
        top: 77px !important;
        font-size: 10.5px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        color: #f0f1f6 !important;
        text-shadow: 0 1px 5px rgba(0,0,0,.75) !important;
        text-transform: uppercase !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        text-align: left !important;
      }

      #badge.rt78-cyber-red-elite .brand-drawer {
        left: 118px !important;
        right: 82px !important;
        bottom: 24px !important;
        height: 16px !important;
        padding: 0 8px !important;
        gap: 6px !important;
        border-top: none !important;
        background: transparent !important;
        box-shadow: none !important;
        color: rgba(255,255,255,.90) !important;
      }

      #badge.rt78-cyber-red-elite .brand-icon {
        width: 8px !important;
        height: 8px !important;
        flex: 0 0 8px !important;
        border-radius: 2px !important;
        box-shadow: 0 0 10px rgba(255,42,23,.42) !important;
      }

      #badge.rt78-cyber-red-elite .brand-marquee span {
        font-size: 9.5px !important;
        line-height: 1 !important;
        color: rgba(246,248,255,.92) !important;
        text-shadow: 0 1px 5px rgba(0,0,0,.72) !important;
      }

      #badge.rt78-cyber-red-elite::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, transparent 0%, transparent 42%, rgba(255,255,255,.10) 51%, transparent 60%, transparent 100%);
        transform: translateX(-120%);
        animation: rt78Sweep 6.4s linear infinite;
        pointer-events: none;
        mix-blend-mode: screen;
      }

      @keyframes rt78Sweep {
        0% { transform: translateX(-120%); opacity: 0; }
        10% { opacity: .45; }
        55% { transform: translateX(120%); opacity: .55; }
        100% { transform: translateX(120%); opacity: 0; }
      }
    `;
    style.textContent += `
`;
    style.textContent += `
/* RankTag BETA 0.2.1 - locked premium coordinates from Layout Editor */
#badge.rt78-cyber-red-elite .rank-mark,
#badge.rt80-cyber-red-elite .rank-mark {
  left: 7px !important;
  top: 9px !important;
  width: 136px !important;
  height: 121px !important;
  flex: 0 0 136px !important;
  z-index: 5 !important;
}

#badge.rt78-cyber-red-elite .badge-image,
#badge.rt78-cyber-red-elite .rank-icon,
#badge.rt80-cyber-red-elite .badge-image,
#badge.rt80-cyber-red-elite .rank-icon {
  width: 136px !important;
  height: 121px !important;
}

#badge.rt78-cyber-red-elite .rank-text,
#badge.rt80-cyber-red-elite .rank-text {
  left: 164px !important;
  top: 39px !important;
  width: 215px !important;
  height: 30px !important;
  font-size: 25px !important;
  line-height: 30px !important;
  z-index: 6 !important;
}

#badge.rt78-cyber-red-elite .score-text,
#badge.rt80-cyber-red-elite .score-text {
  left: 165px !important;
  top: 78px !important;
  width: 120px !important;
  height: 16px !important;
  font-size: 12px !important;
  line-height: 16px !important;
  z-index: 6 !important;
}

#badge.rt78-cyber-red-elite .name-text,
#badge.rt80-cyber-red-elite .name-text {
  left: 271px !important;
  right: 57px !important;
  top: 78px !important;
  width: 142px !important;
  height: 16px !important;
  font-size: 10.5px !important;
  line-height: 16px !important;
  z-index: 6 !important;
}

#badge.rt78-cyber-red-elite .brand-drawer,
#badge.rt80-cyber-red-elite .brand-drawer {
  left: 165px !important;
  right: 35px !important;
  bottom: 44px !important;
  width: 270px !important;
  height: 16px !important;
  z-index: 6 !important;
}

#badge.rt78-cyber-red-elite .brand-marquee span,
#badge.rt80-cyber-red-elite .brand-marquee span {
  font-size: 9.5px !important;
  line-height: 16px !important;
}
`;
    document.head.appendChild(style);
  }

  function applyPremiumBackdrop() {
    ensureStyle();
    const root = badge || document.getElementById("badge");
    if (!root) return;

    root.classList.remove("rt77-cyber-red-elite");
    root.classList.add("rt78-cyber-red-elite");
    root.dataset.themeStyle = "cyber-red-elite";
  }

  const originalSetData = setData;
  setData = async function(...args) {
    await originalSetData.apply(this, args);
    applyPremiumBackdrop();
  };

  const originalSetLoading = setLoading;
  setLoading = function(...args) {
    originalSetLoading.apply(this, args);
    setTimeout(applyPremiumBackdrop, 40);
  };

  window.addEventListener("load", () => {
    setTimeout(applyPremiumBackdrop, 80);
    setTimeout(applyPremiumBackdrop, 320);
    setTimeout(applyPremiumBackdrop, 900);
  });
})();


/* RankTag BETA 0.2.1 - Premium backdrop engine: full 470x160 background adapted to stable layout */
(function rankTagPremiumBackdropV80(){
  if (themeStyle !== "cyber-red-elite") return;

  function ensureStyle() {
    if (document.getElementById("rt80-premium-backdrop-style")) return;
    const style = document.createElement("style");
    style.id = "rt80-premium-backdrop-style";
    style.textContent = `
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: transparent;
      }

      body {
        display: grid;
        place-items: center;
      }

      #overlay.overlay {
        width: 470px !important;
        height: 160px !important;
        display: grid !important;
        place-items: center !important;
        overflow: hidden !important;
        background: transparent !important;
      }

      #badge.badge.rt80-cyber-red-elite {
        position: relative !important;
        width: 470px !important;
        min-width: 470px !important;
        max-width: 470px !important;
        height: 160px !important;
        min-height: 160px !important;
        max-height: 160px !important;
        overflow: hidden !important;
        display: block !important;
        color: var(--text-color);
        background: transparent url('/assets/premium/cyber-red-elite-bg-v96.png?v=021') center / 100% 100% no-repeat !important;
        box-shadow: none !important;
        border: none !important;
        transform: none !important;
      }

      #badge.rt80-cyber-red-elite.loading,
      #badge.rt80-cyber-red-elite.error {
        background-color: transparent !important;
      }

      #badge.rt80-cyber-red-elite .rank-mark {
        position: absolute !important;
        left: 24px !important;
        top: 38px !important;
        width: 88px !important;
        height: 88px !important;
        margin: 0 !important;
        flex: 0 0 82px !important;
        z-index: 5 !important;
        display: grid !important;
        place-items: center !important;
      }

      #badge.rt80-cyber-red-elite .badge-image {
        width: 82px !important;
        height: 82px !important;
        object-fit: contain !important;
        filter:
          drop-shadow(0 2px 10px rgba(255,255,255,.20))
          drop-shadow(0 2px 12px rgba(255,42,23,.26)) !important;
      }

      #badge.rt80-cyber-red-elite .rank-icon {
        width: 70px !important;
        height: 70px !important;
        font-size: 21px !important;
        border-radius: 16px !important;
        background: linear-gradient(145deg, #dbe2ec, #515865) !important;
        border: 1px solid rgba(255,255,255,0.24) !important;
        box-shadow: 0 0 8px rgba(255,255,255,.12), 0 0 12px rgba(255,42,23,.14) !important;
      }

      #badge.rt80-cyber-red-elite .card-shell {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        overflow: visible !important;
      }

      #badge.rt80-cyber-red-elite .card-shell::before,
      #badge.rt80-cyber-red-elite .card-top-gloss,
      #badge.rt80-cyber-red-elite .card-bottom-line,
      #badge.rt80-cyber-red-elite .card-side-glow {
        display: none !important;
      }

      #badge.rt80-cyber-red-elite .rank-info {
        position: absolute !important;
        inset: 0 !important;
        padding: 0 !important;
        transform: none !important;
        opacity: 1 !important;
        display: block !important;
      }

      #badge.rt80-cyber-red-elite .title-row,
      #badge.rt80-cyber-red-elite .meta-row {
        display: block !important;
        min-width: 0 !important;
        gap: 0 !important;
        margin: 0 !important;
        white-space: normal !important;
        overflow: visible !important;
      }

      #badge.rt80-cyber-red-elite .rank-text {
        position: absolute !important;
        left: 126px !important;
        top: 42px !important;
        width: 215px !important;
        font-size: 25px !important;
        line-height: 1 !important;
        font-weight: 1000 !important;
        letter-spacing: .7px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        color: #4feaff !important;
        text-shadow:
          0 0 14px rgba(79,234,255,.23),
          0 2px 8px rgba(0,0,0,.78) !important;
        text-transform: uppercase !important;
      }

      #badge.rt80-cyber-red-elite .status {
        position: absolute !important;
        right: 62px !important;
        top: 24px !important;
        min-width: 56px !important;
        padding: 3px 8px !important;
        font-size: 9px !important;
        line-height: 1 !important;
        border-radius: 999px !important;
        background: rgba(255, 42, 23, 0.20) !important;
        border: 1px solid rgba(255, 112, 72, 0.26) !important;
        color: #ffd7cf !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
      }

      #badge.rt80-cyber-red-elite .score-text {
        position: absolute !important;
        left: 126px !important;
        top: 79px !important;
        width: 120px !important;
        font-size: 12px !important;
        line-height: 1 !important;
        font-weight: 1000 !important;
        color: #fff3ea !important;
        text-shadow: 0 1px 6px rgba(0,0,0,.78) !important;
        text-transform: uppercase !important;
        white-space: nowrap !important;
        overflow: hidden !important;
      }

      #badge.rt80-cyber-red-elite .name-text {
        position: absolute !important;
        left: 252px !important;
        right: 76px !important;
        top: 79px !important;
        font-size: 10.5px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        color: #f0f1f6 !important;
        text-shadow: 0 1px 6px rgba(0,0,0,.78) !important;
        text-transform: uppercase !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        text-align: left !important;
      }

      #badge.rt80-cyber-red-elite .brand-drawer {
        left: 126px !important;
        right: 72px !important;
        bottom: 26px !important;
        height: 18px !important;
        padding: 0 8px !important;
        gap: 6px !important;
        border-top: none !important;
        background: transparent !important;
        box-shadow: none !important;
        color: rgba(255,255,255,.92) !important;
      }

      #badge.rt80-cyber-red-elite .brand-icon {
        width: 8px !important;
        height: 8px !important;
        flex: 0 0 8px !important;
        border-radius: 2px !important;
        box-shadow: 0 0 10px rgba(255,42,23,.45) !important;
      }

      #badge.rt80-cyber-red-elite .brand-marquee {
        mask-image: linear-gradient(90deg, transparent, black 7%, black 93%, transparent) !important;
      }

      #badge.rt80-cyber-red-elite .brand-marquee span {
        font-size: 9.5px !important;
        line-height: 1 !important;
        color: rgba(246,248,255,.93) !important;
        text-shadow: 0 1px 6px rgba(0,0,0,.78) !important;
      }

      #badge.rt80-cyber-red-elite::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, transparent 0%, transparent 43%, rgba(255,255,255,.11) 51%, transparent 60%, transparent 100%);
        transform: translateX(-120%);
        animation: rt80Sweep 6.6s linear infinite;
        pointer-events: none;
        mix-blend-mode: screen;
      }

      @keyframes rt80Sweep {
        0% { transform: translateX(-120%); opacity: 0; }
        10% { opacity: .38; }
        55% { transform: translateX(120%); opacity: .48; }
        100% { transform: translateX(120%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  function applyPremiumBackdrop() {
    ensureStyle();
    const root = badge || document.getElementById("badge");
    if (!root) return;

    root.classList.remove("rt77-cyber-red-elite", "rt78-cyber-red-elite");
    root.classList.add("rt80-cyber-red-elite");
    root.dataset.themeStyle = "cyber-red-elite";
  }

  const originalSetData = setData;
  setData = async function(...args) {
    await originalSetData.apply(this, args);
    applyPremiumBackdrop();
  };

  const originalSetLoading = setLoading;
  setLoading = function(...args) {
    originalSetLoading.apply(this, args);
    setTimeout(applyPremiumBackdrop, 40);
  };

  window.addEventListener("load", () => {
    setTimeout(applyPremiumBackdrop, 80);
    setTimeout(applyPremiumBackdrop, 320);
    setTimeout(applyPremiumBackdrop, 900);
  });
})();



/* RankTag BETA 0.2.1 - runtime premium layout from URL param */
(function rankTagPremiumRuntimeLayoutV89(){
  if (typeof themeStyle === "undefined" || !["cyber-red-elite","voidrage-inferno"].includes(themeStyle)) return;

  function decodeLayoutParam() {
    const raw = new URLSearchParams(window.location.search).get("layout");
    if (!raw) return null;
    try {
      const json = decodeURIComponent(escape(atob(raw)));
      const parsed = JSON.parse(json);
      if (!parsed || !parsed.elements) return null;
      return parsed;
    } catch (err) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.elements) return null;
        return parsed;
      } catch (err2) {
        return null;
      }
    }
  }

  function cssFromLayout(layout) {
    const e = layout.elements || {};
    const badge = e.badge || {};
    const rank = e.rank || {};
    const score = e.score || {};
    const player = e.player || {};
    const brand = e.brand || {};
    const canvasW = Number(layout.canvas?.width || 470);
    const canvasH = Number(layout.canvas?.height || 160);

    const px = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
    const right = (cfg) => canvasW - px(cfg.x) - px(cfg.w);
    const bottom = (cfg) => canvasH - px(cfg.y) - px(cfg.h);

    return `
      /* runtime JSON layout override */
      #badge.rt78-cyber-red-elite .rank-mark,
      #badge.rt80-cyber-red-elite .rank-mark {
        left: ${px(badge.x)}px !important;
        top: ${px(badge.y)}px !important;
        width: ${px(badge.w, 80)}px !important;
        height: ${px(badge.h, 80)}px !important;
        flex: 0 0 ${px(badge.w, 80)}px !important;
        z-index: ${px(badge.z, 5)} !important;
      }

      #badge.rt78-cyber-red-elite .badge-image,
      #badge.rt78-cyber-red-elite .rank-icon,
      #badge.rt80-cyber-red-elite .badge-image,
      #badge.rt80-cyber-red-elite .rank-icon {
        width: ${px(badge.w, 80)}px !important;
        height: ${px(badge.h, 80)}px !important;
      }

      #badge.rt78-cyber-red-elite .rank-text,
      #badge.rt80-cyber-red-elite .rank-text {
        left: ${px(rank.x)}px !important;
        top: ${px(rank.y)}px !important;
        width: ${px(rank.w, 180)}px !important;
        height: ${px(rank.h, 30)}px !important;
        font-size: ${px(rank.fontSize, 25)}px !important;
        line-height: ${px(rank.h, 30)}px !important;
        z-index: ${px(rank.z, 6)} !important;
      }

      #badge.rt78-cyber-red-elite .score-text,
      #badge.rt80-cyber-red-elite .score-text {
        left: ${px(score.x)}px !important;
        top: ${px(score.y)}px !important;
        width: ${px(score.w, 120)}px !important;
        height: ${px(score.h, 16)}px !important;
        font-size: ${px(score.fontSize, 12)}px !important;
        line-height: ${px(score.h, 16)}px !important;
        z-index: ${px(score.z, 6)} !important;
      }

      #badge.rt78-cyber-red-elite .name-text,
      #badge.rt80-cyber-red-elite .name-text {
        left: ${px(player.x)}px !important;
        right: ${right(player)}px !important;
        top: ${px(player.y)}px !important;
        width: ${px(player.w, 140)}px !important;
        height: ${px(player.h, 16)}px !important;
        font-size: ${px(player.fontSize, 10.5)}px !important;
        line-height: ${px(player.h, 16)}px !important;
        z-index: ${px(player.z, 6)} !important;
      }

      #badge.rt78-cyber-red-elite .brand-drawer,
      #badge.rt80-cyber-red-elite .brand-drawer {
        left: ${px(brand.x)}px !important;
        right: ${right(brand)}px !important;
        bottom: ${bottom(brand)}px !important;
        width: ${px(brand.w, 270)}px !important;
        height: ${px(brand.h, 16)}px !important;
        z-index: ${px(brand.z, 6)} !important;
      }

      #badge.rt78-cyber-red-elite .brand-marquee span,
      #badge.rt80-cyber-red-elite .brand-marquee span {
        font-size: ${px(brand.fontSize, 9.5)}px !important;
        line-height: ${px(brand.h, 16)}px !important;
      }
    `;
  }

  function applyRuntimeLayout() {
    const layout = decodeLayoutParam();
    if (!layout) return;
    let style = document.getElementById("rt89-runtime-layout-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "rt89-runtime-layout-style";
      document.head.appendChild(style);
    }
    style.textContent = cssFromLayout(layout);
    document.documentElement.dataset.runtimePremiumLayout = "1";
  }

  window.addEventListener("load", () => {
    setTimeout(applyRuntimeLayout, 60);
    setTimeout(applyRuntimeLayout, 250);
    setTimeout(applyRuntimeLayout, 900);
  });
  setTimeout(applyRuntimeLayout, 40);
  setTimeout(applyRuntimeLayout, 400);
})();



/* RankTag BETA 0.2.1 - AUTHORITATIVE premium layout sync */
(function rankTagPremiumLayoutAuthoritativeV90(){
  if (typeof themeStyle === "undefined" || themeStyle !== "cyber-red-elite") return;

  function safeNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function decodeLayoutParam() {
    const raw = new URLSearchParams(window.location.search).get("layout");
    if (!raw) return null;

    try {
      const json = decodeURIComponent(escape(atob(raw)));
      const parsed = JSON.parse(json);
      if (parsed && parsed.elements) return parsed;
    } catch {}

    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.elements) return parsed;
    } catch {}

    return null;
  }

  function normalizeLayout(layout) {
    const base = (typeof CYBER_RED_ELITE_LAYOUT_LOCKED !== "undefined" && CYBER_RED_ELITE_LAYOUT_LOCKED) ? CYBER_RED_ELITE_LAYOUT_LOCKED : {};
    const src = layout && layout.elements ? layout : base;
    const elements = src.elements || {};

    const def = {
      badge:  { x: 7, y: 9, w: 136, h: 121, fontSize: 0, z: 5 },
      rank:   { x: 164, y: 39, w: 215, h: 30, fontSize: 25, z: 6 },
      score:  { x: 165, y: 78, w: 120, h: 16, fontSize: 12, z: 6 },
      player: { x: 271, y: 78, w: 142, h: 16, fontSize: 10.5, z: 6 },
      brand:  { x: 165, y: 100, w: 270, h: 16, fontSize: 9.5, z: 6 }
    };

    const out = {};
    for (const key of Object.keys(def)) {
      const e = elements[key] || {};
      out[key] = {
        x: safeNumber(e.x, def[key].x),
        y: safeNumber(e.y, def[key].y),
        w: safeNumber(e.w, def[key].w),
        h: safeNumber(e.h, def[key].h),
        fontSize: safeNumber(e.fontSize, def[key].fontSize),
        z: safeNumber(e.z, def[key].z)
      };
    }

    return {
      version: src.version || 1,
      style: src.style || "cyber-red-elite",
      canvas: {
        width: safeNumber(src.canvas?.width, 470),
        height: safeNumber(src.canvas?.height, 160)
      },
      background: src.background || "/assets/premium/cyber-red-elite-bg-v96.png",
      elements: out
    };
  }

  function cssFromLayout(layout) {
    const l = normalizeLayout(layout);
    const e = l.elements;
    const cw = l.canvas.width;
    const ch = l.canvas.height;

    const right = (cfg) => cw - cfg.x - cfg.w;
    const bottom = (cfg) => ch - cfg.y - cfg.h;

    return `
      #badge.rt78-cyber-red-elite,
      #badge.rt80-cyber-red-elite {
        width: ${cw}px !important;
        min-width: ${cw}px !important;
        max-width: ${cw}px !important;
        height: ${ch}px !important;
        min-height: ${ch}px !important;
        max-height: ${ch}px !important;
      }

      #badge.rt78-cyber-red-elite .rank-mark,
      #badge.rt80-cyber-red-elite .rank-mark {
        position: absolute !important;
        left: ${e.badge.x}px !important;
        top: ${e.badge.y}px !important;
        width: ${e.badge.w}px !important;
        height: ${e.badge.h}px !important;
        min-width: ${e.badge.w}px !important;
        min-height: ${e.badge.h}px !important;
        max-width: ${e.badge.w}px !important;
        max-height: ${e.badge.h}px !important;
        flex: 0 0 ${e.badge.w}px !important;
        z-index: ${e.badge.z} !important;
      }

      #badge.rt78-cyber-red-elite .badge-image,
      #badge.rt78-cyber-red-elite .rank-icon,
      #badge.rt80-cyber-red-elite .badge-image,
      #badge.rt80-cyber-red-elite .rank-icon {
        width: ${e.badge.w}px !important;
        height: ${e.badge.h}px !important;
        min-width: ${e.badge.w}px !important;
        min-height: ${e.badge.h}px !important;
        max-width: ${e.badge.w}px !important;
        max-height: ${e.badge.h}px !important;
      }

      #badge.rt78-cyber-red-elite .rank-text,
      #badge.rt80-cyber-red-elite .rank-text {
        position: absolute !important;
        left: ${e.rank.x}px !important;
        right: auto !important;
        top: ${e.rank.y}px !important;
        width: ${e.rank.w}px !important;
        height: ${e.rank.h}px !important;
        font-size: ${e.rank.fontSize}px !important;
        line-height: ${e.rank.h}px !important;
        z-index: ${e.rank.z} !important;
      }

      #badge.rt78-cyber-red-elite .score-text,
      #badge.rt80-cyber-red-elite .score-text {
        position: absolute !important;
        left: ${e.score.x}px !important;
        right: auto !important;
        top: ${e.score.y}px !important;
        width: ${e.score.w}px !important;
        height: ${e.score.h}px !important;
        font-size: ${e.score.fontSize}px !important;
        line-height: ${e.score.h}px !important;
        z-index: ${e.score.z} !important;
      }

      #badge.rt78-cyber-red-elite .name-text,
      #badge.rt80-cyber-red-elite .name-text {
        position: absolute !important;
        left: ${e.player.x}px !important;
        right: ${right(e.player)}px !important;
        top: ${e.player.y}px !important;
        width: ${e.player.w}px !important;
        height: ${e.player.h}px !important;
        font-size: ${e.player.fontSize}px !important;
        line-height: ${e.player.h}px !important;
        z-index: ${e.player.z} !important;
      }

      #badge.rt78-cyber-red-elite .brand-drawer,
      #badge.rt80-cyber-red-elite .brand-drawer {
        position: absolute !important;
        left: ${e.brand.x}px !important;
        right: ${right(e.brand)}px !important;
        bottom: ${bottom(e.brand)}px !important;
        width: ${e.brand.w}px !important;
        height: ${e.brand.h}px !important;
        font-size: ${e.brand.fontSize}px !important;
        line-height: ${e.brand.h}px !important;
        z-index: ${e.brand.z} !important;
      }

      #badge.rt78-cyber-red-elite .brand-marquee span,
      #badge.rt80-cyber-red-elite .brand-marquee span {
        font-size: ${e.brand.fontSize}px !important;
        line-height: ${e.brand.h}px !important;
      }
    `;
  }

  function applyLayout() {
    const runtimeLayout = decodeLayoutParam();
    const layout = normalizeLayout(runtimeLayout);
    let style = document.getElementById("rt90-authoritative-premium-layout");
    if (!style) {
      style = document.createElement("style");
      style.id = "rt90-authoritative-premium-layout";
      document.head.appendChild(style);
    }
    style.textContent = cssFromLayout(layout);
    document.documentElement.dataset.premiumLayoutApplied = runtimeLayout ? "url" : "locked";
  }

  const oldSetData = typeof setData === "function" ? setData : null;
  if (oldSetData && !window.__rt90SetDataPatched) {
    window.__rt90SetDataPatched = true;
    setData = async function(...args) {
      await oldSetData.apply(this, args);
      applyLayout();
      setTimeout(applyLayout, 80);
      setTimeout(applyLayout, 300);
    };
  }

  window.addEventListener("load", () => {
    applyLayout();
    setTimeout(applyLayout, 80);
    setTimeout(applyLayout, 300);
    setTimeout(applyLayout, 900);
    setTimeout(applyLayout, 1600);
  });

  applyLayout();
  setTimeout(applyLayout, 120);
  setTimeout(applyLayout, 600);
})();



/* RankTag BETA 0.2.1 - DETACHED PREMIUM RENDERER
   Premium Cyber Red Elite no longer uses the standard card layout.
   It renders the exact same JSON layer model used by layout-editor.html. */
(function rankTagDetachedPremiumRendererV92(){
  if (typeof themeStyle === "undefined" || themeStyle !== "cyber-red-elite") return;

  const DEFAULT_LAYOUT = (typeof CYBER_RED_ELITE_LAYOUT_LOCKED !== "undefined" && CYBER_RED_ELITE_LAYOUT_LOCKED)
    ? CYBER_RED_ELITE_LAYOUT_LOCKED
    : {
      version: 1,
      schema: "ranktag-premium-layout-v2",
      style: "cyber-red-elite",
      canvas: { width: 470, height: 160 },
      background: "/assets/premium/cyber-red-elite-bg-v96.png",
      elements: {
        badge:  { x: 7, y: 9, w: 136, h: 121, fontSize: 0, z: 5 },
        rank:   { x: 164, y: 39, w: 215, h: 30, fontSize: 25, z: 6 },
        score:  { x: 165, y: 78, w: 120, h: 16, fontSize: 12, z: 6 },
        player: { x: 271, y: 78, w: 142, h: 16, fontSize: 10.5, z: 6 },
        brand:  { x: 165, y: 100, w: 270, h: 16, fontSize: 9.5, z: 6 }
      }
    };

  function safeNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function decodeLayoutParam() {
    const raw = new URLSearchParams(window.location.search).get("layout");
    if (!raw) return null;
    try {
      const json = decodeURIComponent(escape(atob(raw)));
      const parsed = JSON.parse(json);
      if (parsed && parsed.elements) return parsed;
    } catch {}
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.elements) return parsed;
    } catch {}
    return null;
  }

  function normalizeLayout(layout) {
    const src = layout && layout.elements ? layout : DEFAULT_LAYOUT;
    const def = DEFAULT_LAYOUT.elements || {};
    const elements = src.elements || {};
    const out = {};

    ["badge","rank","score","player","brand"].forEach((key) => {
      const d = def[key] || {};
      const v = elements[key] || {};
      out[key] = {
        x: safeNumber(v.x, d.x || 0),
        y: safeNumber(v.y, d.y || 0),
        w: safeNumber(v.w, d.w || 10),
        h: safeNumber(v.h, d.h || 10),
        fontSize: safeNumber(v.fontSize, d.fontSize || 0),
        z: safeNumber(v.z, d.z || 1)
      };
    });

    return {
      version: src.version || 1,
      schema: src.schema || "ranktag-premium-layout-v2",
      style: "cyber-red-elite",
      canvas: {
        width: safeNumber(src.canvas?.width, 470),
        height: safeNumber(src.canvas?.height, 160)
      },
      background: src.background || "/assets/premium/cyber-red-elite-bg-v96.png",
      elements: out
    };
  }

  function esc(text) {
    return String(text ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function getCurrentData() {
    const rankValue = (rankText?.textContent || "PLATINUM 1").trim();
    const scoreValue = (scoreText?.textContent || "ELO: 37.705").trim();
    const playerValue = (nameText?.textContent || getPlayerFromUrl?.() || "NOMEPLAYER#1234").trim();
    const brandValue = (brandMarqueeText?.textContent || "ERDRAGON32 • Join the Discord").trim();
    const badgeSrc = badgeImage?.getAttribute("src") || rankIcon?.querySelector("img")?.getAttribute("src") || "/assets/badges/platinum.svg?v=021";
    return { rankValue, scoreValue, playerValue, brandValue, badgeSrc };
  }

  function ensureStyle() {
    if (document.getElementById("rt92-detached-premium-style")) return;
    const style = document.createElement("style");
    style.id = "rt92-detached-premium-style";
    style.textContent = `
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: transparent !important;
      }

      body {
        display: grid !important;
        place-items: center !important;
      }

      #overlay.overlay {
        width: 470px !important;
        height: 160px !important;
        display: grid !important;
        place-items: center !important;
        overflow: hidden !important;
        background: transparent !important;
      }

      #badge.badge.rt92-premium-detached {
        position: relative !important;
        width: 470px !important;
        height: 160px !important;
        min-width: 470px !important;
        min-height: 160px !important;
        max-width: 470px !important;
        max-height: 160px !important;
        overflow: hidden !important;
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
        border: 0 !important;
        box-shadow: none !important;
        background: transparent !important;
        transform: none !important;
      }

      .rt92-layer-bg {
        position: absolute;
        inset: 0;
        width: 470px;
        height: 160px;
        object-fit: fill;
        z-index: 0;
        pointer-events: none;
      }

      .rt92-layer {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        overflow: hidden;
        white-space: nowrap;
        box-sizing: border-box;
      }

      .rt92-badge {
        align-items: center;
        justify-content: center;
        overflow: visible;
      }

      .rt92-badge img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter:
          drop-shadow(0 2px 10px rgba(255,255,255,.30))
          drop-shadow(0 2px 12px rgba(138,43,226,.42));
      }

      .rt92-rank {
        color: #54eaff;
        font-weight: 1000;
        letter-spacing: .7px;
        text-transform: uppercase;
        text-shadow: 0 0 12px rgba(84,234,255,.34), 0 2px 8px rgba(0,0,0,.9);
      }

      .rt92-score {
        color: #f7f2ff;
        font-weight: 1000;
        text-transform: uppercase;
        text-shadow: 0 1px 7px rgba(0,0,0,.95);
      }

      .rt92-player {
        color: #f7f2ff;
        font-weight: 1000;
        text-transform: uppercase;
        text-overflow: ellipsis;
        text-shadow: 0 1px 7px rgba(0,0,0,.95);
      }

      .rt92-brand-drawer {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 0 8px;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(12,10,26,.88), rgba(5,4,16,.78));
        border: 1px solid rgba(255,255,255,.14);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 6px 18px rgba(0,0,0,.28);
        transform: translateY(105%);
        opacity: 0;
        transition: transform 360ms cubic-bezier(.2,.9,.2,1), opacity 260ms ease;
        pointer-events: none;
        overflow: hidden;
      }

      .rt92-brand-drawer.is-visible {
        transform: translateY(0);
        opacity: 1;
      }

      .rt92-brand-drawer.is-empty {
        display: none;
      }

      .rt92-brand-icon {
        width: 11px;
        height: 11px;
        border-radius: 3px;
        background: linear-gradient(135deg, var(--brand-accent, #ff2a17), #ffd36a);
        box-shadow: 0 0 12px rgba(255,42,23,0.46);
        transform: rotate(45deg);
        flex: 0 0 11px;
      }

      .rt92-brand-marquee {
        position: relative;
        min-width: 0;
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        mask-image: linear-gradient(90deg, transparent, black 9%, black 91%, transparent);
      }

      .rt92-brand-marquee span {
        display: inline-block;
        min-width: max-content;
        padding-left: 100%;
        font-weight: 1000;
        letter-spacing: .4px;
        color: #f7f2ff;
        text-shadow: 0 0 8px rgba(168,85,247,.32), 0 1px 7px rgba(0,0,0,.95);
        text-transform: none !important;
        animation: rt92Marquee var(--brand-duration, 8s) linear infinite;
        animation-play-state: paused;
      }

      .rt92-brand-drawer.is-visible .rt92-brand-marquee span {
        animation-play-state: running;
      }

      @keyframes rt92Marquee {
        from { transform: translateX(0); }
        to { transform: translateX(-100%); }
      }
    `;
    document.head.appendChild(style);
  }

  function layerStyle(cfg) {
    return [
      `left:${cfg.x}px`,
      `top:${cfg.y}px`,
      `width:${cfg.w}px`,
      `height:${cfg.h}px`,
      `z-index:${cfg.z}`,
      cfg.fontSize ? `font-size:${cfg.fontSize}px` : "",
      `line-height:${cfg.h}px`
    ].filter(Boolean).join(";");
  }

  let premiumBrandTimersStarted = false;
  let premiumBrandHideTimer = null;

  function getPremiumBrandDrawer() {
    return badge?.querySelector('.rt92-brand-drawer') || document.querySelector('#badge .rt92-brand-drawer');
  }

  function showPremiumBrandDrawer(config) {
    const drawer = getPremiumBrandDrawer();
    if (!drawer) return;
    drawer.classList.add('is-visible');
    if (premiumBrandHideTimer) clearTimeout(premiumBrandHideTimer);
    const visibleSeconds = Math.max(2, Math.min(12, Number(config?.visibleSeconds || 4.5)));
    premiumBrandHideTimer = setTimeout(() => {
      drawer.classList.remove('is-visible');
    }, visibleSeconds * 1000);
  }

  async function startPremiumBrandCycle() {
    const drawer = getPremiumBrandDrawer();
    if (!drawer) return;
    const span = drawer.querySelector('.rt92-brand-marquee span');
    let config = null;
    try {
      if (typeof loadLockedBranding === 'function') {
        config = await loadLockedBranding();
      }
    } catch {}
    config = config || {
      brandText: 'ERDRAGON32',
      callToAction: 'Join the Discord',
      discordText: '',
      mode: 'marquee',
      separator: ' • ',
      scrollSeconds: 8,
      intervalSeconds: 12,
      visibleSeconds: 4.5,
      showOnLoad: true
    };

    let text = '';
    try {
      text = typeof buildBrandText === 'function' ? buildBrandText(config) : '';
    } catch {}
    if (!text) text = span?.textContent?.trim() || 'ERDRAGON32 • Join the Discord';
    if (span) span.textContent = text;

    if (!text) {
      drawer.classList.add('is-empty');
      return;
    }
    drawer.classList.remove('is-empty');
    document.documentElement.style.setProperty('--brand-duration', `${Math.max(4, Math.min(30, Number(config.scrollSeconds || 8)))}s`);

    if (premiumBrandTimersStarted) return;
    premiumBrandTimersStarted = true;
    const intervalSeconds = Math.max(6, Math.min(45, Number(config.intervalSeconds || 12)));
    if (config.showOnLoad !== false) setTimeout(() => showPremiumBrandDrawer(config), 800);
    setInterval(() => showPremiumBrandDrawer(config), intervalSeconds * 1000);
  }

  function renderDetached() {
    ensureStyle();

    const root = badge || document.getElementById("badge");
    if (!root) return;

    const layout = normalizeLayout(decodeLayoutParam());
    const e = layout.elements;
    const d = getCurrentData();

    root.className = "badge rt92-premium-detached";
    root.dataset.themeStyle = "cyber-red-elite";
    root.dataset.renderer = "premium-detached-v93";

    root.innerHTML = `
      <img class="rt92-layer-bg" src="${esc(layout.background)}?v=021" alt="" />
      <div class="rt92-layer rt92-badge" style="${layerStyle(e.badge)}">
        <img src="${esc(d.badgeSrc)}" alt="" />
      </div>
      <div class="rt92-layer rt92-rank" style="${layerStyle(e.rank)}">${esc(d.rankValue)}</div>
      <div class="rt92-layer rt92-score" style="${layerStyle(e.score)}">${esc(d.scoreValue)}</div>
      <div class="rt92-layer rt92-player" style="${layerStyle(e.player)}">${esc(d.playerValue)}</div>
      <div class="rt92-layer rt92-brand-drawer" style="${layerStyle(e.brand)}">
        <div class="rt92-brand-icon"></div>
        <div class="rt92-brand-marquee"><span>${esc(d.brandValue)}</span></div>
      </div>
    `;

    document.documentElement.dataset.premiumRenderer = "detached-v93";
    document.documentElement.dataset.premiumLayoutApplied = new URLSearchParams(window.location.search).get("layout") ? "url" : "locked";
    startPremiumBrandCycle();
  }

  const oldSetData = typeof setData === "function" ? setData : null;
  if (oldSetData && !window.__rt92DetachedSetDataPatched) {
    window.__rt92DetachedSetDataPatched = true;
    setData = async function(...args) {
      await oldSetData.apply(this, args);
      renderDetached();
      setTimeout(renderDetached, 80);
      setTimeout(renderDetached, 250);
    };
  }

  const oldSetLoading = typeof setLoading === "function" ? setLoading : null;
  if (oldSetLoading && !window.__rt92DetachedSetLoadingPatched) {
    window.__rt92DetachedSetLoadingPatched = true;
    setLoading = function(...args) {
      oldSetLoading.apply(this, args);
      setTimeout(renderDetached, 80);
    };
  }

  window.addEventListener("load", () => {
    renderDetached();
    setTimeout(renderDetached, 100);
    setTimeout(renderDetached, 400);
    setTimeout(renderDetached, 1000);
  });

  renderDetached();
})();



/* RankTag BETA 0.2.1 - MULTI PREMIUM DETACHED RENDERER */
(function rankTagMultiPremiumDetachedRendererV97(){
  if (typeof themeStyle === "undefined" || !["cyber-red-elite","voidrage-inferno"].includes(themeStyle)) return;

  const PREMIUM_LAYOUTS = {
    "cyber-red-elite": (typeof CYBER_RED_ELITE_LAYOUT_LOCKED !== "undefined" ? CYBER_RED_ELITE_LAYOUT_LOCKED : null),
    "voidrage-inferno": (typeof VOIDRAGE_INFERNO_LAYOUT_LOCKED !== "undefined" ? VOIDRAGE_INFERNO_LAYOUT_LOCKED : {"version": "0.2.1", "schema": "ranktag-premium-layout-v2", "style": "voidrage-inferno", "note": "Secondo overlay premium separato. Posizioni gestibili via Layout Editor.", "canvas": {"width": 470, "height": 160}, "background": "/assets/premium/voidrage-inferno-fit-v113.png", "elements": {"badge": {"x": 12, "y": 20, "w": 118, "h": 110, "fontSize": 0, "z": 5}, "rank": {"x": 150, "y": 42, "w": 230, "h": 30, "fontSize": 25, "z": 6}, "score": {"x": 152, "y": 78, "w": 120, "h": 16, "fontSize": 12, "z": 6}, "player": {"x": 265, "y": 78, "w": 150, "h": 16, "fontSize": 10.5, "z": 6}, "brand": {"x": 152, "y": 108, "w": 260, "h": 18, "fontSize": 9.5, "z": 6}}})
  };

  function safeNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function decodeLayoutParam() {
    const raw = new URLSearchParams(window.location.search).get("layout");
    if (!raw) return null;
    try {
      const json = decodeURIComponent(escape(atob(raw)));
      const parsed = JSON.parse(json);
      if (parsed && parsed.elements && (!parsed.style || parsed.style === themeStyle)) return parsed;
    } catch {}
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.elements && (!parsed.style || parsed.style === themeStyle)) return parsed;
    } catch {}
    return null;
  }

  function normalizeLayout(layout) {
    const base = PREMIUM_LAYOUTS[themeStyle] || PREMIUM_LAYOUTS["voidrage-inferno"];
    const src = layout && layout.elements ? layout : base;
    const def = base.elements || {};
    const elements = src.elements || {};
    const out = {};

    ["badge","rank","score","player","brand"].forEach((key) => {
      const d = def[key] || {};
      const v = elements[key] || {};
      out[key] = {
        x: safeNumber(v.x, d.x || 0),
        y: safeNumber(v.y, d.y || 0),
        w: safeNumber(v.w, d.w || 10),
        h: safeNumber(v.h, d.h || 10),
        fontSize: safeNumber(v.fontSize, d.fontSize || 0),
        z: safeNumber(v.z, d.z || 1)
      };
    });

    return {
      version: src.version || 1,
      schema: src.schema || "ranktag-premium-layout-v2",
      style: themeStyle,
      canvas: {
        width: safeNumber(src.canvas?.width, 470),
        height: safeNumber(src.canvas?.height, 160)
      },
      background: src.background || base.background,
      elements: out
    };
  }

  function esc(text) {
    return String(text ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function getCurrentData() {
    const rankValue = (rankText?.textContent || "PLATINUM 1").trim();
    const scoreValue = (scoreText?.textContent || "ELO: 37.705").trim();
    const playerValue = (nameText?.textContent || (typeof getPlayerFromUrl === "function" ? getPlayerFromUrl() : "NOMEPLAYER#1234")).trim();
    const brandValue = (brandMarqueeText?.textContent || "ERDRAGON32 • Join the Discord").trim();
    const badgeSrc = badgeImage?.getAttribute("src") || "/assets/badges/platinum.svg?v=021";
    return { rankValue, scoreValue, playerValue, brandValue, badgeSrc };
  }

  function ensureStyle() {
    if (document.getElementById("rt97-multi-premium-style")) return;
    const style = document.createElement("style");
    style.id = "rt97-multi-premium-style";
    style.textContent = `
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: transparent !important;
      }
      body {
        display: grid !important;
        place-items: center !important;
      }
      #overlay.overlay {
        width: 470px !important;
        height: 160px !important;
        display: grid !important;
        place-items: center !important;
        overflow: hidden !important;
        background: transparent !important;
      }
      #badge.badge.rt97-premium-detached {
        position: relative !important;
        width: 470px !important;
        height: 160px !important;
        min-width: 470px !important;
        min-height: 160px !important;
        max-width: 470px !important;
        max-height: 160px !important;
        overflow: hidden !important;
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
        border: 0 !important;
        box-shadow: none !important;
        background: transparent !important;
        transform: none !important;
      }
      .rt97-layer-bg {
        position: absolute;
        inset: 0;
        width: 470px;
        height: 160px;
        object-fit: fill;
        z-index: 0;
        pointer-events: none;
      }
      .rt97-layer {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        overflow: hidden;
        white-space: nowrap;
        box-sizing: border-box;
      }
      .rt97-badge {
        align-items: center;
        justify-content: center;
        overflow: visible;
      }
      .rt97-badge img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 2px 10px rgba(255,255,255,.30)) drop-shadow(0 2px 12px rgba(255,20,20,.48));
      }
      .rt97-rank {
        color: var(--premium-rank-color, #54eaff);
        font-weight: 1000;
        letter-spacing: .7px;
        text-transform: uppercase;
        text-shadow: 0 0 12px rgba(84,234,255,.34), 0 2px 8px rgba(0,0,0,.9);
      }
      .theme-voidrage-inferno .rt97-rank {
        color: #fff6f2;
        text-shadow: 0 0 12px rgba(255,42,23,.55), 0 2px 8px rgba(0,0,0,.95);
      }
      .rt97-score, .rt97-player {
        color: #f7f2ff;
        font-weight: 1000;
        text-transform: uppercase;
        text-overflow: ellipsis;
        text-shadow: 0 1px 7px rgba(0,0,0,.95);
      }
      .rt97-brand-drawer {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 0 8px;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(12,10,16,.88), rgba(5,4,10,.78));
        border: 1px solid rgba(255,255,255,.14);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 6px 18px rgba(0,0,0,.28);
        transform: translateY(105%);
        opacity: 0;
        transition: transform 360ms cubic-bezier(.2,.9,.2,1), opacity 260ms ease;
        pointer-events: none;
        overflow: hidden;
      }
      .rt97-brand-drawer.is-visible {
        transform: translateY(0);
        opacity: 1;
      }
      .rt97-brand-icon {
        width: 11px;
        height: 11px;
        border-radius: 3px;
        background: linear-gradient(135deg, var(--brand-accent, #ff2a17), #ffd36a);
        box-shadow: 0 0 12px rgba(255,42,23,0.46);
        transform: rotate(45deg);
        flex: 0 0 11px;
      }
      .rt97-brand-marquee {
        position: relative;
        min-width: 0;
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        mask-image: linear-gradient(90deg, transparent, black 9%, black 91%, transparent);
      }
      .rt97-brand-marquee span {
        display: inline-block;
        min-width: max-content;
        padding-left: 100%;
        font-weight: 1000;
        letter-spacing: .4px;
        color: #f7f2ff;
        text-shadow: 0 0 8px rgba(255,42,23,.38), 0 1px 7px rgba(0,0,0,.95);
        text-transform: none !important;
        animation: rt97Marquee var(--brand-duration, 8s) linear infinite;
        animation-play-state: paused;
      }
      .rt97-brand-drawer.is-visible .rt97-brand-marquee span {
        animation-play-state: running;
      }
      @keyframes rt97Marquee {
        from { transform: translateX(0); }
        to { transform: translateX(-100%); }
      }
    `;
    document.head.appendChild(style);
  }

  let premiumBrandTimersStarted = false;
  let premiumBrandHideTimer = null;

  function getPremiumBrandDrawer() {
    return badge?.querySelector('.rt97-brand-drawer') || document.querySelector('#badge .rt97-brand-drawer');
  }

  function showPremiumBrandDrawer(config) {
    const drawer = getPremiumBrandDrawer();
    if (!drawer) return;
    drawer.classList.add('is-visible');
    if (premiumBrandHideTimer) clearTimeout(premiumBrandHideTimer);
    const visibleSeconds = Math.max(2, Math.min(12, Number(config?.visibleSeconds || 4.5)));
    premiumBrandHideTimer = setTimeout(() => drawer.classList.remove('is-visible'), visibleSeconds * 1000);
  }

  async function startPremiumBrandCycle() {
    const drawer = getPremiumBrandDrawer();
    if (!drawer) return;
    const span = drawer.querySelector('.rt97-brand-marquee span');
    let config = null;
    try {
      if (typeof loadLockedBranding === 'function') config = await loadLockedBranding();
    } catch {}
    config = config || { brandText: 'ERDRAGON32', callToAction: 'Join the Discord', discordText: '', separator: ' • ', scrollSeconds: 8, intervalSeconds: 12, visibleSeconds: 4.5, showOnLoad: true };
    let text = '';
    try {
      text = typeof buildBrandText === 'function' ? buildBrandText(config) : '';
    } catch {}
    if (!text) text = span?.textContent?.trim() || 'ERDRAGON32 • Join the Discord';
    if (span) span.textContent = text;
    document.documentElement.style.setProperty('--brand-duration', `${Math.max(4, Math.min(30, Number(config.scrollSeconds || 8)))}s`);
    if (premiumBrandTimersStarted) return;
    premiumBrandTimersStarted = true;
    const intervalSeconds = Math.max(6, Math.min(45, Number(config.intervalSeconds || 12)));
    if (config.showOnLoad !== false) setTimeout(() => showPremiumBrandDrawer(config), 800);
    setInterval(() => showPremiumBrandDrawer(config), intervalSeconds * 1000);
  }

  function layerStyle(cfg) {
    return [
      `left:${cfg.x}px`,
      `top:${cfg.y}px`,
      `width:${cfg.w}px`,
      `height:${cfg.h}px`,
      `z-index:${cfg.z}`,
      cfg.fontSize ? `font-size:${cfg.fontSize}px` : "",
      `line-height:${cfg.h}px`
    ].filter(Boolean).join(";");
  }

  function renderDetached() {
    ensureStyle();
    const root = badge || document.getElementById("badge");
    if (!root) return;
    const layout = normalizeLayout(decodeLayoutParam());
    const e = layout.elements;
    const d = getCurrentData();
    root.className = "badge rt97-premium-detached";
    root.dataset.themeStyle = themeStyle;
    root.dataset.renderer = "multi-premium-detached-v97";
    root.innerHTML = `
      <img class="rt97-layer-bg" src="${esc(layout.background)}?v=021" alt="" />
      <div class="rt97-layer rt97-badge" style="${layerStyle(e.badge)}"><img src="${esc(d.badgeSrc)}" alt="" /></div>
      <div class="rt97-layer rt97-rank" style="${layerStyle(e.rank)}">${esc(d.rankValue)}</div>
      <div class="rt97-layer rt97-score" style="${layerStyle(e.score)}">${esc(d.scoreValue)}</div>
      <div class="rt97-layer rt97-player" style="${layerStyle(e.player)}">${esc(d.playerValue)}</div>
      <div class="rt97-layer rt97-brand-drawer" style="${layerStyle(e.brand)}"><div class="rt97-brand-icon"></div><div class="rt97-brand-marquee"><span>${esc(d.brandValue)}</span></div></div>
    `;
    document.documentElement.dataset.premiumRenderer = "multi-detached-v97";
    document.documentElement.dataset.premiumLayoutApplied = new URLSearchParams(window.location.search).get("layout") ? "url" : "locked";
    startPremiumBrandCycle();
  }

  const oldSetData = typeof setData === "function" ? setData : null;
  if (oldSetData && !window.__rt97MultiDetachedSetDataPatched) {
    window.__rt97MultiDetachedSetDataPatched = true;
    setData = async function(...args) {
      await oldSetData.apply(this, args);
      renderDetached();
      setTimeout(renderDetached, 80);
      setTimeout(renderDetached, 250);
    };
  }

  window.addEventListener("load", () => {
    renderDetached();
    setTimeout(renderDetached, 100);
    setTimeout(renderDetached, 400);
    setTimeout(renderDetached, 1000);
  });
  renderDetached();
})();



/* RankTag BETA 0.2.1 - FINAL AUTHORITATIVE PREMIUM RENDERER */
(function rankTagV103FinalPremiumRenderer(){
  const premiumStyles = ["cyber-red-elite", "voidrage-inferno"];
  if (typeof themeStyle === "undefined" || !premiumStyles.includes(themeStyle)) return;

  const DEFAULTS = {
    "cyber-red-elite": (typeof CYBER_RED_ELITE_LAYOUT_LOCKED !== "undefined" ? CYBER_RED_ELITE_LAYOUT_LOCKED : {"version": "0.2.1", "schema": "ranktag-premium-layout-v2", "style": "cyber-red-elite", "note": "Include posizione e dimensioni: x/y/w/h/fontSize/z. Questi valori devono essere importati nel pubblico e nel link finale.", "canvas": {"width": 470, "height": 160}, "background": "/assets/premium/cyber-red-elite-bg-v96.png", "elements": {"badge": {"x": 7, "y": 9, "w": 136, "h": 121, "fontSize": 0, "z": 5}, "rank": {"x": 164, "y": 39, "w": 215, "h": 30, "fontSize": 25, "z": 6}, "score": {"x": 165, "y": 78, "w": 120, "h": 16, "fontSize": 12, "z": 6}, "player": {"x": 271, "y": 78, "w": 142, "h": 16, "fontSize": 10.5, "z": 6}, "brand": {"x": 165, "y": 100, "w": 270, "h": 16, "fontSize": 9.5, "z": 6}}}),
    "voidrage-inferno": (typeof VOIDRAGE_INFERNO_LAYOUT_LOCKED !== "undefined" ? VOIDRAGE_INFERNO_LAYOUT_LOCKED : {"version": "0.2.1", "schema": "ranktag-premium-layout-v2", "style": "voidrage-inferno", "note": "Secondo overlay premium separato. Posizioni gestibili via Layout Editor.", "canvas": {"width": 470, "height": 160}, "background": "/assets/premium/voidrage-inferno-fit-v113.png", "elements": {"badge": {"x": 12, "y": 20, "w": 118, "h": 110, "fontSize": 0, "z": 5}, "rank": {"x": 150, "y": 42, "w": 230, "h": 30, "fontSize": 25, "z": 6}, "score": {"x": 152, "y": 78, "w": 120, "h": 16, "fontSize": 12, "z": 6}, "player": {"x": 265, "y": 78, "w": 150, "h": 16, "fontSize": 10.5, "z": 6}, "brand": {"x": 152, "y": 108, "w": 260, "h": 18, "fontSize": 9.5, "z": 6}}})
  };

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function n(v, d) {
    const x = Number(v);
    return Number.isFinite(x) ? x : d;
  }

  function decodeLayoutParam() {
    const raw = new URLSearchParams(window.location.search).get("layout");
    if (!raw) return null;
    try {
      const json = decodeURIComponent(escape(atob(raw)));
      const parsed = JSON.parse(json);
      if (parsed?.elements && (!parsed.style || parsed.style === themeStyle)) return parsed;
    } catch {}
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.elements && (!parsed.style || parsed.style === themeStyle)) return parsed;
    } catch {}
    return null;
  }

  function normalize(layout) {
    const base = DEFAULTS[themeStyle];
    const src = layout?.elements ? layout : base;
    const out = JSON.parse(JSON.stringify(base));
    out.style = themeStyle;
    out.background = src.background || base.background;
    out.canvas = src.canvas || base.canvas || { width: 470, height: 160 };
    for (const key of ["badge","rank","score","player","brand"]) {
      out.elements[key] = Object.assign({}, base.elements[key], src.elements?.[key] || {});
      for (const k of ["x","y","w","h","fontSize","z"]) {
        out.elements[key][k] = n(out.elements[key][k], base.elements[key][k] || 0);
      }
    }
    return out;
  }

  function layerStyle(cfg) {
    return [
      `left:${cfg.x}px`,
      `top:${cfg.y}px`,
      `width:${cfg.w}px`,
      `height:${cfg.h}px`,
      `z-index:${cfg.z}`,
      cfg.fontSize ? `font-size:${cfg.fontSize}px` : "",
      `line-height:${cfg.h}px`
    ].filter(Boolean).join(";");
  }

  function data() {
    return {
      rank: (rankText?.textContent || "PLATINUM 1").trim(),
      score: (scoreText?.textContent || "ELO: 37.705").trim(),
      player: (nameText?.textContent || (typeof getPlayerFromUrl === "function" ? getPlayerFromUrl() : "NOMEPLAYER#1234")).trim(),
      brand: (brandMarqueeText?.textContent || "ERDRAGON32 • Join the Discord").trim(),
      badge: badgeImage?.getAttribute("src") || "/assets/badges/platinum.svg?v=021"
    };
  }

  function ensureStyle() {
    let style = document.getElementById("rt103-final-premium-style");
    if (style) return;
    style = document.createElement("style");
    style.id = "rt103-final-premium-style";
    style.textContent = `
      html, body { margin:0!important; width:100%!important; height:100%!important; overflow:hidden!important; background:transparent!important; }
      body { display:grid!important; place-items:center!important; }
      #overlay.overlay { width:470px!important; height:160px!important; display:grid!important; place-items:center!important; overflow:hidden!important; background:transparent!important; }
      #badge.rt103-premium { position:relative!important; width:470px!important; height:160px!important; min-width:470px!important; min-height:160px!important; max-width:470px!important; max-height:160px!important; display:block!important; padding:0!important; margin:0!important; overflow:hidden!important; border:0!important; box-shadow:none!important; background:transparent!important; }
      .rt103-bg { position:absolute; inset:0; width:470px; height:160px; object-fit:fill; pointer-events:none; z-index:0; }
      .rt103-layer { position:absolute; display:flex; align-items:center; justify-content:flex-start; white-space:nowrap; overflow:hidden; box-sizing:border-box; }
      .rt103-badge { justify-content:center; overflow:visible; }
      .rt103-badge img { width:100%; height:100%; object-fit:contain; filter:drop-shadow(0 2px 10px rgba(255,255,255,.28)) drop-shadow(0 2px 12px rgba(255,42,23,.38)); }
      .rt103-rank { color:#54eaff; font-weight:1000; letter-spacing:.7px; text-transform:uppercase; text-shadow:0 0 12px rgba(84,234,255,.34), 0 2px 8px rgba(0,0,0,.9); }
      .theme-voidrage-inferno .rt103-rank { color:#fff6f2; text-shadow:0 0 12px rgba(255,42,23,.62), 0 2px 8px rgba(0,0,0,.95); }
      .rt103-score, .rt103-player { color:#f7f2ff; font-weight:1000; text-transform:uppercase; text-overflow:ellipsis; text-shadow:0 1px 7px rgba(0,0,0,.95); }
      .rt103-brand { display:flex; align-items:center; gap:7px; padding:0 8px; border-radius:999px; background:linear-gradient(180deg, rgba(12,10,16,.88), rgba(5,4,10,.78)); border:1px solid rgba(255,255,255,.14); transform:translateY(105%); opacity:0; transition:transform 360ms cubic-bezier(.2,.9,.2,1), opacity 260ms ease; }
      .rt103-brand.is-visible { transform:translateY(0); opacity:1; }
      .rt103-brand-icon { width:11px; height:11px; border-radius:3px; background:linear-gradient(135deg,#ff2a17,#ffd36a); box-shadow:0 0 12px rgba(255,42,23,.46); transform:rotate(45deg); flex:0 0 11px; }
      .rt103-marquee { min-width:0; flex:1; overflow:hidden; white-space:nowrap; mask-image:linear-gradient(90deg, transparent, black 9%, black 91%, transparent); }
      .rt103-marquee span { display:inline-block; min-width:max-content; padding-left:100%; font-weight:1000; color:#f7f2ff; text-shadow:0 0 8px rgba(255,42,23,.38), 0 1px 7px rgba(0,0,0,.95); animation:rt103Marquee var(--brand-duration,8s) linear infinite; animation-play-state:paused; }
      .rt103-brand.is-visible .rt103-marquee span { animation-play-state:running; }
      @keyframes rt103Marquee { from { transform:translateX(0); } to { transform:translateX(-100%); } }
    `;
    document.head.appendChild(style);
  }

  let brandStarted = false;
  function startBrand() {
    if (brandStarted) return;
    brandStarted = true;
    const drawer = () => document.querySelector("#badge .rt103-brand");
    const show = () => {
      const el = drawer();
      if (!el) return;
      el.classList.add("is-visible");
      setTimeout(() => el.classList.remove("is-visible"), 4500);
    };
    setTimeout(show, 800);
    setInterval(show, 12000);
  }

  function render() {
    ensureStyle();
    const root = document.getElementById("badge") || badge;
    if (!root) return;
    const layout = normalize(decodeLayoutParam());
    const e = layout.elements;
    const d = data();
    root.className = "badge rt103-premium";
    root.dataset.themeStyle = themeStyle;
    root.dataset.renderer = "rt103-final";
    root.innerHTML = `
      <img class="rt103-bg" src="${esc(layout.background)}?v=021" alt="" />
      <div class="rt103-layer rt103-badge" style="${layerStyle(e.badge)}"><img src="${esc(d.badge)}" alt="" /></div>
      <div class="rt103-layer rt103-rank" style="${layerStyle(e.rank)}">${esc(d.rank)}</div>
      <div class="rt103-layer rt103-score" style="${layerStyle(e.score)}">${esc(d.score)}</div>
      <div class="rt103-layer rt103-player" style="${layerStyle(e.player)}">${esc(d.player)}</div>
      <div class="rt103-layer rt103-brand" style="${layerStyle(e.brand)}"><div class="rt103-brand-icon"></div><div class="rt103-marquee"><span>${esc(d.brand)}</span></div></div>
    `;
    startBrand();
  }

  const oldSetData = typeof setData === "function" ? setData : null;
  if (oldSetData && !window.__rt103FinalPremiumSetData) {
    window.__rt103FinalPremiumSetData = true;
    setData = async function(...args) {
      await oldSetData.apply(this, args);
      render();
      setTimeout(render, 80);
      setTimeout(render, 260);
    };
  }

  window.addEventListener("load", () => {
    render();
    setTimeout(render, 150);
    setTimeout(render, 600);
    setTimeout(render, 1300);
  });
  render();
})();


/* RankTag BETA 0.2.1 - custom elements load fallback */
(function rankTagCustomElementsLoadFallback(){
  window.addEventListener("load", () => {
    [80, 300, 900, 1800].forEach((ms) => setTimeout(() => {
      try { renderCustomImageElements(); } catch(e) {}
    }, ms));
  });
})();



/* RankTag BETA 0.2.1 - authoritative builder layout renderer */
function renderBaseBuilderLayoutAuthoritative() {
  if (!badge) return;
  const isBase = !["cyber-red-elite", "voidrage-inferno"].includes(themeStyle);
  if (!isBase) return;

  const layout = decodeBaseLayoutParam ? decodeBaseLayoutParam() : null;
  if (!layout || !layout.elements) return;

  const e = layout.elements;
  const clipEnabled = paramEnabled("clipFrame", true);
  badge.classList.toggle("base-clip-frame", Boolean(clipEnabled));
  badge.classList.add("base-builder-authoritative");

  // Preserve the real frame/background.
  const shell = badge.querySelector(".card-shell");
  if (shell) {
    shell.style.position = "absolute";
    shell.style.left = "58px";
    shell.style.top = "38px";
    shell.style.width = "400px";
    shell.style.height = "84px";
    shell.style.padding = "0";
    shell.style.margin = "0";
    shell.style.overflow = "visible";
    shell.style.zIndex = "1";
  }

  // Hide original movable DOM elements; clones below become the source of truth.
  [badge.querySelector(".rank-mark"), rankText, scoreText, nameText, brandDrawer].forEach((node) => {
    if (!node) return;
    node.style.visibility = "hidden";
  });

  badge.querySelectorAll(".rt-builder-final-layer").forEach((node) => node.remove());

  const make = (key, cfg, content, className) => {
    if (!cfg) return null;
    const node = document.createElement("div");
    node.className = `rt-builder-final-layer rt-builder-final-${key} ${className || ""}`;
    if (key === "badge") {
      const img = document.createElement("img");
      img.src = badgeImage?.getAttribute("src") || rankIcon?.getAttribute("src") || "/assets/badges/platinum.svg";
      img.alt = "";
      img.draggable = false;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.display = "block";
      img.style.filter = "drop-shadow(0 3px 10px rgba(255,255,255,.22)) drop-shadow(0 3px 16px rgba(0,0,0,.48))";
      node.appendChild(img);
    } else if (key === "brand") {
      node.style.display = "block";
      node.style.overflow = "hidden";
      node.style.whiteSpace = "nowrap";
      node.style.fontWeight = "1000";
      node.style.textShadow = "0 2px 8px rgba(0,0,0,.72)";
      const track = document.createElement("span");
      track.className = "rt-builder-brand-marquee-track";
      const first = document.createElement("span");
      const second = document.createElement("span");
      first.textContent = content || "";
      second.textContent = content || "";
      track.appendChild(first);
      track.appendChild(second);
      node.appendChild(track);
    } else {
      node.textContent = content || "";
      node.style.display = "flex";
      node.style.alignItems = "center";
      node.style.overflow = "hidden";
      node.style.whiteSpace = "nowrap";
      node.style.fontWeight = "1000";
      node.style.textShadow = "0 2px 8px rgba(0,0,0,.72)";
    }
    node.style.position = "absolute";
    node.style.left = `${Number(cfg.x || 0)}px`;
    node.style.top = `${Number(cfg.y || 0)}px`;
    node.style.width = `${Math.max(1, Number(cfg.w || 1))}px`;
    node.style.height = `${Math.max(1, Number(cfg.h || 1))}px`;
    node.style.zIndex = `${Number(cfg.z || 10)}`;
    if (Number(cfg.fontSize || 0) > 0) node.style.fontSize = `${Number(cfg.fontSize)}px`;
    if (cfg.h) node.style.lineHeight = `${Number(cfg.h)}px`;
    if (key === "rank") node.style.color = params.get("rankColor") ? `#${params.get("rankColor").replace("#","").slice(0,6)}` : "";
    if (key === "score") node.style.color = params.get("scoreColor") ? `#${params.get("scoreColor").replace("#","").slice(0,6)}` : "";
    if (key === "player") node.style.color = params.get("nameColor") ? `#${params.get("nameColor").replace("#","").slice(0,6)}` : "";
    if (key === "brand") node.style.color = params.get("extraColor") ? `#${params.get("extraColor").replace("#","").slice(0,6)}` : "";
    if (key === "badge") {
      node.classList.toggle("final-badge-glow", paramEnabled("baseBadgeGlow", false));
      node.classList.toggle("final-badge-ring", paramEnabled("baseBadgeRing", false));
    }
    node.style.pointerEvents = "none";
    badge.appendChild(node);
    return node;
  };

  const rankValue = (rankText?.textContent || "PLATINUM 1").trim();
  const scoreValue = (scoreText?.textContent || "ELO: 37.705").trim();
  const playerValue = (nameText?.textContent || getPlayerFromUrl()).trim();
  const brandValue = (brandMarqueeText?.textContent || "ERDRAGON32 • Join the Discord").trim();

  make("badge", e.badge, "", "");
  make("rank", e.rank, rankValue, "");
  make("score", e.score, scoreValue, "");
  make("player", e.player, playerValue, "");
  make("brand", e.brand, brandValue, "");
}


(function rankTagAuthoritativeBuilderFallback012(){
  window.addEventListener("load", () => {
    [80, 240, 600, 1200, 2200].forEach((ms) => setTimeout(() => {
      try { renderBaseBuilderLayoutAuthoritative(); } catch(e) {}
      try { renderCustomImageElements(); } catch(e) {}
    }, ms));
  });
})();



/* RankTag BETA 0.2.1 - ensure final link always applies builder layout */
function scheduleAuthoritativeBuilderLayout() {
  if (!params.get("baseLayout")) return;
  [0, 40, 120, 260, 520, 1000, 1800, 3000].forEach((ms) => {
    setTimeout(() => {
      try { renderBaseBuilderLayoutAuthoritative(); } catch(e) {}
      try { renderCustomImageElements(); } catch(e) {}
    }, ms);
  });
}
document.addEventListener("DOMContentLoaded", scheduleAuthoritativeBuilderLayout);
window.addEventListener("load", scheduleAuthoritativeBuilderLayout);
