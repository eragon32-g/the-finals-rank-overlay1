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

const OVERLAY_VERSION = "50";
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



/* RankTag V43 - real Plus layouts */
(function rankTagRealPlusLayoutsV43() {
  const PLUS_STYLES = ["cyber-red", "glass-minimal", "premium-gold", "tournament-panel"];

  function parseScoreParts(text) {
    const raw = String(text || '').trim();
    const match = raw.match(/^([^:]+):\s*([^#▲▼]+)(.*)$/i);
    if (!match) {
      return { label: 'ELO', value: raw || '-', extra: '' };
    }
    return {
      label: String(match[1] || 'ELO').trim(),
      value: String(match[2] || '-').trim(),
      extra: String(match[3] || '').trim()
    };
  }

  function getCurrentState() {
    const style = normalizeThemeStyle(params.get('themeStyle'));
    const status = statusText && !statusText.classList.contains('hidden') ? String(statusText.textContent || '').trim() : '';
    const rank = normalizeRankDisplay(rankText?.textContent || '').toUpperCase() || 'PLATINUM 1';
    const player = String(nameText?.textContent || getPlayerFromUrl() || 'ERDRAGON32#2577').trim();
    const score = parseScoreParts(scoreText?.textContent || `${params.get('scoreLabel') || 'ELO'}: ${params.get('rankScore') || '37705'}`);
    const emblemSrc = badgeImage?.getAttribute('src') || '';
    return { style, status, rank, player, score, emblemSrc };
  }

  function buildRealLayout(state) {
    const liveBadge = state.status ? `<div class="rt43-live">${state.status}</div>` : '';
    const scoreExtra = state.score.extra ? `<div class="rt43-score-extra">${state.score.extra}</div>` : '';
    const emblem = state.emblemSrc
      ? `<img class="rt43-emblem" src="${state.emblemSrc}" alt="rank emblem" />`
      : `<div class="rt43-emblem-fallback">TF</div>`;

    return `
      <div class="rt43-shell rt43-${state.style}">
        <div class="rt43-noise"></div>
        <div class="rt43-shine"></div>
        <div class="rt43-accent rt43-accent-a"></div>
        <div class="rt43-accent rt43-accent-b"></div>

        <div class="rt43-left">
          <div class="rt43-emblem-frame">${emblem}</div>
        </div>

        <div class="rt43-center">
          <div class="rt43-topbar">
            <div class="rt43-player" title="${state.player}">${state.player}</div>
            <div class="rt43-topbar-right">
              ${liveBadge}
              <div class="rt43-brand">RANKTAG</div>
            </div>
          </div>

          <div class="rt43-bottomrow">
            <div class="rt43-rank-box">
              <div class="rt43-kicker">RANK</div>
              <div class="rt43-rank">${state.rank}</div>
            </div>

            <div class="rt43-score-box">
              <div class="rt43-score-label">${state.score.label}</div>
              <div class="rt43-score-value">${state.score.value}</div>
              ${scoreExtra}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderRealPlusLayout(force = false) {
    const state = getCurrentState();
    if (!PLUS_STYLES.includes(state.style)) return;
    const root = badge || document.getElementById('badge') || document.body.firstElementChild;
    if (!root) return;

    root.className = 'badge rt43-root';
    root.setAttribute('data-theme-style', state.style);
    document.documentElement.dataset.themeStyle = state.style;

    const nextHtml = buildRealLayout(state);
    if (!force && root.innerHTML === nextHtml) return;
    root.innerHTML = nextHtml;
  }

  const __rankTagOrigSetData = setData;
  setData = async function(...args) {
    await __rankTagOrigSetData.apply(this, args);
    renderRealPlusLayout(true);
  };

  window.addEventListener('load', () => {
    setTimeout(() => renderRealPlusLayout(true), 600);
  });
})();


/* RankTag V45 - Cyber Red Rebuild marker */
(function rankTagV45CyberMarker() {
  const q = new URLSearchParams(window.location.search);
  if (String(q.get("themeStyle") || "").toLowerCase() !== "cyber-red") return;

  const mark = () => {
    const shell = document.querySelector(".rt43-shell.rt43-cyber-red");
    if (shell) shell.classList.add("rt45-cyber-rebuild");
  };

  const observer = new MutationObserver(mark);
  observer.observe(document.body, { childList: true, subtree: true });
  mark();
  setTimeout(mark, 250);
  setTimeout(mark, 800);
})();



/* RankTag V47 - Cyber Red Premium Rebuild renderer */
(function rankTagCyberRedPremiumV47() {
  const q = new URLSearchParams(window.location.search);
  if (String(q.get("themeStyle") || "").toLowerCase() !== "cyber-red") return;

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }

  function parseScore(text) {
    const raw = String(text || "").trim();
    const match = raw.match(/^([^:]+):\s*([^#▲▼]+)(.*)$/i);
    return {
      label: match ? String(match[1]).trim() : (q.get("scoreLabel") || "ELO"),
      value: match ? String(match[2]).trim() : (q.get("rankScore") || q.get("score") || "37705"),
      extra: match ? String(match[3] || "").trim() : ""
    };
  }

  function readState() {
    const rank = normalizeRankDisplay(rankText?.textContent || `${q.get("league") || "PLATINUM"} ${q.get("division") || "1"}`).toUpperCase();
    const player = String(nameText?.textContent || q.get("player") || getPlayerFromUrl() || "ERDRAGON32#2577").trim();
    const score = parseScore(scoreText?.textContent || `${q.get("scoreLabel") || "ELO"}: ${q.get("rankScore") || "37705"}`);
    const emblemSrc = badgeImage?.getAttribute("src") || "";
    return { rank, player, score, emblemSrc };
  }

  function render() {
    const root = badge || document.getElementById("badge");
    if (!root) return;

    const state = readState();

    root.className = "badge rt47-root";
    root.setAttribute("data-theme-style", "cyber-red");
    document.documentElement.dataset.themeStyle = "cyber-red";

    root.innerHTML = `
      <div class="rt47-cyber">
        <div class="rt47-layer rt47-frame"></div>
        <div class="rt47-layer rt47-inner"></div>
        <div class="rt47-layer rt47-pattern"></div>
        <div class="rt47-layer rt47-sweep"></div>

        <div class="rt47-emblemDock">
          <div class="rt47-emblemOuter">
            <div class="rt47-emblemInner">
              ${state.emblemSrc ? `<img class="rt47-emblem" src="${esc(state.emblemSrc)}" alt="rank emblem">` : `<div class="rt47-emblemFallback">TF</div>`}
            </div>
          </div>
        </div>

        <div class="rt47-main">
          <div class="rt47-top">
            <div class="rt47-slashes"><span></span><span></span><span></span></div>
            <div class="rt47-brand">RANKTAG</div>
          </div>

          <div class="rt47-player" title="${esc(state.player)}">${esc(state.player)}</div>

          <div class="rt47-bottom">
            <div class="rt47-rankModule">
              <div class="rt47-moduleLabel">RANK</div>
              <div class="rt47-rank">${esc(state.rank)}</div>
            </div>

            <div class="rt47-scoreModule">
              <div class="rt47-scoreLabel">${esc(state.score.label)}</div>
              <div class="rt47-score">${esc(state.score.value)}</div>
            </div>
          </div>
        </div>

        <div class="rt47-redGhost"></div>
        <div class="rt47-cornerMark"></div>
      </div>
    `;
  }

  const originalSetData = setData;
  setData = async function(...args) {
    await originalSetData.apply(this, args);
    render();
  };

  window.addEventListener("load", () => {
    setTimeout(render, 250);
    setTimeout(render, 800);
  });
})();



/* RankTag V48 - Cyber Red asset-base renderer */
(function rankTagCyberRedAssetBaseV48() {
  const q = new URLSearchParams(window.location.search);
  if (String(q.get("themeStyle") || "").toLowerCase() !== "cyber-red") return;

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
    const raw = String(text || '').trim();
    const match = raw.match(/^([^:]+):\s*([^#▲▼]+)(.*)$/i);
    if (!match) {
      return { label: String(q.get('scoreLabel') || 'ELO').trim(), value: raw || '-', extra: '' };
    }
    return {
      label: String(match[1] || q.get('scoreLabel') || 'ELO').trim(),
      value: String(match[2] || '-').trim(),
      extra: String(match[3] || '').trim()
    };
  }

  function readState() {
    const rank = normalizeRankDisplay(rankText?.textContent || `${q.get('league') || 'Platinum'} ${q.get('division') || '1'}`);
    const player = String(nameText?.textContent || getPlayerFromUrl() || q.get('player') || 'NomePlayer#1234').trim();
    const score = parseScoreParts(scoreText?.textContent || `${q.get('scoreLabel') || 'ELO'}: ${q.get('rankScore') || '37705'}`);
    const emblemSrc = badgeImage?.getAttribute('src') || buildBadgeImageUrl(q.get('badgeFile') || 'platinum-1');
    return { rank, player, score, emblemSrc };
  }

  function renderCyberAsset() {
    const root = badge || document.getElementById('badge');
    if (!root) return;

    const state = readState();
    root.className = 'badge rt48-root';
    root.setAttribute('data-theme-style', 'cyber-red');
    document.documentElement.dataset.themeStyle = 'cyber-red';

    root.innerHTML = `
      <div class="rt48-cyber">
        <img class="rt48-base" src="/assets/plus/cyber-red-base.png" alt="Cyber Red base" />
        <div class="rt48-sheen"></div>

        <div class="rt48-emblemWrap">
          <img class="rt48-emblem" src="${esc(state.emblemSrc)}" alt="rank emblem" />
        </div>

        <div class="rt48-player" title="${esc(state.player)}">${esc(state.player)}</div>

        <div class="rt48-rankBlock">
          <div class="rt48-rankLabel">RANK</div>
          <div class="rt48-rankValue">${esc(state.rank)}</div>
        </div>

        <div class="rt48-scoreBlock">
          <div class="rt48-scoreLabel">${esc(state.score.label)}</div>
          <div class="rt48-scoreValue">${esc(state.score.value)}</div>
        </div>
      </div>
    `;
  }

  const __rankTagOrigSetDataV48 = setData;
  setData = async function(...args) {
    await __rankTagOrigSetDataV48.apply(this, args);
    renderCyberAsset();
  };

  window.addEventListener('load', () => {
    setTimeout(renderCyberAsset, 200);
    setTimeout(renderCyberAsset, 700);
  });
})();



/* RankTag V49 - Cyber Red asset alignment override */
(function rankTagCyberRedAssetAlignV49() {
  const q = new URLSearchParams(window.location.search);
  if (String(q.get("themeStyle") || "").toLowerCase() !== "cyber-red") return;

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
    if (!match) return { label: String(q.get("scoreLabel") || "ELO").trim(), value: raw || "-", extra: "" };
    return {
      label: String(match[1] || q.get("scoreLabel") || "ELO").trim(),
      value: String(match[2] || "-").trim(),
      extra: String(match[3] || "").trim()
    };
  }

  function readState() {
    const rank = normalizeRankDisplay(rankText?.textContent || `${q.get("league") || "Platinum"} ${q.get("division") || "1"}`).toUpperCase();
    const player = String(nameText?.textContent || getPlayerFromUrl() || q.get("player") || "NomePlayer#1234").trim();
    const score = parseScoreParts(scoreText?.textContent || `${q.get("scoreLabel") || "ELO"}: ${q.get("rankScore") || "37705"}`);
    const emblemSrc = badgeImage?.getAttribute("src") || buildBadgeImageUrl(q.get("badgeFile") || "platinum-1");
    return { rank, player, score, emblemSrc };
  }

  function renderCyberAsset() {
    const root = badge || document.getElementById("badge");
    if (!root) return;

    const state = readState();
    root.className = "badge rt49-root";
    root.setAttribute("data-theme-style", "cyber-red");
    document.documentElement.dataset.themeStyle = "cyber-red";

    root.innerHTML = `
      <div class="rt49-cyber">
        <img class="rt49-base" src="/assets/plus/cyber-red-base.png" alt="Cyber Red base" />
        <div class="rt49-sheen"></div>

        <div class="rt49-emblemWrap">
          <img class="rt49-emblem" src="${esc(state.emblemSrc)}" alt="rank emblem" />
        </div>

        <div class="rt49-player" title="${esc(state.player)}">${esc(state.player)}</div>

        <div class="rt49-rankBlock">
          <div class="rt49-rankLabel">RANK</div>
          <div class="rt49-rankValue">${esc(state.rank)}</div>
        </div>

        <div class="rt49-scoreBlock">
          <div class="rt49-scoreLabel">${esc(state.score.label)}</div>
          <div class="rt49-scoreValue">${esc(state.score.value)}</div>
        </div>
      </div>
    `;
  }

  const __rankTagSetDataV49 = setData;
  setData = async function(...args) {
    await __rankTagSetDataV49.apply(this, args);
    renderCyberAsset();
  };

  window.addEventListener("load", () => {
    setTimeout(renderCyberAsset, 120);
    setTimeout(renderCyberAsset, 600);
  });
})();



/* RankTag V50 - Cyber Red final-format base renderer */
(function rankTagCyberRedFinalBaseV50() {
  const q = new URLSearchParams(window.location.search);
  if (String(q.get('themeStyle') || '').toLowerCase() !== 'cyber-red') return;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function parseScore(text) {
    const raw = String(text || '').trim();
    const match = raw.match(/^([^:]+):\s*([^#▲▼]+)(.*)$/i);
    return {
      label: match ? String(match[1]).trim() : String(q.get('scoreLabel') || 'ELO').trim(),
      value: match ? String(match[2]).trim() : String(q.get('rankScore') || q.get('score') || '37705').trim(),
      extra: match ? String(match[3] || '').trim() : ''
    };
  }

  function state() {
    return {
      rank: normalizeRankDisplay(rankText?.textContent || `${q.get('league') || 'Platinum'} ${q.get('division') || '1'}`).toUpperCase(),
      player: String(nameText?.textContent || getPlayerFromUrl() || q.get('player') || 'NomePlayer#1234').trim(),
      score: parseScore(scoreText?.textContent || `${q.get('scoreLabel') || 'ELO'}: ${q.get('rankScore') || '37705'}`),
      emblemSrc: badgeImage?.getAttribute('src') || buildBadgeImageUrl(q.get('badgeFile') || 'platinum-1')
    };
  }

  function render() {
    const root = badge || document.getElementById('badge');
    if (!root) return;
    const s = state();
    root.className = 'badge rt50-root';
    root.setAttribute('data-theme-style', 'cyber-red');
    document.documentElement.dataset.themeStyle = 'cyber-red';
    root.innerHTML = `
      <div class="rt50-cyber">
        <img class="rt50-base" src="/assets/plus/cyber-red-base.png" alt="Cyber Red base" />
        <div class="rt50-shine"></div>
        <div class="rt50-emblemWrap"><img class="rt50-emblem" src="${esc(s.emblemSrc)}" alt="rank emblem" /></div>
        <div class="rt50-player" title="${esc(s.player)}">${esc(s.player)}</div>
        <div class="rt50-rankBlock">
          <div class="rt50-rankLabel">RANK</div>
          <div class="rt50-rankValue">${esc(s.rank)}</div>
        </div>
        <div class="rt50-scoreBlock">
          <div class="rt50-scoreLabel">${esc(s.score.label)}</div>
          <div class="rt50-scoreValue">${esc(s.score.value)}</div>
        </div>
      </div>
    `;
  }

  const __origSetDataV50 = setData;
  setData = async function(...args) {
    await __origSetDataV50.apply(this, args);
    render();
  };
  window.addEventListener('load', () => {
    setTimeout(render, 120);
    setTimeout(render, 500);
  });
})();

