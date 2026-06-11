const DAY = 24 * 60 * 60 * 1000;

function checksumCode(raw) {
  const text = String(raw || "").toUpperCase();
  let n = 0;
  for (let i = 0; i < text.length; i++) n = (n * 31 + text.charCodeAt(i)) % 46656;
  return n.toString(36).toUpperCase().padStart(3, "0").slice(-3);
}

function encodeDurationToken(type, input) {
  if (type === "permanent") return "P";
  const mins = Math.max(1, Math.round(durationToMs(input) / 60000));
  return `T${mins.toString(36).toUpperCase()}`;
}

function durationToMs(input) {
  if (input && typeof input === "object") {
    const d = Math.max(0, Number(input.days || 0));
    const h = Math.max(0, Number(input.hours || 0));
    const m = Math.max(0, Number(input.minutes || 0));
    const total = ((d * 24 * 60) + (h * 60) + m) * 60 * 1000;
    return Math.max(60 * 1000, total || DAY);
  }
  return Math.max(60 * 1000, Math.max(0, Number(input || 0)) * DAY || DAY);
}

function parsePortableCode(code) {
  const clean = String(code || "").trim().toUpperCase();
  const parts = clean.split("-");
  if (parts.length < 5 || parts[0] !== "RT" || parts[1] !== "A") return null;
  const body = parts.slice(0, -1).join("-");
  const chk = parts[parts.length - 1];
  if (checksumCode(body) !== chk) return null;
  const token = parts[2] || "";
  const type = token === "P" ? "permanent" : "temporary";
  const minutes = type === "permanent" ? null : parseInt(token.slice(1), 36);
  if (type !== "permanent" && (!Number.isFinite(minutes) || minutes < 1)) return null;
  return {
    code: clean,
    type,
    duration_ms: type === "permanent" ? null : minutes * 60000,
  };
}

function makePortableCode(type, durationInput) {
  const normalizedType = type === "permanent" ? "permanent" : "temporary";
  const dur = encodeDurationToken(normalizedType, durationInput);
  const stamp = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  const body = `RT-A-${dur}-${stamp}-${rnd}`;
  return `${body}-${checksumCode(body)}`;
}

module.exports = {
  DAY,
  checksumCode,
  durationToMs,
  parsePortableCode,
  makePortableCode,
};
