const fs = require("fs");
const path = require("path");

function readVersionFile() {
  try {
    const file = path.join(process.cwd(), "public", "version.json");
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {
      version: "BETA 0.7.7",
      build: "0.7.7",
      name: "Supabase Access & Platform Sync",
    };
  }
}

module.exports = function handler(req, res) {
  const meta = readVersionFile();
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("X-Robots-Tag", "noindex");
  res.status(200).json({
    version: meta.version,
    build: meta.build,
    name: meta.name,
    expectedBrand: "ERDRAGON32",
    expectedDiscord: "discord.gg/cffTwCcCGD",
    note: "Usa /version.json per la versione pubblica del sito.",
  });
};
