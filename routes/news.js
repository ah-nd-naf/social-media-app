// routes/news.js
const express = require("express");
const Parser = require("rss-parser");
const router = express.Router();

const parser = new Parser();

router.get("/", async (req, res) => {
  try {
    // Google News RSS (US English). Change hl/gl/ceid for localization.
    const feed = await parser.parseURL("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en");

    const headlines = (feed.items || []).slice(0, 10).map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.creator || item.source || null,
    }));

    res.json(headlines);
  } catch (err) {
    console.error("GET /api/news error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
