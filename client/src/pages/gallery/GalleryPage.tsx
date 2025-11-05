import { useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
// Import the icon for the up arrow. I'll use a simple SVG for this example.
// If you are using a library like 'react-icons', you would import it here, e.g.,
// import { FaArrowUp } from "react-icons/fa";

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
    // 1. State for the scroll-to-top button visibility
    const [isVisible, setIsVisible] = useState(false);

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

    // Function to group images by month and year (kept as is)
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

    // 2. Function to handle scrolling to top
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // 3. Effect to manage the visibility of the scroll-to-top button
    useEffect(() => {
        // Define a function to check scroll position
        const toggleVisibility = () => {
            if (window.scrollY > 300) { // Show button if scrolled down 300px
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        // Add the event listener to the window
        window.addEventListener("scroll", toggleVisibility);

        // Clean up the event listener when the component unmounts
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []); // Empty dependency array ensures this runs once after mount

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
            className="min-h-screen text-highlight-1 relative" // Added 'relative' for the button positioning
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
                                className="
    text-xl lg:text-2xl font-bold text-highlight-2 mb-6 px-2
    text-left lg:ml-27
    "
                                style={{ fontFamily: '"Times New Roman", serif' }}
                            >
                                {monthYear}
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-1 md:gap-2 max-w-4xl mx-auto auto-rows-fr">
                                {groupedImages[monthYear].map((img, index) => {
                                    const pattern = index % 6;
                                    const isLarge = pattern === 0 || pattern === 4;

                                    return (
                                        <div
                                            key={img._id}
                                            className={`relative overflow-hidden group bg-gray-200 rounded-lg shadow-md
    aspect-square
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

            {/* 4. Scroll to Top Button */}
            <button
                onClick={scrollToTop}
                className={`
                    fixed bottom-4 right-6 p-3 rounded-full shadow-lg z-50
                    bg-highlight-1 text-white
                    hover:bg-highlight-1/80 transition-opacity duration-300
                    ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}
                `}
                aria-label="Scroll to top"
                title="Scroll to top"
            >
                {/* Up Arrow Icon (SVG for minimal dependency) */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                </svg>
                {/* If you use an icon library, replace the SVG with:
                <FaArrowUp className="h-6 w-6" />
                */}
            </button>
        </div>
    );
}

export default GalleryPage;