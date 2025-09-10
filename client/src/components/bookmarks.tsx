// client\src\components\bookmarks.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Card from "./Card";

const SERVER_URL = import.meta.env.VITE_API;

type Post = {
  _id: string;
  title: string;
  content: string;
  subtitle: string;
  images: [string];
  date: string;
  createdAt: string;
  author: string;
  category: string;
};

type Bookmark = {
  _id: string;
  postId: Post | null; // This type is correct, allowing null
  userId: string;
  postType: "UniversalPost" | "PremiumPost";
};

// helper function to format date
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
    const fetchBookmarks = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem("clientToken");
            const userId = localStorage.getItem("userId");
            if (!token || !userId) {
                setError("Please log in to view your bookmarks.");
                setLoading(false);
                return;
            }
            // Use the correct URL structure.
            const res = await axios.get(`${SERVER_URL}api/bookmarks/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        if (res.data && Array.isArray(res.data)) {
          // Filter out any bookmarks that have a null postId
          setBookmarks(res.data.filter((bookmark) => bookmark.postId));
        } else {
          setBookmarks([]);
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          console.error(
            "Error fetching bookmarks:",
            err.response?.data.message || err.message
          );
          setError(err.response?.data.message || "Failed to load bookmarks.");
        } else {
          console.error("An unexpected error occurred:", err);
          setError("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading bookmarks...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-0">
          Your Bookmarks
        </h1>
      </div>
      {bookmarks.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg shadow-md">
          <p className="text-lg text-gray-600 mb-4">
            You haven't bookmarked any posts yet.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-highlight-1 text-white font-semibold rounded-full shadow-lg hover:bg-highlight-1/90 transition-colors duration-200"
          >
            Explore Posts
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {bookmarks.map((bookmark) => {
            if (!bookmark.postId) return null;

            const source =
              bookmark.postType === "PremiumPost"
                ? "premium-articles"
                : "posts";

            const formattedDate = formatDate(
              bookmark.postId.date || bookmark.postId.createdAt
            );

            return (
              <Card
                key={bookmark._id}
                id={bookmark.postId._id}
                title={bookmark.postId.title}
                subtitle={bookmark.postId.subtitle}
                image={bookmark.postId.images?.[0]}
                date={formattedDate}
                author={bookmark.postId.author}
                category={bookmark.postId.category}
                source={source}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
