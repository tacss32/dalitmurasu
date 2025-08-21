import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom'; // Import Link for navigation to individual posts
import axios from 'axios';
import { toast } from 'react-toastify'; // For user feedback

interface UniversalPost {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  author: string;
  category: string;
  createdAt: string;
  // Add any other fields from your UniversalPost model that you want to display
}

// Assuming your API base URL is defined in .env and accessed via import.meta.env.VITE_API
const API = import.meta.env.VITE_API;

export default function SearchResultsPage() {
  const location = useLocation(); // Hook to access URL information
  const [results, setResults] = useState<UniversalPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      setError(null);
      setResults([]); // Clear previous results

      const queryParams = new URLSearchParams(location.search);
      const keyword = queryParams.get('keyword');
      const category = queryParams.get('category');
      const from = queryParams.get('from');
      const to = queryParams.get('to');

      // Check if any search parameters are provided
      if (!keyword && !category && !from && !to) {
        setLoading(false);
        setError("Please enter a search keyword, category, or date range.");
        toast.info("Please provide search criteria.");
        return;
      }

      try {
        // Construct the query object for axios params
        const searchQueryParams: { [key: string]: string } = {};
        if (keyword) searchQueryParams.keyword = keyword;
        if (category) searchQueryParams.category = category;
        if (from) searchQueryParams.from = from;
        if (to) searchQueryParams.to = to;

        const response = await axios.get(`${API}api/search`, {
          params: searchQueryParams // Pass parameters to your backend
        });

        // The backend `searchController.js` returns { universalPosts: results }
        setResults(response.data.universalPosts);
        if (response.data.universalPosts.length === 0) {
          toast.info("No results found for your search criteria.");
        }

      } catch (err) {
        console.error("Failed to fetch search results:", err);
        setError("Failed to fetch search results. Please try again.");
        toast.error("Error fetching search results.");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [location.search, API]); // Dependency array: re-run effect when URL query params change

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Search Results</h1>

      {loading && (
        <p className="text-center text-blue-600 text-lg">Loading results...</p>
      )}

      {error && (
        <p className="text-center text-red-600 text-lg">Error: {error}</p>
      )}

      {!loading && !error && results.length === 0 && (
        <p className="text-center text-gray-600 text-lg">
          No posts found matching your search. Try different criteria.
        </p>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((post) => (
            <div key={post._id} className="rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">{post.title}</h2>
              {post.subtitle && <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-1">{post.subtitle}</p>}
              <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4">{post.content}</p>
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>By: {post.author}</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-red-600 dark:text-blue-400 text-sm mt-2">Category: {post.category}</p>
              <Link to={post.category === "Archive" ? `/archive?pdfId=${post._id}` : `/posts/${post._id}`} className="block text-center mt-4 bg-red-700 hover:bg-black text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                View More
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}