const BRAND_CONFIG = {
  enabled: true,

  // MODIFICA SOLO QUI IL TUO BRANDING.
  // Chi apre il link overlay NON può cambiare questi dati dai parametri URL.
  brandText: "ERDRAGON32",
  discordText: "discord.gg/cffTwCcCGD",
  callToAction: "JOIN THE VOID",

  // Opzioni: "marquee", "discord", "cta", "brand"
  mode: "marquee",
  separator: " • ",

  // Animazione branding:
  // ogni quanti secondi compare
  intervalSeconds: 18,

  // per quanti secondi resta visibile
  visibleSeconds: 7,

  // velocità scorrimento testo
  scrollSeconds: 8,

  // mostra subito il branding appena si apre l'overlay
  showOnLoad: true
};

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.status(200).json(BRAND_CONFIG);
};
