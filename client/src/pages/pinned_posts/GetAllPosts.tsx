// client/src/pages/pinned_posts/GetAllPosts.tsx

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

interface Post {
  _id: string;
  title: string;
  content?: string;
  fileName?: string;
  images?: string[];
  source: "PremiumPost" | "UniversalPost";
  createdAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API.replace(/\/+$/, "");

const GetAllPosts: React.FC = () => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

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

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return "https://via.placeholder.com/400x250?text=No+Image";
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    return `${API_BASE_URL}/${imagePath.replace(/^\/+/, "")}`;
  };

  const filteredPosts = useMemo(() => {
  return allPosts.filter((post) => {
    // REMOVED: The redundant check for post.source === "PdfUpload"
    
    const postDate = post.createdAt ? new Date(post.createdAt) : null;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const titleMatch = post.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const sourceMatch =
      selectedSource === "All" || post.source === selectedSource;
    const dateMatch =
      (!from || (postDate && postDate >= from)) &&
      (!to || (postDate && postDate <= to));

    return titleMatch && sourceMatch && dateMatch;
  });
}, [allPosts, searchTerm, selectedSource, fromDate, toDate]);

  if (loading) return <div className="p-6 text-gray-700">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">
        All Posts
      </h1>

      <div className="flex flex-col md:flex-row items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <input
          type="text"
          placeholder="Search by title..."
          className="w-full md:flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="w-full md:w-1/4 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="All">All Sources</option>
          <option value="PremiumPost">Premium Posts</option>
          <option value="UniversalPost">Universal Posts</option>
        </select>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <label htmlFor="fromDate" className="text-sm font-medium text-gray-700">From:</label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <label htmlFor="toDate" className="text-sm font-medium text-gray-700">To:</label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <p className="text-center text-gray-500">No posts available with the selected filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const pinned = isPinned(post._id);
            const displayImageUrl =
              post.images && post.images.length > 0
                ? getImageUrl(post.images[0])
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
                <p className="text-xs text-gray-400 mb-1">
                  Posted on {formatDate(post.createdAt || "")}
                </p>
                {post.content && (
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