import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:5000";
const NEWS_API = `${BACKEND_URL}/api/news`;

export default function News() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    fetch(NEWS_API)
      .then((res) => res.json())
      .then((data) => setNews(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Fetch news error:", err);
        setNews([]);
      });
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Recent News</h1>
      <div className="space-y-4">
        {news.length === 0 ? (
          <p className="text-sm text-gray-500">Loading news...</p>
        ) : (
          news.map((n, i) => (
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
