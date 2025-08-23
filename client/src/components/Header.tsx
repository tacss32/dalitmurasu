import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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

  const normalize = (str: string) =>
    str.toLowerCase().replace(/[\s\-\/]+/g, "");

  const { categorySlug } = useParams<{ categorySlug?: string }>();

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

      <h1 className="text-lg md:text-4xl font-bold drop-shadow-md absolute inset-0 flex flex-col justify-end items-center text-white bottom-12">
        <span>{headerText}</span>
      </h1>
    </div>
  );
}
