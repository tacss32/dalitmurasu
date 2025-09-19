
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

const API_BASE_URL = import.meta.env.VITE_API;

// --- Category Mapping for Tamil Display ---
const categoryInTamil: { [key: string]: string } = {
  'Premium Articles': 'முதன்மைக் கட்டுரைகள்',
};

// --- Type Definition for a Premium Post (User View) ---
interface IPremiumPost {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  author: string;
  category: string;
  images: string[];
  isHome: boolean;
  isRecent: boolean;
  visibility: 'public' | 'subscribers';
  views: number;
  freeViewLimit: number;
  date: string;
  publicationSource?: string;
  publicationDateInfo?: string;
  uniqueIdentifier?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PremiumArticlePage() {
  const [premiumArticles, setPremiumArticles] = useState<IPremiumPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPremiumArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        const clientToken = localStorage.getItem('clientToken');
        const headers = clientToken ? { Authorization: `Bearer ${clientToken}` } : {};

        const response = await axios.get<IPremiumPost[]>(
          `${API_BASE_URL}api/premium-posts`,
          { headers }
        );
        setPremiumArticles(response.data);
      } catch (err) {
        console.error('Failed to fetch premium articles:', err);
        setError('Failed to load premium articles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPremiumArticles();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-highlight-1">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-highlight-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <p className="text-xl">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <Header text="முதன்மைக் கட்டுரைகள்" urlPath='premiumarticles' />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center"></h1>
        {premiumArticles.length === 0 ? (
          <p className="text-center text-gray-400 text-lg">
            No premium articles available at the moment.
          </p>
        ) : (
          <>
            {/* Desktop Grid View */}
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumArticles.map((article) => {
                const hasImage = article.images && article.images.length > 0;
                if (!hasImage) {
                  return (
                    <Link
                      key={article._id}
                      to={`/premium-articles/${article._id}`}
                      className="bg-gradient-to-br from-red-300 via-red-500 to-red-500 text-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full"
                    >
                      <div className="flex-grow">
                        <h3 className="text-2xl font-bold mb-3">{article.title}</h3>
                        {article.subtitle && (
                          <p className="text-lg mb-6 text-indigo-100 italic line-clamp-3">
                            "{article.subtitle}"
                          </p>
                        )}
                      </div>
                      <div className="mt-auto pt-4 border-t border-white/20 text-sm line-clamp-3">
                        <div className="font-semibold text-white/90">
                          {article.author}
                        </div>
                        <div className="text-white/80">
                          {categoryInTamil[article.category] || article.category}
                          <span className="mx-2">•</span>
                          {new Date(article.date).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  );
                }
                return (
                  <Link
                    key={article._id}
                    to={`/premium-articles/${article._id}`}
                    className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform overflow-hidden group relative pb-[100%]"
                  >
                    <div className="absolute inset-0">
                      <img
                        src={article.images[0]}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-filter backdrop-blur-sm bg-white/25 text-white">
                        <h3 className="text-xl font-extrabold text-white mb-1 leading-tight">
                          {article.title}
                        </h3>
                        <h3 className="text-1xl font-extrabold text-white mb-1 leading-tight">
                          {article.subtitle}
                        </h3>
                        <p className="text-sm text-gray-200 font-medium">
                          {new Date(article.date).toLocaleDateString()}
                          <span className="mx-2 text-gray-300">•</span>
                          {categoryInTamil[article.category] || article.category}
                          <span className="mx-2 text-gray-300">•</span>
                          {article.author}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile List View */}
            <div className="block md:hidden  flex-col gap-3">
              {premiumArticles.map((article) => (
                <Link
                  to={`/premium-articles/${article._id}`}
                  key={article._id}
                >
                  <div className="w-full flex gap-4 p-2 rounded shadow-lg bg-white/80 hover:bg-white/50 duration-150 transition-colors ease-in-out">
                    {/* Image Section */}
                    {article?.images?.[0] && (
                      <div className="flex-shrink-0 w-24 h-24">
                        <img
                          src={article.images[0]}
                          alt={article.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    {/* Text Secion */}
                    <div className="flex flex-col justify-center">
                      <h2 className="text-lg font-bold text-gray-900">
                        {article.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {new Date(article.date).toLocaleDateString()}   {categoryInTamil[article.category] || article.category}
                      </p>
                      <p className="text-sm text-gray-500">
                        
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}