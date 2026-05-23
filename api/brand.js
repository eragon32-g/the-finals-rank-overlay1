const BRAND_CONFIG = {
  enabled: true,
  version: "22",
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

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.status(200).json(BRAND_CONFIG);
};
