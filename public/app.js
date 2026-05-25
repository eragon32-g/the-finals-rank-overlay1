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

const OVERLAY_VERSION = "62";
const params = new URLSearchParams(window.location.search);

function normalizeThemeStyle(value) {
  const input = String(value || "default").toLowerCase().trim();
  const allowed = ["default", "cyber-red", "glass-minimal", "premium-gold", "tournament-panel"];
  return allowed.includes(input) ? input : "default";
}

const themeStyle = normalizeThemeStyle(params.get("themeStyle"));
document.documentElement.dataset.themeStyle = themeStyle;
document.body?.classList?.add(`theme-${themeStyle}`);

function applyThemeStyleClass() {
  const card = document.querySelector(".rank-card") || document.getElementById("rankCard") || document.querySelector(".badge");
  if (!card) return;
  ["default","cyber-red","glass-minimal","premium-gold","tournament-panel"].forEach((s) => {
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

  await setBadgeVisual({
    league,
    division,
    forcedBadge: data.badge,
    badgeFile: data.badgeFile,
    leagueNumber: data.leagueNumber,
  });
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
setLoading();

if (isManualMode()) {
  loadManual();
} else {
  loadAuto();
  const refreshSeconds = Math.max(30, Math.min(600, Number(params.get("refresh") || 60)));
  setInterval(loadAuto, refreshSeconds * 1000);
}

try { applyThemeStyleClass(); } catch(e) { console.warn(e); }


/* RankTag V38 Plus style finalizer */
(function applyRankTagPlusStyleV38() {
  const allowed = ["default", "cyber-red", "glass-minimal", "premium-gold", "tournament-panel"];
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


/* RankTag V52 - single source image-base Plus engine */
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

/* RankTag V53 render marker */
document.documentElement.setAttribute("data-ranktag-version", "62");
