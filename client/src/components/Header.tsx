import { useEffect, useState, useRef } from "react"; // Import useRef
import { useParams, Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate
import { toast } from "react-toastify"; // Import toast for notifications

interface Category {
  _id: string;
  name: {
    en: string;
    ta: string;
  };
  order?: number;
}


// Accept 'text' as a prop
export default function Header({ text }: { text?: string }) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for dropdown area
  const navigate = useNavigate(); // For navigation

  // Helper function to normalize strings for comparison
  const normalize = (str: string) =>
    str.toLowerCase().replace(/[\s\-\/]+/g, "");

  // Get parameters from the URL
  const { categorySlug } = useParams<{ categorySlug?: string }>();

  // Function to handle user sign out
  const handleSignOut = () => {
    localStorage.removeItem("clientToken"); // Clear the token
    localStorage.removeItem("userId"); // Clear any stored user ID
    toast.success("You have been signed out successfully!");
    setIsDropdownOpen(false); // Close dropdown
    navigate("/login"); // Redirect to login page
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check if user is logged in (based on token presence)
  const isLoggedIn = !!localStorage.getItem("clientToken");


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API}api/categories`);
        if (!res.ok) {
          throw new Error(`Failed to fetch categories: ${res.status}`);
        }
        const data: Category[] = await res.json();

        setCategories(data); // Set the sorted categories
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
        const res = await fetch(
          `${import.meta.env.VITE_API}api/post_header?category=${categorySlug}`
        );
        const data = await res.json();
        if (res.ok && data && data.banner) {
          setBannerUrl(data.banner);
        } else {
          // Log an error if the response is not as expected
          console.error("Failed to fetch banner or banner URL missing:", data);
        }
      } catch (err) {
        console.error("Error fetching banner:", err);
      }
    };

    fetchBanner();
  }, [categorySlug]); // Re-fetch banner when categorySlug changes

  // Find the current category based on the URL parameter by normalizing the English name
  const currentCategory = categorySlug
    ? categories.find((cat) => normalize(cat.name.en) === categorySlug)
    : null;

  // Determine the text to display in the header
  let headerText = "தலித் முரசு"; // Default text when no category is specified or found

  if (text) {
    // If 'text' prop is provided, use it directly
    headerText = text;
  } else if (!loadingCategories) {
    // If 'text' prop is NOT provided, then proceed with category logic
    if (currentCategory) {
      headerText = currentCategory.name.ta; // Display Tamil name if category found
    } else if (categorySlug && !currentCategory) {
      // If categorySlug exists but no matching category was found
      headerText = "Category Not Found";
    }
  }

  // Determine the background image style
  const backgroundStyle = bannerUrl
    ? { backgroundImage: `url(${bannerUrl})` }
    : { backgroundImage: `url(/headerImg.jpg)` };

  return (
    <div
      className="bg-cover bg-no-repeat bg-center rounded-lg w-full"
      style={backgroundStyle}
    >
      <div className="bg-black/10 text-white h-96 w-full flex flex-col justify-center items-center">
        {/* Profile icon and dropdown moved to top-right corner relative to this container */}
        <div className="absolute top-4 right-4 z-50"> {/* Positioned absolutely */}
          {isLoggedIn && ( // Only render if isLoggedIn is true
            <div className="relative" ref={dropdownRef}>
              {/* <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                aria-expanded={isDropdownOpen ? 'true' : 'false'}
                aria-haspopup="true"
              >
                <ProfileIcon />
              </button> */}

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
                    to="/profile" // Link to the same profile page where editing is handled
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

        {/* Existing header text content */}
        <h1 className="text-4xl font-bold mt-52">
          <span>{headerText}</span>
        </h1>
      </div>
    </div>
  );
}