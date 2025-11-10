import { useEffect, useState } from "react";
import { ArrowLeft, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const SERVER_URL = import.meta.env.VITE_API;

type Post = {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
};

type PostListItem = {
  _id: string;
  createdAt: string;
};

export default function CartoonsDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [allPostIds, setAllPostIds] = useState<string[]>([]);
  const [prevPostId, setPrevPostId] = useState<string | null>(null);
  const [nextPostId, setNextPostId] = useState<string | null>(null);

  // Touch handling for swipe gestures
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Detect mobile view
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        setPost(null);
        setPrevPostId(null);
        setNextPostId(null);

        const res = await fetch(`${SERVER_URL}api/cartoons/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();
        setPost(data);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError((err as Error).message || "Failed to load post. Please try again later.");
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id]);

  useEffect(() => {
    const fetchPostList = async () => {
      try {
        const res = await fetch(`${SERVER_URL}api/cartoons`);
        if (!res.ok) throw new Error("Failed to fetch post list");

        const postList: PostListItem[] = await res.json();
        const ids = postList.map((p) => p._id);
        setAllPostIds(ids);
      } catch (err) {
        console.error("Error fetching post list:", err);
      }
    };

    fetchPostList();
  }, []);

  useEffect(() => {
    if (id && allPostIds.length > 0) {
      const currentIndex = allPostIds.indexOf(id);
      if (currentIndex === -1) {
        setPrevPostId(null);
        setNextPostId(null);
        return;
      }
      setPrevPostId(currentIndex > 0 ? allPostIds[currentIndex - 1] : null);
      setNextPostId(currentIndex < allPostIds.length - 1 ? allPostIds[currentIndex + 1] : null);
    }
  }, [id, allPostIds]);

  const handlePrevious = () => {
    if (prevPostId) navigate(`/cartoons/${prevPostId}`);
  };

  const handleNext = () => {
    if (nextPostId) navigate(`/cartoons/${nextPostId}`);
  };

  // --- SWIPE HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;

    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 75; // Minimum distance for swipe to trigger

    if (distance > minSwipeDistance && nextPostId) {
      // Swipe left → Next post
      handleNext();
    } else if (distance < -minSwipeDistance && prevPostId) {
      // Swipe right → Previous post
      handlePrevious();
    }

    // Reset values
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handleShare = async () => {
    if (!post) return;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.replace(/<[^>]*>/g, "").substring(0, 100) + "...",
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing post:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } catch (error) {
        alert("Unable to copy link. Please copy the URL manually.");
      }
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

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 py-6 border-b-4 border-highlight-1 relative">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate(-1)}
            className="bg-highlight-1/70 text-white px-3 py-1 rounded-full hover:bg-highlight-1 transition-colors duration-200"
          >
            <ArrowLeft size={25} />
          </button>
          <span className="bg-highlight-1/70 text-white px-3 py-1 rounded-full">
            {new Date(post.createdAt).toLocaleDateString("en-GB")}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
          {post.title}
        </h1>
        <button
          onClick={handleShare}
          className="absolute top-6 right-0 group bg-highlight-1 text-white hover:bg-highlight-1/80 px-4 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2"
        >
          <Share2 size={18} />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Image with buttons or swipe */}
      <div
        className="flex items-center gap-2 sm:gap-4"
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {/* Show buttons only on desktop */}
        {!isMobile && (
          <button
            onClick={handlePrevious}
            disabled={!prevPostId}
            aria-label="Previous Post"
            className={`flex-shrink-0 bg-highlight-1 p-3 rounded-full shadow-md transition-all duration-200 ${prevPostId ? "opacity-100" : "opacity-0 invisible"
              }`}
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
        )}

        {/* Image */}
        <div className="flex-1 w-full rounded-xl overflow-hidden shadow-lg bg-gray-100">
          <img
            src={post.imageUrl}
            alt="Post Image"
            className="object-cover w-full h-full transition-all duration-500"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop";
            }}
          />
        </div>

        {!isMobile && (
          <button
            onClick={handleNext}
            disabled={!nextPostId}
            aria-label="Next Post"
            className={`flex-shrink-0 bg-highlight-1 p-3 rounded-full shadow-md transition-all duration-200 ${nextPostId ? "opacity-100" : "opacity-0 invisible"
              }`}
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        )}
      </div>

      <article className="prose prose-lg max-w-none">{post.content}</article>
    </div>
  );
}
