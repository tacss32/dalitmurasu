import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
 
interface GalleryImage {
  _id: string;
  title: string;
  imageUrl: string;
  createdAt: string; // Using createdAt from backend timestamps
  updatedAt: string;
}
 
interface GroupedImages {
  [monthYear: string]: GalleryImage[];
}
 
const API_BASE_URL = import.meta.env.VITE_API;
 
function GalleryPage() {
  const navigate = useNavigate();
 
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
 
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}api/gallery`);
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }
        const data: GalleryImage[] = await res.json();
        setImages(data || []);
      } catch (err) {
        console.error("Error fetching gallery:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };
 
    fetchImages();
  }, []);
 
  // Function to group images by month and year
  const groupImagesByMonth = (allImages: GalleryImage[]): GroupedImages => {
    const grouped: GroupedImages = {};
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
 
    allImages.forEach((img) => {
      // Use img.createdAt as the timestamp
      const date = new Date(img.createdAt);
      if (isNaN(date.getTime())) { // Basic check for invalid date
        console.warn(`Skipping image with invalid createdAt: ${img._id}, createdAt: ${img.createdAt}`);
        return; // Skip this image if createdAt is invalid
      }
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const monthYear = `${month} ${year}`;
 
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(img);
    });
 
    // Sort months in descending order (most recent first)
    const sortedGrouped: GroupedImages = {};
    Object.keys(grouped).sort((a, b) => {
      const [monthA, yearA] = a.split(" ");
      const [monthB, yearB] = b.split(" ");
      // Create a comparable date for sorting month-year strings
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateB.getTime() - dateA.getTime(); // Descending order
    }).forEach(key => {
      // Sort images within each month by createdAt timestamp (descending)
      grouped[key].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      sortedGrouped[key] = grouped[key];
    });
 
    return sortedGrouped;
  };
 
  const groupedImages = groupImagesByMonth(images);
 
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-highlight-1">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-highlight-2"></div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 text-red-600">
        <p className="text-xl text-center">
          Error: {error}
          <br />
          Please try refreshing the page.
        </p>
      </div>
    );
  }
 
  return (
    <div
      className="min-h-screen text-highlight-1"
      style={{ fontFamily: '"Times New Roman", serif' }}
    >
      <h1
        className="text-2xl lg:text-4xl font-bold text-center mb-6 px-2"
        style={{ fontFamily: '"Times New Roman", serif' }}
      >
        கருநீலச் சிந்தனைகள்
      </h1>
 
      {Object.keys(groupedImages).length > 0 ? (
        <div className="max-w-6xl mx-auto px-4">
          {Object.keys(groupedImages).map((monthYear) => (
            <div key={monthYear} className="mb-10">
              <h2
                className="text-xl lg:text-2xl font-bold text-highlight-2 mb-6 px-2 ml-25"
                style={{ fontFamily: '"Times New Roman", serif' }}
              >
                {monthYear}
              </h2>
 
              {/*
                KEY CHANGE: This is where we make the grid responsive
                - grid-cols-2 for mobile
                - sm:grid-cols-3 for tablet and larger
                - lg:grid-cols-3 is redundant, but kept for clarity on desktop
                - gap-1 is for mobile, md:gap-2 is for tablets and desktop
              */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-1 md:gap-2 max-w-4xl mx-auto auto-rows-fr">
                {groupedImages[monthYear].map((img, index) => {
                  // Calculate the pattern for desktop view only
                  const pattern = index % 6;
                  const isLarge = pattern === 0 || pattern === 4;
 
                  return (
                    <div
                      key={img._id}
                      className={`relative overflow-hidden group bg-gray-200 rounded-lg shadow-md
                        /* All images are square on mobile/tablet */
                        aspect-square
                        /* Apply the special layout only on large screens */
                        ${isLarge ? "lg:col-span-2 lg:row-span-2" : "lg:col-span-1 lg:row-span-1"}
                      `}
                    >
                      <img
                        src={img.imageUrl}
                        alt={img.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 z-10 rounded-lg"
                      />
 
                      <div
                        onClick={() => navigate(`/bluethoughts/${img._id}`)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 z-20 cursor-pointer rounded-lg"
                      >
                        <p
                          className={`text-white text-center px-2 font-medium text-xs sm:text-sm `}
                        >
                          {img.title}
                        </p>
                      </div>
 
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400">
          The gallery is currently empty.
        </p>
      )}
    </div>
  );
}
 
export default GalleryPage;