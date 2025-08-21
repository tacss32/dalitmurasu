import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

interface Category {
  _id: string;
  name: {
    en: string;
    ta: string;
  };
  order?: number;
}

const API_BASE_URL = import.meta.env.VITE_API;

export default function Tags() {
  const { t } = useTranslation();
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const normalize = (str: string) =>
    str.toLowerCase().replace(/[\s\-\/]+/g, "");

  // Hide dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}api/categories`);
        if (!res.ok) {
          throw new Error(`Failed to fetch categories: ${res.status}`);
        }
        const data: Category[] = await res.json();

        const sorted = data
          .filter((cat) => cat.name?.en && cat.name?.ta)
          .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

        setCategories(sorted);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const mainCategories = categories.slice(0, 4);
  const dropdownCategories = categories.slice(4);

  return (
    <div className="relative flex justify-center items-center max-w-full scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {loadingCategories ? (
        <span className="text-gray-600 text-sm animate-pulse">
          Loading categories...
        </span>
      ) : (
        <div className="flex items-center gap-3 py-2 min-w-max">
          
          {mainCategories.map((cat) => {
            const isActive = location.pathname === normalize(cat.name.en);
            return (
              <Link
                key={cat._id}
                to={normalize(cat.name.en)}
                className={`px-3 py-1 rounded-md text-lg font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? "text-highlight-1 font-bold"
                    : "text-black hover:text-highlight-1"
                }`}
              >
                {cat.name.ta}
              </Link>
            );
          })}

          {dropdownCategories.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="border-2 px-3 py-0.5 rounded-md font-medium text-black hover:text-highlight-1 transition-colors whitespace-nowrap"
              >
                {t("more")}
              </button>
              {showDropdown && (
                <div className="absolute left-0 mt-3 z-50 font-semibold bg-background-from shadow-md rounded-md w-48 max-h-80 overflow-y-auto">
                 
                  {dropdownCategories.map((cat) => {
                    const isActive =
                      location.pathname === normalize(cat.name.en);
                    return (
                      <Link
                        key={cat._id}
                        to={normalize(cat.name.en)}
                        onClick={() => setShowDropdown(false)}
                        className={`block px-4 py-3 text-sm ${
                          isActive
                            ? "text-highlight-1 font-semibold bg-background-to"
                            : "text-gray-800 hover:text-highlight-1 hover:bg-background-to"
                        }`}
                      >
                        {cat.name.ta}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
