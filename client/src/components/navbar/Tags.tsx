// client\src\components\navbar\Tags.tsx
import { useEffect, useRef, useState } from "react";

import { Link, useLocation } from "react-router-dom";

interface Category {
  _id: string;
  name: {
    en: string;
    ta: string;
  };
  order?: number;
}

interface TagsProps {
  isMobileView?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API;

export default function Tags({ isMobileView = false }: TagsProps) {

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

  const allCategories = categories;
  const mainCategories = categories.slice(0, 4);
  const dropdownCategories = categories.slice(4);

  // Determine which list to render based on the view
  const categoriesToRender = isMobileView ? allCategories : mainCategories;
  
  return (
    // Conditionally apply classes to the main container
    <div className={`
        relative flex justify-center items-center max-w-full scrollbar-hide
        ${isMobileView ? "flex-col gap-2" : "gap-3"}
      `}>
      {loadingCategories ? (
        <span className="text-gray-600 text-sm animate-pulse">
          Loading categories...
        </span>
      ) : (
        // Conditionally apply classes to the inner container
        <div className={`flex items-center py-2 min-w-max 
          ${isMobileView ? "flex-col gap-2 items-stretch" : "gap-3"}`
        }>
          {categoriesToRender.map((cat) => {
            const isActive = location.pathname === normalize(cat.name.en);
            return (
              <Link
                key={cat._id}
                to={normalize(cat.name.en)}
                className={`px-3 py-1 rounded-md text-lg font-semibold transition-colors whitespace-nowrap
                  ${isActive
                    ? "text-highlight-1 font-bold"
                    : "text-black hover:text-highlight-1"
                  }
                  ${isMobileView ? "w-full text-center" : ""}
                `}
                onClick={() => isMobileView && window.scrollTo(0, 0)}
              >
                {cat.name.ta}
              </Link>
            );
          })}

          {/* This entire dropdown section will be rendered only if isMobileView is false */}
          {!isMobileView && dropdownCategories.length > 0 && (
            <div className={`relative ${isMobileView ? "w-full text-center" : ""}`} ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="border-2 px-3 py-0.5 rounded-md font-medium text-black hover:text-highlight-1 transition-colors whitespace-nowrap"
              >
                {("மேலும்")}
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