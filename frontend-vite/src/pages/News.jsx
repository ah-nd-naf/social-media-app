import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Using rss2json.com — a free public service that converts RSS feeds to JSON.
// We fetch directly from the browser (no backend needed), bypassing the
// server-side RSS block that was causing the empty news list.
const RSS_TO_JSON =
  "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%3Fhl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen";

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(RSS_TO_JSON)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok" && Array.isArray(data.items)) {
          setNews(data.items.slice(0, 10));
        } else {
          setError("Could not load news. Please try again later.");
        }
      })
      .catch(() => {
        setError("Could not load news. Please check your connection.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Recent News</h1>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Loading news...</p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="space-y-4">
        {news.map((n, i) => (
          <div key={i} className="bg-gray-50 p-3 rounded-lg shadow-sm">
            <a
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-medium hover:underline"
            >
              {n.title}
            </a>
            <div className="text-xs text-gray-500 mt-1">
              {n.pubDate ? new Date(n.pubDate).toLocaleString() : ""}
              {n.author ? ` · ${n.author}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
