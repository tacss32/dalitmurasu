// client/src/pages/AdminSearchPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useLocation} from 'react-router-dom';
import axios from 'axios';
import { MdArticle, MdDateRange, MdCategory, MdSearch} from 'react-icons/md';
import { toast } from 'react-toastify';

// Define a type for your search result items (e.g., articles, posts)
interface UniversalPost {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  author: string;
  category: string;
  createdAt: string; // ISO date string
  // Add any other fields from your UniversalPost model that you want to display
}

const API_BASE_URL = import.meta.env.VITE_API;

export default function AdminSearchPage() {
  const location = useLocation();
  const [results, setResults] = useState<UniversalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const keyword = new URLSearchParams(location.search).get('keyword') || '';
  const category = new URLSearchParams(location.search).get('category') || '';
  const fromDate = new URLSearchParams(location.search).get('from') || '';
  const toDate = new URLSearchParams(location.search).get('to') || '';

  const fetchAdminSearchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    // Check if any search parameters are provided
    // This prevents unnecessary API calls with empty criteria
    if (!keyword && !category && !fromDate && !toDate) {
      setLoading(false);
      setError("Please enter a search keyword, category, or date range.");
      toast.info("Please provide search criteria for admin search.");
      return;
    }

    try {
      const searchQueryParams: { [key: string]: string } = {};
      if (keyword) searchQueryParams.keyword = keyword;
      if (category) searchQueryParams.category = category;
      if (fromDate) searchQueryParams.from = fromDate;
      if (toDate) searchQueryParams.to = toDate;

      // Make the API call to your existing public search endpoint
      const response = await axios.get(`${API_BASE_URL}api/search`, {
        params: searchQueryParams,
      });

      // *** IMPORTANT: Ensure your backend's searchController.js returns { universalPosts: [...] } ***
      // If it returns an array directly, use response.data
      // If it's nested as { universalPosts: results }, use response.data.universalPosts
      const fetchedPosts = response.data.universalPosts;

      if (Array.isArray(fetchedPosts)) { // Ensure it's an array
        setResults(fetchedPosts);
        if (fetchedPosts.length === 0) {
          toast.info("No results found for your admin search criteria.");
        } else {
          toast.success(`Found ${fetchedPosts.length} results.`);
        }
      } else {
        // Handle unexpected response format
        console.error("Backend response for search was not an array of universalPosts:", response.data);
        setError("Unexpected data format from search API.");
        toast.error("Error: Unexpected search results format.");
      }

    } catch (err: any) {
      console.error("Failed to fetch admin search results:", err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "Failed to fetch admin search results. Please try again.");
        toast.error(err.response.data.message || "Error fetching admin search results.");
      } else {
        setError("An unexpected error occurred while fetching admin search results.");
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, [keyword, category, fromDate, toDate, API_BASE_URL]);

  useEffect(() => {
    fetchAdminSearchResults();
  }, [fetchAdminSearchResults]);

  return (
    <div className="flex-1 p-6 bg-gray-800 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-yellow-400 flex items-center gap-3">
        <MdSearch className="text-4xl" /> Admin Search Results
      </h1>

      <div className="bg-gray-700 p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-200">Current Search Filters:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-gray-300">
          <p className="flex items-center gap-2"><span className="font-medium text-yellow-300">Keyword:</span> {keyword || 'N/A'}</p>
          <p className="flex items-center gap-2"><span className="font-medium text-yellow-300">Category:</span> {category || 'N/A'}</p>
          <p className="flex items-center gap-2"><span className="font-medium text-yellow-300">From Date:</span> {fromDate || 'N/A'}</p>
          <p className="flex items-center gap-2"><span className="font-medium text-yellow-300">To Date:</span> {toDate || 'N/A'}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-lg text-yellow-300">Loading admin search results...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500">
          <p className="text-lg">Error: {error}</p>
          <p>Please try again later.</p>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-xl">No admin posts found matching your search.</p>
          <p className="text-md mt-2">Try adjusting your search criteria in the sidebar.</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((post) => (
            <div key={post._id} className="bg-gray-700 rounded-lg shadow-md p-6 border border-gray-600 hover:shadow-xl transition-shadow duration-200">
              <h2 className="text-xl font-semibold text-yellow-300 mb-2 line-clamp-2">{post.title}</h2>
              {post.subtitle && <p className="text-gray-300 text-sm mb-2 line-clamp-1">{post.subtitle}</p>}
              <p className="text-gray-400 text-sm line-clamp-3 mb-4">{post.content}</p>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <MdCategory className="text-lg" />
                <span>Category: {post.category}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <MdArticle className="text-lg" />
                <span>Author: {post.author}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <MdDateRange className="text-lg" />
                <span>Published: {new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              {/* Link to admin edit page for the specific post */}
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
}