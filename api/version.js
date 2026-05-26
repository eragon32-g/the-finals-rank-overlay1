module.exports = function handler(req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ version: "1.0.1", name: "RankTag v1.0.1", status: "bugfix" }));
};
