// client\src\pages\premium_articles\PremiumArticleDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Share2, ArrowLeft,BookmarkCheck,Bookmark } from "lucide-react";
import { toast } from "react-toastify";

const API_BASE_URL = import.meta.env.VITE_API;

interface IPremiumPost {
    _id: string;
    title: string;
    subtitle?: string;
    content: string;
    contentPreview?: string;
    author: string;
    category: string;
    images: string[];
    isHome: boolean;
    isRecent: boolean;
    visibility: 'public' | 'subscribers';
    views: number;
    freeViewLimit: number;
    date: string;
    createdAt: string;
    updatedAt: string;
    publicationSource?: string;
    publicationDateInfo?: string;
    uniqueIdentifier?: string;
    truncated?: boolean;
    isUserSubscribed?: boolean;
}

// Define the bookmark type to handle populated and unpopulated states
type BookmarkData = {
  _id: string;
  postId: IPremiumPost | null; // This type is crucial to handle null
};

// Helper function to truncate text to exactly 150 words
const truncateTo150Words = (text: string | undefined): string => {
    if (!text) return "";
    const words = text.split(/\s+/);
    if (words.length > 150) {
        return words.slice(0, 150).join(" ") + "...";
    }
    return text;
};

const categoryInTamil: { [key: string]: string } = {
    'Premium Articles': 'முதன்மைக் கட்டுரைகள்',
};

