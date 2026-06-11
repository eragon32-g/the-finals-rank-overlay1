const fs = require("fs");
const path = require("path");

const root = process.cwd();
const versionFile = path.join(root, "public", "version.json");
const version = JSON.parse(fs.readFileSync(versionFile, "utf8"));
const build = String(version.build || version.version || "0.7.6").replace(/^BETA\s+/i, "");

console.log(`[ranktag build] version=${version.version} build=${build}`);
console.log("[ranktag build] Static site pronto per Vercel (nessuna compilazione richiesta).");
