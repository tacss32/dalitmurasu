// client\src\components\Header.tsx
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

interface BannerData {
  desktopImage?: string;
  mobileImage?: string;
}

export default function Header({
  text,
  urlPath,
}: {
  text?: string;
  urlPath?: string;
}) {
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  // ✨ NEW: State to track if the banner image is being loaded
  const [loadingBanner, setLoadingBanner] = useState(true);

  const normalize = (str: string) =>
    str.toLowerCase().replace(/[\s\-\/]+/g, "");

  const { categorySlug } = useParams<{ categorySlug?: string }>();

  // Effect to fetch categories (unchanged)
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

  // Effect to fetch banner data (Updated with loadingBanner state)
  useEffect(() => {
    const fetchBanner = async () => {
      const bannerCategory = urlPath ? urlPath : categorySlug;

      // Start loading before any logic/fetch
      setLoadingBanner(true);

      if (!bannerCategory) {
        // If there's no path/slug, stop loading immediately
        setLoadingBanner(false);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API}api/post_header?category=${bannerCategory}`
        );
        const data = await res.json();
        if (res.ok && (data.desktopImage || data.mobileImage)) {
          setBannerData({
            desktopImage: data.desktopImage,
            mobileImage: data.mobileImage,
          });
        } else {
          setBannerData(null);
        }
      } catch (err) {
        console.error("Error fetching banner:", err);
        setBannerData(null);
      } finally {
        // Ensure loading state is turned off after the fetch completes (success or failure)
        setLoadingBanner(false);
      }
    };

    fetchBanner();
  }, [categorySlug, urlPath]);

  // FIX: Normalize the categorSlug before comparing
  const normalizedCategorySlug = categorySlug ? normalize(categorySlug) : null;

  const currentCategory = normalizedCategorySlug
    ? categories.find((cat) => normalize(cat.name.en) === normalizedCategorySlug)
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

  const desktopSrc = bannerData?.desktopImage;
  const mobileSrc = bannerData?.mobileImage;
  const fallbackSrc = "/headerImg.jpg";

  // Conditionally render the image content
  if (loadingBanner) {
    
    return (
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        {/* Placeholder (adjust height/styling for better UX) */}
        <div className="w-screen h-[200px] md:h-[300px] bg-gray-200 animate-pulse"></div>
        <h1 className="text-3xl md:text-4xl font-bold drop-shadow-md absolute inset-0 flex flex-col justify-end items-center text-white bottom-12 opacity-0">
          <span>{headerText}</span>
        </h1>
      </div>
    );
  }

  return (
    <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <picture>
        {/* If mobileSrc is defined, use it for mobile */}
        {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}

        {/* If desktopSrc is defined, use it for desktop */}
        {desktopSrc && <source media="(min-width: 768px)" srcSet={desktopSrc} />}

       
        <img
          src={fallbackSrc}
          alt="Header Banner"
          className="w-screen h-auto object-cover"
        />
      </picture>

      <h1 className="text-3xl md:text-4xl font-bold drop-shadow-md absolute inset-0 flex flex-col justify-end items-center text-white bottom-12">
        <span>{headerText}</span>
      </h1>
    </div>
  );
}