export default function PremiumArticleDetail() {
    const { id } = useParams<{ id: string }>();
    const [article, setArticle] = useState<IPremiumPost | null>(null);
    const [imageIndex, setImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [accessDeniedByLimit, setAccessDeniedByLimit] = useState<boolean>(false);
    const [isUserCurrentlySubscribed, setIsUserCurrentlySubscribed] = useState<boolean>(false);
    const [showSubscriptionPopup, setShowSubscriptionPopup] = useState<boolean>(false);
    const [showLoginPopup, setShowLoginPopup] = useState<boolean>(false);
    const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
    const [bookmarkId, setBookmarkId] = useState<string | null>(null); // New state to store bookmark's ID
    const navigate = useNavigate();

//     const userId = localStorage.getItem("userId");
    const clientToken = localStorage.getItem("clientToken");
    const userId = localStorage.getItem("userId");

    // Fetch article details and check subscription status
    useEffect(() => {
        const fetchArticle = async () => {
            if (!id) {
                setError('Article ID is missing.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                setAccessDeniedByLimit(false);
                setIsUserCurrentlySubscribed(false);
                setShowLoginPopup(false);

                const headers = clientToken ? { Authorization: `Bearer ${clientToken}` } : {};
                const response = await axios.get<IPremiumPost>(`${API_BASE_URL}api/premium-posts/${id}`, { headers });
                setArticle(response.data);
                setIsUserCurrentlySubscribed(response.data.isUserSubscribed || false);
            } catch (err: any) {
                if (err.response) {
                    const { status, data } = err.response;
                    if (status === 401) {
                        setShowLoginPopup(true);
                        setError("Please log in to view this article.");
                        setArticle(null);
                    } else if (status === 403) {
                        setAccessDeniedByLimit(true);
                        setError(data?.error || '');
                        if (data?.articleData) {
                            const backendArticleData = data.articleData;
                            setArticle({
                                ...backendArticleData,
                                content: backendArticleData.contentPreview || "This article requires a subscription for full access.",
                                truncated: backendArticleData.truncated || true,
                                visibility: backendArticleData.visibility || "subscribers",
                                isUserSubscribed: backendArticleData.isUserSubscribed,
                            });
                            setIsUserCurrentlySubscribed(backendArticleData.isUserSubscribed || false);
                        } else {
                            setError(data?.error || 'Authentication or subscription required for full access.');
                            setArticle(null);
                            setIsUserCurrentlySubscribed(false);
                        }
                    } else if (status === 404) {
                        setError('Article not found.');
                        setArticle(null);
                        setIsUserCurrentlySubscribed(false);
                    } else {
                        setError(data?.message || 'Failed to load article. Please try again later.');
                        setArticle(null);
                    }
                } else {
                    setError('Network error or server unreachable. Please try again later.');
                    setArticle(null);
                    setIsUserCurrentlySubscribed(false);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id, clientToken]);

    // Fetch bookmark status for the current user and post
    useEffect(() => {
        const fetchBookmarkStatus = async () => {
            if (!userId || !id) return;
            try {
                const response = await axios.get(`${API_BASE_URL}api/bookmarks/${userId}`);
                const bookmarks = response.data;
                
                // Filter out any bookmarks where postId is null
                const validBookmarks = bookmarks.filter((b: BookmarkData) => b.postId !== null);
                
                const foundBookmark = validBookmarks.find((b: BookmarkData) => (b.postId as IPremiumPost)._id === id);

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
        fetchBookmarkStatus();
    }, [userId, id]);

    const handleShare = async () => {
        if (!article) return;
        if (typeof navigator.share === "function") {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.content.replace(/<[^>]*>/g, "").substring(0, 100) + "...",
                    url: window.location.href,
                });
                toast.success("Article link shared successfully!");
            } catch (error) {
                toast.error("Error sharing article.");
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard!");
            } catch (error) {
                toast.error("Unable to copy link. Please copy the URL manually.");
            }
        }
    };

    const handleBookmark = async () => {
        if (!userId || !article) {
            toast.error("Please log in to bookmark articles.");
            return;
        }
        if (isBookmarked) {
            handleRemoveBookmark();
            return;
        }
        const payload = {
            userId,
            postId: article._id,
            postType: "PremiumPost",
        };
        try {
            const res = await axios.post(`${API_BASE_URL}api/bookmarks`, payload, {
                headers: {
                    Authorization: `Bearer ${clientToken}`,
                },
            });
            setIsBookmarked(true);
            setBookmarkId(res.data.bookmark._id); // Save the new bookmark ID
            toast.success("Article bookmarked successfully!");
        } catch (error: any) {
            // Handle the 409 Conflict error specifically
            if (error.response?.status === 409) {
                setIsBookmarked(true); // Update state to reflect existing bookmark
                toast.info("Article is already bookmarked.");
                // Re-fetch the bookmark status to get the correct bookmarkId
                fetchBookmarkStatus();
            } else {
                toast.error(error.response?.data?.error || "Error bookmarking article.");
            }
        }
    };

    const handleRemoveBookmark = async () => {
        if (!userId || !bookmarkId) {
          // If bookmarkId is not set, we need to find it first
          const bookmarksRes = await axios.get(`${API_BASE_URL}api/bookmarks/${userId}`);
          const foundBookmark = bookmarksRes.data.find((b: BookmarkData) => b.postId?._id === id);
          if (foundBookmark) {
            setBookmarkId(foundBookmark._id);
          } else {
            toast.error("Bookmark not found.");
            setIsBookmarked(false);
            return;
          }
        }

        try {
            await axios.delete(`${API_BASE_URL}api/bookmarks/${bookmarkId}`, {
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
            <div className="flex justify-center items-center min-h-screen text-gray-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading article...</p>
                </div>
            </div>
        );
    }
    
    if (showLoginPopup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm w-full">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
                    <p className="text-gray-600 mb-6">
                        You need to be logged in to view this premium content.
                    </p>
                    <Link
                        to="/login"
                        className="w-full inline-block px-6 py-3 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-200"
                    >
                        Log In
                    </Link>
                </div>
            </div>
        );
    }

    if (!article && error && !accessDeniedByLimit) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white text-red-600 flex-col">
                <p className="text-xl mb-4">{error || "Article not found"}</p>
                <Link to="/premiumarticles" className="text-yellow-600 hover:underline">
                    &larr; Back to Premium Articles
                </Link>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white text-red-600 flex-col">
                <p className="text-xl mb-4">Failed to load article details. Please try again later.</p>
                <Link to="/premiumarticles" className="text-yellow-600 hover:underline">
                    &larr; Back to Premium Articles
                </Link>
            </div>
        );
    }

    const shouldShowPaywall = (
        article.visibility === 'subscribers' &&
        !isUserCurrentlySubscribed &&
        article.truncated
    );

    const imageUrls = (article.images || []).filter(url => url);
    const contentToDisplay = shouldShowPaywall ? truncateTo150Words(article.contentPreview) : article.content;

    return (
        <div className="min-h-screen text-gray-900">
            <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
                <div className="flex flex-col gap-3 py-6 border-b-4 border-red-500 relative">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
    {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className=" h-10 w-17 flex items-center gap-1 text-white  bg-highlight-1 hover:bg-highlight-1/80 transition  rounded-lg"
          >
            <ArrowLeft size={25} />
            <span className="hidden sm:inline">back</span>
          </button>
                        <span className="bg-highlight-1 text-white px-3 py-1 rounded-full">
                            {new Date(article.date).toLocaleDateString()}
                        </span>
                        <span className="text-2xl text-yellow-600">•</span>
                        <span className="bg-highlight-1 text-white px-3 py-1 rounded-full">
                            {categoryInTamil[article.category] || article.category}
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                        {article.title}
                    </h1>
                    {article.subtitle && <p className="text-1xl font-bold text-gray-900 leading-tight">{article.subtitle}</p>}
                    <p className="text-xl text-gray-700 flex items-center gap-2">
                        <span className="w-7 h-7 bg-highlight-1 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {article.author.charAt(0).toUpperCase()}
                        </span>
                        {article.author}
                    </p>
                    <div className="text-gray-600 text-sm mt-2">
                        {article.publicationSource && <p>Source: {article.publicationSource}</p>}
                        {article.publicationDateInfo && <p>{article.publicationDateInfo}</p>}
                        {article.uniqueIdentifier && <p>ID: {article.uniqueIdentifier}</p>}
                    </div>

                    {/* Share and Bookmark Buttons Container */}
                    <div className="absolute top-6 right-0 flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="group bg-highlight-1 text-white hover:bg-yellow-700 px-4 py-2 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 flex items-center gap-2"
                        >
                            <Share2 size={18} />
                            <span className="hidden sm:inline">Share</span>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                Share this article
                            </span>
                        </button>

                        <button
                            onClick={isBookmarked ? handleRemoveBookmark : handleBookmark}
                            className="group bg-highlight-1 text-white hover:bg-yellow-700 px-4 py-2 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 flex items-center justify-center"
                        >
                            {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>
                    </div>
                </div>

                {imageUrls.length > 0 && (
                    <div className="relative w-full h-auto rounded-xl overflow-hidden shadow-lg bg-gray-100 aspect-video">
                        <img
                            src={imageUrls[imageIndex]}
                            alt={`Article Image ${imageIndex + 1}`}
                            className="object-cover w-full h-full transition-all duration-500"
                            onError={(e) => {
                                e.currentTarget.src =
                                    "https://via.placeholder.com/1200x600?text=Image+Not+Available";
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
                                            className={`w-2 h-2 rounded-full transition-all duration-200 ${index === imageIndex ? "bg-white" : "bg-white bg-opacity-50"
                                                }`}
                                            aria-label={`Go to image ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
                {shouldShowPaywall ? (
                    <div className="p-8 rounded-lg text-center my-8">
                        <div
                            className="rich-content text-justify text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: contentToDisplay || "" }}
                        />
                        {contentToDisplay && article.truncated && (
                            <p className="text-gray-700 mt-2">........</p>
                        )}
                        <button
                            onClick={() => setShowSubscriptionPopup(true)}
                            className="text-white px-8 py-3 rounded-lg text-xl font-bold bg-red-600 mt-4"
                        >
                            Read More!
                        </button>
                        {accessDeniedByLimit && (
                            <p className="text-sm text-red-600 mt-4 font-bold">{error}</p>
                        )}
                    </div>
                ) : (
                    <article className="prose prose-lg max-w-none text-gray-800">
                        <style>
                            {`
                                .rich-content a {
                                    color: inherit;
                                    text-decoration: none;
                                }
                            `}
                        </style>
                        <div
                            className="rich-content text-justify text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: contentToDisplay || "" }}
                        />
                    </article>
                )}
                <div className="text-center mt-10">
                    <Link to="/premiumarticles" className="text-yellow-600 hover:underline text-lg">
                        &larr; Back to Premium Articles
                    </Link>
                </div>
            </div>
            {showSubscriptionPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
                    <div className="w-11/12 max-w-md p-6 bg-white rounded-lg shadow-xl md:w-3/4">
                        <h2 className="text-2xl font-bold text-gray-900">Free View Limit Exceeded</h2>
                        <p className="mt-4 text-gray-700">
                            You've read your free preview of this article. To continue reading and unlock unlimited access to all premium content, please subscribe.
                        </p>
                        <div className="flex flex-col gap-4 mt-6 sm:flex-row sm:justify-end">
                            <button
                                onClick={() => setShowSubscriptionPopup(false)}
                                className="px-6 py-2 font-semibold text-gray-700 transition duration-200 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Close
                            </button>
                            <Link
                                to="/subscriptions"
                                className="px-6 py-2 text-center font-bold text-white transition duration-200 bg-red-600 rounded-lg hover:bg-red-700"
                                onClick={() => setShowSubscriptionPopup(false)}
                            >
                                Subscribe
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function fetchBookmarkStatus() {
    throw new Error('Function not implemented.');
}
