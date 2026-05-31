module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.status(200).json({
    version: "0.4.2",
    expectedBrand: "ERDRAGON32",
    expectedDiscord: "discord.gg/cffTwCcCGD",
    note: "If /api does not work, use /version.json and /brand.json."
  });
};
