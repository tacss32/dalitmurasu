import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

// Interface for a Category, from AddUniversalPost.tsx
type Category = {
  _id: string;
  name: {
    ta: string;
    en: string;
  };
};

const SERVER_URL = import.meta.env.VITE_API;

export default function Card({
  title,
  image,
  subtitle,
  date,
  author,
  category,
  id,
  source,
}: {
  title: string;
  image?: string;
  subtitle?: string;
  date: string;
  author: string;
  category: string;
  id: string;
  source?: "universal" | "premium-articles" | "pdf" | "posts" | "bookmarks";
}) {
  const [categories, setCategories] = useState<Category | undefined>();
  const [tamilCategory, setTamilCategory] = useState<string>("");

  const normalize = (str: string) =>
    str.toLowerCase().replace(/[\s\-\/]+/g, "");

  const fetchCategories = async () => {
    try {
      const categoriesRes = await axios.get<Category[]>(
        `${SERVER_URL}api/categories`
      );
      const foundCategory = categoriesRes.data.find(
        (cat) => normalize(cat.name.en) === normalize(category)
      );
      setCategories(foundCategory);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories) {
      setTamilCategory(categories.name.ta);
    }
  }, [categories]);

  const hasImage = !!image;

  const generateLink = () => {
    if (source === "pdf") {
      return `/pdf-viewer/${id}`;
    } else if (source === "premium-articles") {
      return `/premium-articles/${id}`;
    }
    return `/posts/${id}`;
  };

  // --- Conditionally hide date for bookmarks ---
  const showDate = source !== "bookmarks";

  if (!hasImage) {
    return (
      <Link
        to={generateLink()}
        className="bg-gradient-to-br from-red-300 via-red-500 to-red-500 text-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full"
      >
        <div className="flex-grow">
          <h3 className="text-2xl font-bold mb-3">{title}</h3>
          {subtitle && (
            <p className="text-lg mb-6 text-indigo-100 italic line-clamp-3">
              "{subtitle}"
            </p>
          )}
        </div>
        <div className="mt-auto pt-4 border-t border-white/20 text-sm line-clamp-3">
          <div className="font-semibold text-white/90">{author}</div>
          <div className="text-white/80">
            {tamilCategory}
            {showDate && (
              <>
                <span className="mx-2">•</span>
                {new Date(date).toLocaleDateString()}
              </>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={generateLink()}
      className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform overflow-hidden group relative pb-[100%]"
    >
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-filter backdrop-blur-sm bg-white/25 text-white">
          <h3 className="text-xl font-extrabold text-white mb-1 leading-tight">
            {title}
          </h3>
          {subtitle && (
            <h3 className="text-md font-semibold text-white mb-1 leading-tight">
              {subtitle}
            </h3>
          )}
          <p className="text-sm text-gray-200 font-medium">
            {showDate && (
              <>
                {new Date(date).toLocaleDateString()}
                <span className="mx-2 text-gray-300">•</span>
              </>
            )}
            {tamilCategory}
            <span className="mx-2 text-gray-300">•</span>
            {author}
          </p>
        </div>
      </div>
    </Link>
  );
}
