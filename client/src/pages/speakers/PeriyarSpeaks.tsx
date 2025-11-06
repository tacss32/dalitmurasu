import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

// Interface for a single post/article
interface Post {
  images: any;
  _id: string;
  title: string;
  content: string | string[];
  headerImage?: string;
  middleImage?: string;
  date: string;
  author: string;
  category: string;
}

export default function PeriyarSpeaks() {
  const [search, setSearch] = useState("");
  const [periyarSpeaks, setPeriyarSpeaks] = useState<Post[]>([]);
  const location = useLocation();

  const SERVER_URL = import.meta.env.VITE_API;

  const getTheme = (name: string) =>
    `${name.toLowerCase().replace(/[\s\-\/]+/g, "")}`;

  const theme = getTheme(location.pathname);

  // Fetch posts and filter by category
  const fetchPosts = async () => {
    try {
      const res = await fetch(
        `${SERVER_URL}api/universal-posts/category/${theme}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setPeriyarSpeaks(data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setPeriyarSpeaks([]); // Set to empty array on error
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredArticles = periyarSpeaks.filter((article) =>
    article.title.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    // Scroll to top on component mount/reload
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-highlight-1/65">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-4">
        {/* Search and Title Section - Common for both views */}
        <div className="flex items-center justify-between gap-3 sticky top-0 z-10 border-b-2 border-highlight-1">
          <h3 className="text-2xl font-bold text-highlight-1">
            பெரியார் பேசுகிறார்
          </h3>
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-3 border-l-2 border-highlight-1 w-full md:w-96 focus:outline-none"
          />
        </div>

        {/* --- Desktop View (Flexbox layout) --- */}
        <div className="hidden md:flex gap-4">
          <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <Link to={`/posts/${article._id}`} key={article._id}>
                  <div className="w-full flex flex-col gap-2 justify-between bg-white/80 hover:bg-white/50 duration-150 transition-colors ease-in-out p-2 rounded shadow-lg">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {highlightMatch(article.title, search)}
                    </h2>
                    <p className="text-md text-gray-600">
                      {new Date(article.date).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                loading..........
              </p>
            )}
          </div>
          <img src="101.png" alt="Periyar" className="w-1/3 object-contain" />
        </div>

        {/* --- Mobile/Tablet List View (Card layout) --- */}
        <div className="md:hidden flex flex-col gap-3">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <Link to={`/posts/${article._id}`} key={article._id}>
                <div className="w-full flex gap-4 p-2 rounded shadow-lg bg-background-to hover:bg-white/50 duration-150 transition-colors ease-in-out">
                  {/* Image Section */}
                 {article.images?.[0] && (
                    <div className="flex-shrink-0 w-24 h-24">
                      <img
                        src={article.images[0]}
                        alt={article.title}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  )}

                  {/* Text Section */}
                  <div className="flex flex-col justify-center ">
                    <h2 className="text-lg font-bold">
                      {highlightMatch(article.title, search)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {new Date(article.date).toLocaleDateString('en-GB')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {/* {article.category || "Editorial"} */}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">
              loading.......
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
