module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.status(200).json({
    version: "21",
    expectedBrand: "ERDRAGON32",
    expectedDiscord: "discord.gg/cffTwCcCGD",
    updatedAt: new Date().toISOString()
  });
};
