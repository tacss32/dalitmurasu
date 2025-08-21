import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { categoryData } from "../../context/banner";

export default function Banner() {
  const categories = Object.keys(categoryData);
  const defaultCategory = "பெரியார் பேசுகிறார்";
  const [activeCategory, setActiveCategory] = useState(defaultCategory);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCategory((prev) => {
        const currentIndex = categories.indexOf(prev);
        const nextIndex = (currentIndex + 1) % categories.length;
        return categories[nextIndex];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [categories]);

  const activeData = categoryData[activeCategory];

  return (
    <div className="relative w-full h-[450px] transition-all duration-150 ease-in-out">
      {/* Banner Image */}
      <img
        src={activeData.photo}
        alt="title image"
        className="w-full h-full object-cover z-0 rounded-lg"
      />

      {/* Overlay */}
      <div className="absolute inset-0 flex justify-between items-end p-6 text-white">
        {/* Left: Main Title Info */}
        <Link
          to={activeData.url}
          className="z-10 bg-black/70 p-4 rounded w-2/3"
        >
          <p className="text-sm uppercase text-highlight">{activeData.tag}</p>
          <h2 className="text-3xl font-bold">{activeData.title}</h2>
          <p className="text-sm mt-1">By {activeData.author}</p>
        </Link>

        {/* Right: Categories */}
        <div className="flex flex-col space-y-3 w-1/4 z-10">
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(cat)}
              className={`p-4 rounded transition text-left ${
                activeCategory === cat
                  ? "bg-highlight-1/80 font-semibold"
                  : "bg-black/80 hover:bg-opacity-80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
