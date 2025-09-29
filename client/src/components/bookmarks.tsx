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

  const categoryTranslations: { [key: string]: string } = {
    'Premium Articles': 'முதன்மைக் கட்டுரைகள்',
    'Other Articles': 'பிற கட்டுரைகள்',
    'Interviews': 'பேட்டிகள்',
    'Periyar speaks': 'பெரியார் பேசுகிறார்',
    'New': 'புத்துயிர்',
    'Dalit Network': 'தலித் பின்னகம்',
    'Babasaheb speaks': 'பாபாசாகேப் பேசுகிறார்',
    'Guidance': 'வழிகாட்டல்',
    'Book Review': 'நூல் திறனாய்வு',
    'Series': 'தொடர்',
    'Editorial': 'தலையங்கம்'
  };

// NOTE: You'll need to fetch categories in the Bookmarks component if you want the Tamil category name.
// Assuming for now you will display the English category name or will implement category fetching.
// Since category data isn't available in this component's scope, we'll just use the post.category.

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
          setBookmarks(res.data.filter((bookmark: Bookmark) => bookmark.postId));
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
        {/* Optional: Add a link to the login page */}
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
        <>
          {/* Desktop Grid View (lg and up) */}
          <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {bookmarks.map((bookmark) => {
              if (!bookmark.postId) return null;
              const post = bookmark.postId as Post;

              const source =
                bookmark.postType === "PremiumPost"
                  ? "premium-articles"
                  : "posts";

              const formattedDate = formatDate(
                post.date || post.createdAt
              );

              return (
                <Card
                  key={bookmark._id}
                  id={post._id}
                  title={post.title}
                  subtitle={post.subtitle}
                  image={post.images?.[0]}
                  date={formattedDate}
                  author={post.author}
                  category={post.category}
                  source={source}
                />
              );
            })}
          </div>

          {/* Mobile/Tablet List View (up to lg) */}
          <div className="lg:hidden flex flex-col gap-3">
            {bookmarks.map((bookmark) => {
              if (!bookmark.postId) return null;
              const post = bookmark.postId as Post;

              const source =
                bookmark.postType === "PremiumPost"
                  ? "premium-articles"
                  : "posts";
              
              const formattedDate = formatDate(
                post.date || post.createdAt
              );

              return (
                <Link 
                  key={bookmark._id} 
                  to={`/${source}/${post._id}`}
                  className="block" // Link must be a block element to span the div
                >
                  <div className="w-full flex gap-4 p-3 rounded-lg shadow-md bg-background-to hover:bg-gray-50 transition-colors ease-in-out border border-gray-200">
                    {/* Image Section */}
                    {post.images?.[0] && (
                      <div className="flex-shrink-0 w-24 h-24">
                        <img
                          src={post.images[0]}
                          alt={post.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}

                    {/* Text Section */}
                    <div className="flex flex-col justify-between py-1 overflow-hidden">
                      <h2 className="text-lg font-bold text-gray-800 line-clamp-2">
                        {post.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="px-2 py-0.5 bg-ba rounded-full font-medium">
                                 {categoryTranslations[post.category] || post.category}
                        </span>
                        <span className="whitespace-nowrap">
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}