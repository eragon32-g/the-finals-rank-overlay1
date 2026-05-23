const BRAND_CONFIG = {
  enabled: true,

  // MODIFICA SOLO QUI IL TUO BRANDING.
  // Chi apre il link overlay NON può cambiare questi dati dai parametri URL.
  brandText: "ERDRAGON3",
  discordText: "discord.gg/cffTwCcCGD",
  callToAction: "JOIN THE VOID",

  // Opzioni: "split", "discord", "cta", "brand"
  mode: "split"
};

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json(BRAND_CONFIG);
};
