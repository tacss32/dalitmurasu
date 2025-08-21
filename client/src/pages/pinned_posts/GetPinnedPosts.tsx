import React, { useEffect, useState } from "react";
import axios from "axios";

// Define the Post interface, similar to GetAllPosts.tsx
interface Post {
  _id: string;
  title: string;
  content?: string;
  fileName?: string; // Ensure this is a string
  images?: string[];
  source: "PremiumPost" | "UniversalPost" | "PdfUpload";
  createdAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API.replace(/\/+$/, "");

const GetPinnedPosts: React.FC = () => {
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // To disable button during unpin action

  // Function to fetch pinned posts
  const fetchPinnedPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/combined-posts/pinned`);
      setPinnedPosts(response.data);
    } catch (err: any) {
      console.error("Error fetching pinned posts:", err);
      setError("Failed to fetch pinned posts.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch pinned posts on component mount
  useEffect(() => {
    fetchPinnedPosts();
  }, []);

  // Handler for unpinning a post
  const handleUnpinPost = async (postId: string) => {
    try {
      setActionLoading(postId); // Set loading state for this specific post
      await axios.delete(`${API_BASE_URL}/api/combined-posts/unpin/${postId}`);
      // Re-fetch the pinned posts to update the UI
      await fetchPinnedPosts();
    } catch (err: any) {
      console.error(
        "Error unpinning post:",
        err?.response?.data?.message || err.message
      );
      alert(err?.response?.data?.message || "Failed to unpin post.");
    } finally {
      setActionLoading(null); // Clear loading state
    }
  };

  if (loading) return <div className="p-6 text-gray-700">Loading pinned posts...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">
        Pinned Posts
      </h1>
      {pinnedPosts.length === 0 ? (
        <p className="text-center text-gray-500">No posts are currently pinned.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pinnedPosts.map((post) => {
            // Determine the image URL based on post type and availability
            const displayImageUrl =
  post.source !== "PdfUpload" && post.images && post.images.length > 0
    ? post.images[0]
    : "https://via.placeholder.com/400x250?text=No+Image";


            // Add a check to handle non-string fileName
            const pdfFileName = typeof post.fileName === 'string' ? post.fileName : 'PDF Document';

            return (
              <div
                key={post._id}
                className="bg-white rounded-xl shadow-md p-4 flex flex-col"
              >
                {/* Display image or PDF placeholder */}
                {post.source === "PdfUpload" ? (
                  <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center mb-3">
                    <p className="text-gray-500 text-center p-4">
                      PDF: {pdfFileName} {/* Use the safe variable here */}
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
                  Source: {post.source}
                </p>
                {post.source !== "PdfUpload" && post.content && (
                  <div
                    className="line-clamp-3 text-sm mt-1"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  ></div>
                )}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleUnpinPost(post._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    disabled={actionLoading === post._id}
                  >
                    Unpin
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GetPinnedPosts;