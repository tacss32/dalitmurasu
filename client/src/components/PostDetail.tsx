import { useEffect, useState } from "react";
import { Share2, ArrowLeft, Bookmark, BookmarkCheck } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Card from "./Card";
import axios from "axios";
import { toast } from "react-toastify";

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

type Category = {
  _id: string;
  name: {
    ta: string;
    en: string;
  };
};

// Define the bookmark type to handle populated and unpopulated states
type BookmarkData = {
  _id: string;
  postId: Post | string; // It could be a populated Post object or just a string ID
};

// --- START: Added function for reliable category slug creation ---
const createCategorySlug = (categoryName: string): string => {

  return categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "");
};
// --- END: Added function for reliable category slug creation ---


export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // ✅ Hook for back button
  const [post, setPost] = useState<Post | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Post[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [shareMessageTimeoutId, setShareMessageTimeoutId] = useState<number | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  const userId = localStorage.getItem("userId");
  const clientToken = localStorage.getItem("clientToken");

  const fetchBookmarkStatus = async () => {
    if (!userId || !id) return;
    try {
      const response = await axios.get(`${SERVER_URL}api/bookmarks/${userId}`);
      const bookmarks = response.data;

      const validBookmarks = bookmarks.filter((b: BookmarkData) => b.postId !== null);
      const foundBookmark = validBookmarks.find((b: BookmarkData) => (b.postId as Post)._id === id);

      if (foundBookmark) {
        setIsBookmarked(true);
        setBookmarkId(foundBookmark._id);
      } else {
        setIsBookmarked(false);
        setBookmarkId(null);
      }
    } catch (err) {
      console.error("Failed to fetch bookmark status:", err);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);

        const [postRes, categoriesRes] = await Promise.all([
          fetch(`${SERVER_URL}api/universal-posts/${id}`),
          fetch(`${SERVER_URL}api/categories`),
        ]);

        if (!postRes.ok || !categoriesRes.ok) {
          throw new Error("Failed to load data.");
        }

        const postData = await postRes.json();
        const categoriesData = await categoriesRes.json();

        setPost(postData);
        setCategories(categoriesData);

        if (postData.category) {
          const suggestionsRes = await fetch(
            `${SERVER_URL}api/universal-posts/category/${postData.category}`
          );
          if (!suggestionsRes.ok) {
            throw new Error("Failed to load suggestions.");
          }
          const allSuggestions = await suggestionsRes.json();

          const filteredSuggestions = allSuggestions
            .filter((suggestion: Post) => suggestion._id !== id)
            .slice(0, 3);

          setSuggestions(filteredSuggestions);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load content. Please try again later.");
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);
        useEffect(() => {
                if (post) {
                        // 1. Set the new, specific title
                        document.title = `${post.title} | My Blog`;

                        // 2. Return the cleanup function
                        return () => {
                                // 3. When navigating away, restore the default site title
                                document.title = "Dalitmurasu"; // <- Set your app's default title here
                        };
                } else {
                        document.title = "Loading Post...";
                }
        }, [post]); 

  useEffect(() => {
    fetchBookmarkStatus();
  }, [userId, id]);

  useEffect(() => {
    return () => {
      if (shareMessageTimeoutId) {
        clearTimeout(shareMessageTimeoutId);
      }
    };
  }, [shareMessage, shareMessageTimeoutId]);

  const getTamilCategoryName = (englishCategoryName: string) => {
    const category = categories.find(
      (cat) => cat.name.en === englishCategoryName
    );
    return category?.name.ta || englishCategoryName;
  };

  const handleShare = async () => {
    if (!post) return;
    if (shareMessageTimeoutId) {
      clearTimeout(shareMessageTimeoutId);
    }

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.replace(/<[^>]*>/g, "").substring(0, 100) + "...",
          url: window.location.href,
        });
        setShareMessage("Post shared successfully!");
        const newTimeoutId = window.setTimeout(() => setShareMessage(null), 3000);
        setShareMessageTimeoutId(newTimeoutId);
      } catch (error) {
        setShareMessage("Error sharing page.");
        const newTimeoutId = window.setTimeout(() => setShareMessage(null), 3000);
        setShareMessageTimeoutId(newTimeoutId);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareMessage("Link copied to clipboard!");
        const newTimeoutId = window.setTimeout(() => setShareMessage(null), 3000);
        setShareMessageTimeoutId(newTimeoutId);
      } catch (error) {
        setShareMessage("Unable to copy link. Please copy the URL manually.");
        const newTimeoutId = window.setTimeout(() => setShareMessage(null), 5000);
        setShareMessageTimeoutId(newTimeoutId);
      }
    }
  };

  const handleBookmark = async () => {
    if (!userId || !post) {
      toast.error("Please log in to bookmark posts.");
      return;
    }
    if (isBookmarked) {
      handleRemoveBookmark();
      return;
    }
    const payload = {
      userId,
      postId: post._id,
      postType: "UniversalPost",
    };
    try {
      const res = await axios.post(`${SERVER_URL}api/bookmarks`, payload, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
        },
      });
      setIsBookmarked(true);
      setBookmarkId(res.data.bookmark._id);
      toast.success("Post bookmarked successfully!");
    } catch (error: any) {
      if (error.response?.status === 409) {
        setIsBookmarked(true);
        toast.info("This post is already bookmarked.");
        fetchBookmarkStatus();
      } else {
        toast.error(error.response?.data?.error || "Error bookmarking post.");
      }
    }
  };

  const handleRemoveBookmark = async () => {
    if (!userId || !bookmarkId) return;

    try {
      await axios.delete(`${SERVER_URL}api/bookmarks/${bookmarkId}`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
        },
      });
      setIsBookmarked(false);
      setBookmarkId(null);
      toast.success("Bookmark removed successfully!");
    } catch (error: any) {
      toast.error("Failed to remove bookmark.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || "Post not found"}</p>
        </div>
       
      </div>
    );
  }

  const imageUrls = post.images;

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
      {/* --- Header Section --- */}
      <div className="flex flex-col gap-3 py-6 border-b-4 border-highlight-1 relative">
        <div className="flex items-center gap-2 text-sm">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="bg-highlight-1/70 text-white px-3 py-1 rounded-full hover:bg-highlight-1 transition-colors duration-200  "
          >
            <ArrowLeft size={25} />
            <span className="hidden sm:inline"></span>
          </button>
          <span className="bg-highlight-1/70 text-white px-3 py-1 rounded-full">
            {new Date(post.date).toLocaleDateString('en-GB')}
          </span>
          <span className="text-2xl">•</span>
          {/* Updated category link - NOW USES createCategorySlug */}
          <Link
            to={`/${createCategorySlug(post.category)}`}
            className="bg-highlight-1/70 text-white px-3 py-1 rounded-full hover:bg-highlight-1 transition-colors duration-200"
          >
            {getTamilCategoryName(post.category)}
          </Link>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight">
          {post.title}
        </h1>
        <h1 className="text-1xl md:text-2xl font-bold text-gray-900 leading-tight">
          {post.subtitle}
        </h1>
        
       
        <div className="flex items-center justify-between"> 
          {/* Author Name - always visible */}
          <p className="text-base md:text-xl text-gray-600 flex items-center gap-2">
            <span className="w-7 h-7 bg-highlight-1 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {post.author.charAt(0).toUpperCase()}
            </span>
            {post.author}
          </p>
          
            {/* // --- START MODIFIED MOBILE ICONS ---
            // Consolidating the two separate mobile-only icon blocks into one.
            */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile-only Share Button (Share2 Icon only) */}
            <button
              onClick={handleShare}
              className="group bg-highlight-1 text-white hover:bg-highlight-1/80 p-2 rounded-full shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center justify-center"
              aria-label="Share post"
            >
              <Share2 size={18} />
            </button>

            {/* Mobile-only Bookmark Button (Bookmark icon only) */}
            <button
              onClick={handleBookmark}
              className="group bg-highlight-1 text-white hover:bg-highlight-1/80 p-2 rounded-full shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center justify-center"
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark post"}
            >
              {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
          </div>
            {/* --- END MODIFIED MOBILE ICONS --- */}
        </div>
       
        
        <div className="hidden md:flex absolute top-6 right-0 items-center gap-2">
          <button
            onClick={handleShare}
            className="group bg-highlight-1 text-white hover:bg-highlight-1/80 px-4 py-1.5 rounded-full shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center gap-2"
          >
            <Share2 size={18} />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={handleBookmark}
            className="group bg-highlight-1 text-white hover:bg-highlight-1/80 px-4 py-2 rounded-full shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center justify-center"
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark post"}
          >
            {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
       

      </div>

      {/* --- Image Carousel --- */}
      {imageUrls.length > 0 && (
                          <div className="relative w-full h-100 rounded-xl overflow-hidden shadow-lg bg-gray-100">
          <img
            src={imageUrls[imageIndex]}
            alt={`Post Image ${imageIndex + 1}`}
                                         className="object-cover w-full h-full transition-all duration-500"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop";
            }}
          />

          {imageUrls.length > 1 && (
            <>
              <button
                onClick={() =>
                  setImageIndex(
                    (prev) => (prev - 1 + imageUrls.length) % imageUrls.length
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={() =>
                  setImageIndex((prev) => (prev + 1) % imageUrls.length)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                aria-label="Next image"
              >
                ›
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {imageUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === imageIndex
                        ? "bg-white"
                        : "bg-white bg-opacity-50"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <article className="prose prose-lg max-w-none">
        <style>
          {`
            .rich-content a {
              color: #3b82f6;
              text-decoration: underline;
              text-align-last:left;  
            }
          `}
        </style>
        <div
          className="rich-content text-gray-800 leading-relaxed "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4"></h2>
          {/* Desktop Grid View */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 w-full mx-auto gap-10">
            {suggestions.map((post) => (
              <Card
                key={post._id}
                title={post.title}
                subtitle={post.subtitle}
                image={post?.images?.[0]}
                date={post.date || post.createdAt}
                author={post.author}
                id={post._id}
                category={post.category}
              />
            ))}
          </div>
          {/* Mobile/Tablet List View */}
          <div className="md:hidden flex flex-col gap-3">
            {suggestions.map((post) => (
              <Link to={`/posts/${post._id}`} key={post._id}>
                <div className="w-full flex gap-4 p-2 rounded shadow-lg bg-background-to hover:bg-white/50 duration-150 transition-colors ease-in-out">
                  {/* Image Section */}
                  {post?.images?.[0] && (
                    <div className="flex-shrink-0 w-24 h-24">
                      <img
                        src={post.images[0]}
                        alt={post.title}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  )}

                  {/* Text Section */}
                  <div className="flex flex-col justify-center">
                    <h2 className="text-lg font-bold">
                      {post.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                                                    {new Date(post.date || post.createdAt).toLocaleDateString('en-GB')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getTamilCategoryName(post.category)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}