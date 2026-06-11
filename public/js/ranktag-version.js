(function ranktagVersionSync() {
  async function applyVersion() {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const label = data.version || "RankTag";
      const build = String(data.build || "076").replace(/\./g, "");

      document.querySelectorAll("[data-ranktag-version]").forEach((el) => {
        el.textContent = label;
      });

      window.RANKTAG_VERSION = data;
      window.RANKTAG_BUILD = build;

      document.querySelectorAll("[data-ranktag-cache]").forEach((el) => {
        const href = el.getAttribute("href");
        const src = el.getAttribute("src");
        const raw = href || src;
        if (!raw || raw.startsWith("http") || raw.startsWith("#")) return;
        const base = raw.split("?")[0];
        const next = `${base}?v=${build}`;
        if (href) el.setAttribute("href", next);
        if (src) el.setAttribute("src", next);
      });
    } catch (_) {
      /* version.json opzionale offline */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyVersion);
  } else {
    applyVersion();
  }
})();
