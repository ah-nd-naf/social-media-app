import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ExternalLink, Newspaper, Clock, User } from "lucide-react";

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
    <div className="min-h-screen p-6">
      <main className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span>Back to Feed</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Newspaper size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Global News</h1>
            <p className="text-slate-400">Stay updated with the latest trends</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-slate-400 animate-pulse">Fetching latest stories...</p>
          </div>
        ) : error ? (
          <div className="glass-card p-8 rounded-3xl text-center border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {news.map((n, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <a
                    href={n.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h2 className="text-xl font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors leading-tight">
                        {n.title}
                      </h2>
                      <ExternalLink size={20} className="text-slate-500 group-hover:text-cyan-400 shrink-0 mt-1" />
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{n.pubDate ? new Date(n.pubDate).toLocaleDateString() : "Recently"}</span>
                      </div>
                      {n.author && (
                        <div className="flex items-center gap-1.5">
                          <User size={14} />
                          <span className="truncate max-w-[200px]">{n.author}</span>
                        </div>
                      )}
                    </div>
                  </a>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

