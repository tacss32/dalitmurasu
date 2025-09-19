
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Interface for banners, as it was in the original code
interface Banner {
  _id: string;
  mobileImage: string;
  desktopImage: string;
}

// Interface for categories, adapted from ManageCategories
interface Category {
  _id: string;
  name: {
    en: string;
    ta: string;
  };
  isEditable: boolean;
  isAvailable: boolean;
  isInBanner: boolean;
  order: number;
}

const API_BASE = import.meta.env.VITE_API;

export default function MainBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerCategories, setBannerCategories] = useState<Category[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Effect to fetch banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoadingBanners(true);
        const res = await axios.get<Banner[]>(`${API_BASE}api/banners`);
        if (res.data && res.data.length > 0) {
          setBanners(res.data);
          setCurrentIndex(0); // Reset index when new banners are fetched
        } else {
          setBanners([]);
        }
        setLoadingBanners(false);
      } catch (err) {
        console.error("Error fetching banners:", err);
        setError("Failed to load banners. Please try again later.");
        setLoadingBanners(false);
      }
    };

    fetchBanners();
  }, []);

  // Effect to fetch banner categories
  useEffect(() => {
    const fetchBannerCategories = async () => {
      try {
        setLoadingCategories(true);
        // Using the /api/categories?banner=true endpoint to get only 'isInBanner: true' categories
        const res = await axios.get<Category[]>(
          `${API_BASE}api/categories?banner=true`
        );
        setBannerCategories(res.data);
        setLoadingCategories(false);
      } catch (err) {
        console.error("Error fetching banner categories:", err);
        setError(
          "Failed to load categories for banner. Please try again later."
        );
        setLoadingCategories(false);
      }
    };

    fetchBannerCategories();
  }, []);

  // Effect for automatic banner sliding
  useEffect(() => {
    if (banners.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 5000); // 5-second interval

      return () => clearInterval(intervalId); // Cleanup on unmount or banners change
    }
  }, [banners]);

  // Determine overall loading state
  const isLoading = loadingBanners || loadingCategories;

  if (isLoading) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-xl shadow-lg bg-gray-200 flex items-center justify-center animate-pulse"
        style={{ minHeight: "450px" }}
      >
        <div className="flex flex-col items-center justify-center text-gray-600">
          <svg
            className="w-12 h-12 text-gray-400 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-3 text-lg">Loading Content...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-xl shadow-lg bg-red-100 flex items-center justify-center border border-red-300"
        style={{ minHeight: "200px" }}
      >
        <div className="flex items-center justify-center text-red-700 p-4">
          <span className="text-lg font-medium text-center">
            Error: {error}
          </span>
        </div>
      </div>
    );
  }

  if (banners.length === 0 && bannerCategories.length === 0) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-xl shadow-lg bg-gray-100 flex items-center justify-center border border-gray-300"
        style={{ minHeight: "200px" }}
      >
        <div className="flex items-center justify-center text-gray-500 p-4">
          <span className="text-lg text-center">No content available.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden md:rounded-xl shadow-lg">
      <div className="relative">
        {banners.map((banner, index) => (
          <picture
            key={banner._id}
            className={`w-full transition-opacity duration-1000 ease-in-out ${index === currentIndex
              ? "opacity-100"
              : "opacity-0 absolute top-0 left-0"
              }`}
          >
            <source media="(max-width: 768px)" srcSet={banner.mobileImage} />
            <img
              src={banner.desktopImage}
              alt={`Banner ${index + 1}`}
              className="w-full h-[450px] md:h-[750px] object-cover object-center"
            />
          </picture>
        ))}
      </div>

      <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none"></div>

      <div className="absolute bottom-10 right-6 md:bottom-10 md:right-10 flex flex-col space-y-4 z-20">
        {/* Render buttons based on fetched banner categories */}
        {[...bannerCategories].reverse().map((cat) => (
          <button
            key={cat._id}
            onClick={() =>
              navigate(`/${cat.name.en.toLowerCase().replace(/\s/g, "")}`)
            }
            className="px-2 py-1 text-sm md:px-8 lg:px-10 lg:py-4 md:text-2xl text-white font-semibold rounded-lg bg-highlight-1/85 hover:bg-black/85 transition-colors duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            {cat.name.ta}
          </button>
        ))}
      </div>

      {/* Navigation Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex
                ? "bg-highlight-1 scale-125"
                : "bg-gray-300 hover:bg-highlight-1"
                }`}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
}