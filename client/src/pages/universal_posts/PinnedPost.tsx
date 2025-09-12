import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

// You can reuse the same interfaces from your UniversalPosts component
interface Post {
  _id: string;
  title: string;
  subtitle: string;
  content: string;
  images?: string[];
  createdAt: string;
  author: string;
  category: string;
  isHome?: boolean;
  isRecent?: boolean;
  isPinned?: boolean;
  date?: string;
}

interface Category {
  _id: string;
  name: {
    ta: string;
    en: string;
  };
}

const SERVER_URL = import.meta.env.VITE_API;

const formatDate = (dateStr: string) => {
  if (!dateStr) return "Unknown date";
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function PinnedPosts() {
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPinnedPosts();
    fetchCategories();
  }, []);

  const fetchPinnedPosts = async () => {
    setLoading(true);
    try {
      // THE KEY CHANGE: Use the dedicated '/pinned' route
      const res = await fetch(`${SERVER_URL}api/universal-posts/pinned`);
      if (!res.ok) throw new Error("Failed to fetch pinned posts");
      const data = await res.json();
      setPinnedPosts(data);
    } catch (err) {
      console.error("Error fetching pinned posts:", err);
      let errorMessage = "An unknown error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(`Error fetching pinned posts: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${SERVER_URL}api/categories?available=true`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      let errorMessage = "An unknown error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(`Error fetching categories: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this pinned post?")) return;
    try {
      const res = await fetch(`${SERVER_URL}api/universal-posts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Pinned post deleted successfully!");
        fetchPinnedPosts(); // Refresh the list
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || res.statusText);
      }
    } catch (err) {
      console.error("Error deleting pinned post:", err);
      let errorMessage = "An unknown error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(`Failed to delete pinned post: ${errorMessage}`);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">
        Pinned Posts
      </h1>

      {loading ? (
        <p className="text-center text-gray-500">Loading pinned posts...</p>
      ) : pinnedPosts.length === 0 ? (
        <p className="text-center text-gray-500">No pinned posts found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pinnedPosts.map((post) => {
            const displayImageUrl = post.images && post.images.length > 0
              ? post.images[0].startsWith("http")
                ? post.images[0]
                : `${SERVER_URL}uploads/${post.images[0]}`
              : "https://via.placeholder.com/400x250?text=No+Image";

            return (
              <div
                key={post._id}
                className="bg-white rounded-xl shadow-md p-4 flex flex-col"
              >
                <img
                  src={displayImageUrl}
                  alt={post.title}
                  className="rounded-lg h-48 object-cover mb-3 w-full"
                />
                <h2 className="text-lg font-semibold">{post.title}</h2>
                <p className="text-sm text-gray-500">
                  By {post.author || "Unknown"} in{" "}
                  {categories.find((c) => c._id === post.category)?.name.ta || "Unknown"}
                </p>
                <p className="text-xs text-gray-400 mb-1">
                  Posted on {formatDate(post.createdAt)}
                </p>
                <div
                  className="line-clamp-3 text-sm mt-1"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                ></div>
                <div className="flex gap-2 mt-4">
                  {/* You can add an "Edit" button here if you want, which could open the same modal from your UniversalPosts component */}
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                    onClick={() => handleDelete(post._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}