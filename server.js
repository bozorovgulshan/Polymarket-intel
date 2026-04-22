const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const fetchJson = async (url) => {
  const f = (await import("node-fetch")).default;
  const r = await f(url, { headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error("Status " + r.status);
  return r.json();
};

app.get("/api/leaderboard", async (req, res) => {
  const endpoints = [
    "https://lb-api.polymarket.com/profit?window=all&limit=30",
    "https://data-api.polymarket.com/leaderboard?window=allTime&limit=30",
    "https://polymarket.com/api/leaderboard?window=all&limit=30",
  ];
  for (const url of endpoints) {
    try {
      const data = await fetchJson(url);
      console.log("Success with:", url);
      return res.json(data);
    } catch (e) {
      console.log("Failed:", url, e.message);
    }
  }
  res.status(502).json({ error: "All Polymarket endpoints failed" });
});

app.get("/api/positions/:address", async (req, res) => {
  try {
    const data = await fetchJson(`https://data-api.polymarket.com/positions?user=${req.params.address}&sizeThreshold=0&limit=50`);
    res.json(data);
  } catch (e) { res.status(502).json({ error: e.message }); }
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
