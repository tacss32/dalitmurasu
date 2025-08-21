
import React, { useEffect, useState } from "react";
import axios from "axios";

interface Post {
  _id: string;
  title: string;
  content?: string;
  fileName?: string;
  images?: string[];
  source: "PremiumPost" | "UniversalPost" | "PdfUpload";
  createdAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API.replace(/\/+$/, "");

const GetAllPosts: React.FC = () => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const [allPostsRes, pinnedPostsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/combined-posts/all-posts`),
        axios.get(`${API_BASE_URL}/api/combined-posts/pinned`),
      ]);
      setAllPosts(allPostsRes.data);
      setPinnedPosts(pinnedPostsRes.data);
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      setError("Failed to fetch posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const isPinned = (postId: string) =>
    pinnedPosts.some((post) => post._id === postId);

  const handlePinPost = async (postId: string, source: string) => {
    if (pinnedPosts.length >= 3) {
      alert("Maximum of 3 pinned posts allowed.");
      return;
    }

    try {
      setActionLoading(postId);
      await axios.post(`${API_BASE_URL}/api/combined-posts/pin`, {
        postId,
        source,
      });
      await fetchPosts();
    } catch (err: any) {
      console.error(
        "Error pinning post:",
        err?.response?.data?.message || err.message
      );
      alert(err?.response?.data?.message || "Failed to pin post.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpinPost = async (postId: string) => {
    try {
      setActionLoading(postId);
      await axios.delete(`${API_BASE_URL}/api/combined-posts/unpin/${postId}`);
      await fetchPosts();
    } catch (err: any) {
      console.error(
        "Error unpinning post:",
        err?.response?.data?.message || err.message
      );
      alert(err?.response?.data?.message || "Failed to unpin post.");
    } finally {
      setActionLoading(null);
    }
  };

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

  if (loading) return <div className="p-6 text-gray-700">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">
        All Posts
      </h1>
      {allPosts.length === 0 ? (
        <p className="text-center text-gray-500">No posts available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPosts.map((post) => {
            const pinned = isPinned(post._id);
            
         const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return "https://via.placeholder.com/400x250?text=No+Image";
  
  // Cloudinary or external images
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Local images
  return `${API_BASE_URL}/${imagePath.replace(/^\/+/, "")}`;
};

const displayImageUrl =
  post.source !== "PdfUpload" && post.images && post.images.length > 0
    ? getImageUrl(post.images[0])
    : "https://via.placeholder.com/400x250?text=No+Image";

            return (
              <div
                key={post._id}
                className="bg-white rounded-xl shadow-md p-4 flex flex-col"
              >
                {post.source === "PdfUpload" ? (
                  <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center mb-3">
                    <p className="text-gray-500 text-center p-4">
                      PDF: {post.fileName}
                    </p>
                  </div>
                ) : (
                  <img
                    src={displayImageUrl}
                    alt={post.title}
                    className="rounded-lg h-48 object-cover mb-3 w-full"
                  />
                )}
                <h2 className="text-lg font-semibold">{post.title}</h2>
                <p className="text-xs text-gray-400 mb-1">
                  Posted on {formatDate(post.createdAt || "")}
                </p>
                {post.source !== "PdfUpload" && post.content && (
                  <div
                    className="line-clamp-3 text-sm mt-1"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  ></div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Source: {post.source}</p>
                  {pinned ? (
                    <button
                      onClick={() => handleUnpinPost(post._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      disabled={actionLoading === post._id}
                    >
                      Unpin
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePinPost(post._id, post.source)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      disabled={actionLoading === post._id || pinnedPosts.length >= 3}
                    >
                      Pin
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GetAllPosts;