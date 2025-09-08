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
      // Don't fetch if we don't have a category identifier
      const bannerCategory = urlPath ? urlPath : categorySlug;
      if (!bannerCategory) return;

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
          setBannerData(null); // Reset if no banner is found
          console.log("No banner found for this category or missing image URL:", data);
        }
      } catch (err) {
        console.error("Error fetching banner:", err);
        setBannerData(null);
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

  // Use the mobile image as a fallback for the desktop image and vice versa
  const desktopSrc = bannerData?.desktopImage || bannerData?.mobileImage;
  const mobileSrc = bannerData?.mobileImage || bannerData?.desktopImage;
  const fallbackSrc = "/headerImg.jpg";

  return (
    <div className="relative w-full">
      {/* Banner Image using <picture> for responsiveness */}
      <picture>
        {/* Mobile source: shown on screens smaller than 768px */}
        {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
        
        {/* Desktop source: shown on screens 768px and wider */}
        {desktopSrc && <source media="(min-width: 768px)" srcSet={desktopSrc} />}

        {/* Fallback image if no banner is found or for browsers that don't support <picture> */}
        <img
          src={desktopSrc || fallbackSrc}
          alt="Header Banner"
          className="w-full h-auto rounded-lg object-cover"
        />
      </picture>


      <h1 className="text-lg md:text-4xl font-bold drop-shadow-md absolute inset-0 flex flex-col justify-end items-center text-white bottom-12">
        <span>{headerText}</span>
      </h1>
    </div>
  );
}
