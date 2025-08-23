import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface Category {
  _id: string;
  name: {
    en: string;
    ta: string;
  };
  order?: number;
}

export default function Header({
  text,
  urlPath,
}: {
  text?: string;
  urlPath?: string;
}) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const normalize = (str: string) => str.toLowerCase().replace(/[\s\-/]+/g, "");

  const { categorySlug } = useParams<{ categorySlug?: string }>();

  const handleSignOut = () => {
    localStorage.removeItem("clientToken");
    localStorage.removeItem("userId");
    toast.success("You have been signed out successfully!");
    setIsDropdownOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isLoggedIn = !!localStorage.getItem("clientToken");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API}api/categories`);
        if (!res.ok) {
          throw new Error(`Failed to fetch categories: ${res.status}`);
        }
        const data: Category[] = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const banner = urlPath ? urlPath : categorySlug;
        const res = await fetch(
          `${import.meta.env.VITE_API}api/post_header?category=${banner}`
        );
        const data = await res.json();
        if (res.ok && data && data.banner) {
          setBannerUrl(data.banner);
        } else {
          console.error("Failed to fetch banner or banner URL missing:", data);
        }
      } catch (err) {
        console.error("Error fetching banner:", err);
      }
    };
    fetchBanner();
  }, [categorySlug, urlPath]);

  const currentCategory = categorySlug
    ? categories.find((cat) => normalize(cat.name.en) === categorySlug)
    : null;

  let headerText = "தலித் முரசு";

  if (text) {
    headerText = text;
  } else if (!loadingCategories) {
    if (currentCategory) {
      headerText = currentCategory.name.ta;
    } else if (categorySlug && !currentCategory) {
      headerText = "Category Not Found";
    }
  }

  return (
    <div className="relative w-full">
      {/* Banner Image */}
      <img
        src={bannerUrl ? bannerUrl : "/headerImg.jpg"}
        alt="Header Banner"
        className="w-full h-auto rounded-lg object-cover"
      />

      {/* Overlay Container */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-white">
        {/* Profile Dropdown */}
        <div className="absolute top-4 right-4 z-50">
          {isLoggedIn && (
            <div className="relative" ref={dropdownRef}>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Edit Profile
                  </Link>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Header Text */}
        <h1 className="text-4xl font-bold drop-shadow-md">
          <span>{headerText}</span>
        </h1>
      </div>
    </div>
  );
}
