import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface Post {
  _id: string;
  title: string;
  content: string | string[];
  headerImage?: string;
  middleImage?: string;
  images?: string[]; // added in case API uses this
  date: string;
  author: string;
  category: string;
}

export default function BabasahebSpeaks() {
  const [search, setSearch] = useState("");
  const [babasahebSpeaks, setBabasahebSpeaks] = useState<Post[]>([]);
  const location = useLocation();

  const SERVER_URL = import.meta.env.VITE_API;
  const getTheme = (name: string) =>
    `${name.toLowerCase().replace(/[\s\-\/]+/g, "")}`;

  const theme = getTheme(location.pathname);

  const fetchPosts = async () => {
    try {
      const res = await fetch(
        `${SERVER_URL}api/universal-posts/category/${theme}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setBabasahebSpeaks(data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setBabasahebSpeaks([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredArticles = babasahebSpeaks.filter((article) =>
    article.title.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
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

  const getImage = (article: Post) => {
    return (
      article.headerImage ||
      article.middleImage ||
      article.images?.[0] ||
      ""
    );
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 sticky top-0 z-10 border-b-2 border-highlight-1 bg-background-to backdrop-blur">
        <h3 className="text-2xl font-bold text-highlight-1">
          பாபாசாகேப் பேசுகிறார்
        </h3>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-3 border-l-2 border-highlight-1 w-full md:w-96 focus:outline-none"
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex gap-4">
        <div className="flex flex-col gap-2 flex-grow overflow-y-auto h-[700px]">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <Link to={`/posts/${article._id}`} key={article._id}>
                <div className="w-full flex flex-col gap-2 bg-white/80 hover:bg-white/50 transition-colors duration-150 p-3 rounded shadow-lg">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {highlightMatch(article.title, search)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {new Date(article.date).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">
              No articles found.
            </p>
          )}
        </div>
        <img
          src="102.png"
          alt="Babasaheb"
          className="w-1/3 h-auto object-contain rounded-lg"
        />
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-3">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <Link to={`/posts/${article._id}`} key={article._id}>
              <div className="w-full flex gap-4 p-2 rounded shadow-lg bg-background-to hover:bg-white/50 transition-colors duration-150">
                {/* Image */}
                {getImage(article) && (
                  <div className="flex-shrink-0 w-24 h-24">
                    <img
                      src={getImage(article)}
                      alt={article.title}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                )}
                {/* Text */}
                <div className="flex flex-col justify-center">
                  <h2 className="text-lg font-bold">
                    {highlightMatch(article.title, search)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {new Date(article.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No articles found.</p>
        )}
      </div>
    </div>
  );
}
