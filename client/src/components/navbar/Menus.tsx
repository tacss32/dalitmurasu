import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";


// Interface for a Book (needed for CartItem type)
interface Book {
  _id: string;
  name: string;
  author: string;
  actualPrice: number;
  sellingPrice: number;
  image: string;
}

// Interface for a Cart Item fetched from the API (populated with book details)
interface CartItem {
  _id: string; // Cart item ID
  userId: string;
  bookId: Book; // 'bookId' is populated with the full Book object from the backend
  quantity: number;
}

// Interface for a Notification (from backend, includes read and popup status)
interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean; // True if the logged-in user has read it
  popup: boolean; // NEW: Indicates if this notification was set to be a popup
}

// New interface for Category
interface Category {
  _id: string;
  name: { en: string; ta: string };
  isAvailable: boolean;
  isInBanner: boolean;
  setHeader: boolean;
}

interface CustomCategory {
  _id: string;
  name: { en: string; ta: string };
  isAvailable: boolean;
  isInBanner: boolean;
  setHeader: boolean;
}

// New props interface
interface MenusProps {
  isMobileHeader?: boolean;
  isMobileMenu?: boolean;
  closeMobileMenu?: () => void;
}

const API = import.meta.env.VITE_API; // Your backend API URL

export default function Menus({ isMobileHeader = false, isMobileMenu = false,closeMobileMenu, }: MenusProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const customCategories: CustomCategory[] = [
    {
      _id: "archive",
      name: { en: "Archive", ta: "தலித் முரசு களஞ்சியம் " },
      isAvailable: true,
      isInBanner: false,
      setHeader: false
    },
    {
      _id: "shop",
      name: { en: "shop", ta: "அங்காடி" },
      isAvailable: true,
      isInBanner: false,
      setHeader: false
    },
  ];

  // States for notification dropdown functionality
  const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] =
    useState(false);
  const [userNotifications, setUserNotifications] = useState<Notification[]>(
    []
  );
  const [loadingUserNotifications, setLoadingUserNotifications] =
    useState(false);
  const [userNotificationError, setUserNotificationError] = useState<
    string | null
  >(null);

  // NEW: State for pop-up notification display
  const [showPopupNotification, setShowPopupNotification] =
    useState<boolean>(false);
  const [currentPopupNotification, setCurrentPopupNotification] =
    useState<Notification | null>(null);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // New state for search parameters
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchFromDate, setSearchFromDate] = useState("");
  const [searchToDate, setSearchToDate] = useState("");

  // NEW: State for categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLLIElement>(null);
  const profileDropdownRef = useRef<HTMLLIElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);

  // Logout function
  const handleLogout = async () => {
    const token = localStorage.getItem("clientToken");
    if (token) {
      try {
        await axios.post(
          `${API}api/auth/client/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.warn("Server logout failed (continuing locally):", err);
      }
    }
    localStorage.removeItem("clientToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");

    setIsAuthenticated(false);
    setCurrentUserId(null);
    setCurrentUserName(null);
    setCartItems([]);
    setUnreadNotificationCount(0);
    setUserNotifications([]);
    setShowPopupNotification(false);
    setCurrentPopupNotification(null);

    toast.info("You have been logged out.");
    navigate("/");
  };

  // Fetch user's cart
  const fetchCart = async (userId: string) => {
    if (!userId) {
      setCartItems([]);
      return;
    }
    try {
      const response = await axios.get<CartItem[]>(`${API}api/cart/${userId}`);
      setCartItems(response.data);
    } catch (err) {
      console.error("Failed to fetch cart in Menus:", err);
      setCartItems([]);
    }
  };

  // NEW: Function to fetch and process notifications (for badge and popup)
  const fetchAndProcessUserNotifications = useCallback(
    async (userName: string) => {
      if (!userName) {
        setUnreadNotificationCount(0);
        setUserNotifications([]);
        setCurrentPopupNotification(null);
        setShowPopupNotification(false);
        return;
      }
      setLoadingUserNotifications(true);
      setUserNotificationError(null);
      try {
        const res = await axios.get<{ success: boolean; data: Notification[] }>(
          `${API}api/notifications/${userName}`
        );
        const notifications = res.data.data;
        setUserNotifications(notifications); // Set detailed notifications for dropdown

        const unread = notifications.filter((notif) => !notif.read);
        setUnreadNotificationCount(unread.length);

        // Check for unread popup notifications
        const unreadPopups = unread.filter((notif) => notif.popup);
        if (unreadPopups.length > 0) {
          // Take the latest unread popup for display
          const latestPopup = unreadPopups.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          setCurrentPopupNotification(latestPopup);
          setShowPopupNotification(true);
        } else {
          setShowPopupNotification(false);
          setCurrentPopupNotification(null);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch user notifications:", err);
        if (axios.isAxiosError(err)) {
          setUserNotificationError(
            err.response?.data?.message || "Failed to fetch notifications"
          );
          toast.error(
            err.response?.data?.message || "Failed to fetch notifications"
          );
        } else {
          setUserNotificationError(
            "An unexpected error occurred while fetching notifications."
          );
          toast.error(
            "An unexpected error occurred while fetching notifications."
          );
        }
        setUnreadNotificationCount(0);
        setUserNotifications([]);
        setShowPopupNotification(false);
        setCurrentPopupNotification(null);
      } finally {
        setLoadingUserNotifications(false);
      }
    },
    [API]
  );

  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentUserName) {
      toast.error("Cannot mark as read: User not identified.");
      return;
    }
    setLoadingUserNotifications(true);
    setUserNotificationError(null);
    try {
      await axios.patch(`${API}api/notifications/mark-as-read`, {
        notificationId,
        userName: currentUserName,
      });
      toast.success("Notification marked as read!");
      fetchAndProcessUserNotifications(currentUserName);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setUserNotificationError(
          err.response?.data?.message || "Failed to mark as read"
        );
        toast.error(err.response?.data?.message || "Failed to mark as read");
      } else {
        setUserNotificationError(
          "An unexpected error occurred while marking as read."
        );
        toast.error("An unexpected error occurred while marking as read.");
      }
    } finally {
      setLoadingUserNotifications(false);
    }
  };

  // NEW: Handler to close the popup and mark it as read
  const handleClosePopup = async () => {
    if (currentPopupNotification) {
      await handleMarkAsRead(currentPopupNotification._id);
      setShowPopupNotification(false);
      setCurrentPopupNotification(null);
    }
  };

  // --- New Search Functionality ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchOpen(false);

    const queryParams = new URLSearchParams();
    if (searchKeyword) {
      queryParams.append("keyword", searchKeyword);
    }
    // Append category to URL only if it's not the default empty string
    if (searchCategory) {
      queryParams.append("category", searchCategory);
    }
    if (searchFromDate) {
      queryParams.append("from", searchFromDate);
    }
    if (searchToDate) {
      queryParams.append("to", searchToDate);
    }

    const queryString = queryParams.toString();
    navigate(`/search${queryString ? `?${queryString}` : ""}`);

    // Optionally reset search fields after navigation
    setSearchKeyword("");
    setSearchCategory("");
    setSearchFromDate("");
    setSearchToDate("");
  };

  const handleSearchToggle = () => {
    setIsSearchOpen((prev) => !prev);
    if (!isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  };
  // --- End New Search Functionality ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleSearchToggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
      if (
        isSearchOpen &&
        searchFormRef.current &&
        !searchFormRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('[aria-label="Open search"]')
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    const verifyAuthTokenAndSetUser = async () => {
      const existingToken = localStorage.getItem("clientToken");
      const storedUserId = localStorage.getItem("userId");
      const storedUserName = localStorage.getItem("userName");

      let verifiedUserName: string | null = null;
      let verifiedUserId: string | null = null;

      if (existingToken) {
        try {
          const res = await axios.post(
            `${API}api/auth/client/verify-token`,
            {},
            {
              headers: { Authorization: `Bearer ${existingToken}` },
            }
          );
          if (res.data.isValid) {
            setIsAuthenticated(true);
            verifiedUserId = res.data.userId || storedUserId || null;
            verifiedUserName = res.data.user?.name || storedUserName || null;
          } else {
            setIsAuthenticated(false);
            verifiedUserId = null;
            verifiedUserName = null;
            localStorage.removeItem("clientToken");
            localStorage.removeItem("userId");
            localStorage.removeItem("userName");
          }
        } catch (err) {
          setIsAuthenticated(false);
          verifiedUserId = null;
          verifiedUserName = null;
          localStorage.removeItem("clientToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("userName");
        }
      } else {
        setIsAuthenticated(false);
        verifiedUserId = null;
        verifiedUserName = null;
      }
      setCurrentUserId(verifiedUserId);
      setCurrentUserName(verifiedUserName);
    };

    verifyAuthTokenAndSetUser();
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [API, isSearchOpen, handleSearchToggle]);

  useEffect(() => {
    if (currentUserId) {
      fetchCart(currentUserId);
    } else {
      setCartItems([]);
    }
  }, [currentUserId]);

  // Updated useEffect to use the new fetchAndProcessUserNotifications
  useEffect(() => {
    if (currentUserName) {
      fetchAndProcessUserNotifications(currentUserName);
    } else {
      setUnreadNotificationCount(0);
      setUserNotifications([]);
      setShowPopupNotification(false);
      setCurrentPopupNotification(null);
    }
  }, [currentUserName, fetchAndProcessUserNotifications]);

  // NEW: Fetch all available categories for the search dropdown on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await axios.get<Category[]>(`${API}api/categories`);
        // Filter to only show categories that are marked as available
        const fetchedCategories = response.data.filter((cat) => cat.isAvailable);

        // Combine fetched categories with custom categories
        const allCategories = [...fetchedCategories, ...customCategories];
        setCategories(allCategories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories(customCategories); // Fallback to custom categories on error
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [API]);

  const handleNotificationIconClick = () => {
    if (!currentUserName) {
      toast.error("Please log in to view notifications.");
      setIsNotificationsDropdownOpen(false);
      return;
    }
    const newDropdownState = !isNotificationsDropdownOpen;
    setIsNotificationsDropdownOpen(newDropdownState);
    if (newDropdownState) fetchAndProcessUserNotifications(currentUserName);
  };
    const authenticatedNavItems = [
    {
      href: "/bookmarks",
      label: "Bookmarks",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
        />
      ),
    },
  ];

  const handleLoginClick = () => {
    navigate("/login");
  };

  const totalCartItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Conditional rendering based on props


  if (isMobileHeader) {
    return (
      <ul className="flex items-center gap-3">
        {/* Search */}
        <li className="relative transition-all duration-150 ease-in-out group">
          {isSearchOpen && (
            <div
              className="fixed inset-0 z-[9999] flex justify-center items-start pt-20 sm:pt-24 md:pt-28 "
              onClick={(e) => {
                // Close the search bar if the user clicks the backdrop.
                if (e.target === e.currentTarget) {
                  setIsSearchOpen(false);
                }
              }}
            >
              <form
                onSubmit={handleSearch}
                className="w-full max-w-sm mx-4 border border-gray-300 rounded-md shadow-lg p-4 flex flex-col gap-2"
                style={{ backgroundColor: "#FEEBB8" }}
                ref={searchFormRef}
              >
                <input
                  type="text"
                  ref={searchInputRef}
                  placeholder="Search keyword (title, content, author)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  autoFocus
                />
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  style={{ backgroundColor: "#FEEBB8" }}
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories ? "Loading categories..." : "All Categories"}
                  </option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name.en}>
                      {category.name.ta}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="date"
                    placeholder="From Date"
                    title="From Date"
                    className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={searchFromDate}
                    onChange={(e) => setSearchFromDate(e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="To Date"
                    title="To Date"
                    className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={searchToDate}
                    onChange={(e) => setSearchToDate(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-black-700 transition-colors duration-200"
                >
                  Search
                </button>
              </form>
            </div>
          )}
          <button
            onClick={handleSearchToggle}
            aria-label="Open search"
            className="relative flex items-center justify-center group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              Search (Ctrl+K)
            </span>
          </button>
        </li>
        {/* Cart */}
        <li className="relative group">
          <Link
            to="/cart"
            className="relative flex items-center justify-center p-2 hover:text-highlight-1 transition-colors duration-150"
            aria-label="View Cart"
          >
            <ShoppingCart className="h-6 w-6 stroke-[2.2] text-gray-800" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 rounded-full shadow-sm w-3 h-3"></span>
            )}
            <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
              View Cart
            </span>
          </Link>
        </li>
        {/* Bookmarks */}
          {authenticatedNavItems.map(({  label, icon }, index) => (
            <li
              key={index}
              className="relative hover:text-highlight-1 transition-colors duration-150 ease-in-out group"
            >
              <Link
                to="/bookmarks"
                aria-label={label}
                className="relative flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-6"
                >
                  {icon}
                </svg>
                <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  {label}
                </span>
              </Link>
            </li>
          ))}
        {/* Notifications */}
        <li className="relative" ref={dropdownRef}>
          <button
            onClick={handleNotificationIconClick}
            aria-label="View Notifications"
            className="relative flex items-center justify-center p-2 hover:text-highlight-1 transition-colors duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-[6px] py-[1px] rounded-full shadow-sm min-w-[18px] text-center">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
            <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              Notifications
            </span>
          </button>
          {isNotificationsDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{ maxHeight: "400px" }}
            >
              <h3 className="text-lg font-semibold px-4 py-3 bg-blue-50 text-gray-800 border-b border-gray-200 sticky top-0 z-10">
                Your Notifications
              </h3>
              <div
                className="p-4 overflow-y-auto"
                style={{ maxHeight: "calc(400px - 50px)" }}
              >
                {loadingUserNotifications ? (
                  <p className="text-center text-blue-600">Loading notifications...</p>
                ) : userNotificationError ? (
                  <p className="text-center text-red-600">Error: {userNotificationError}</p>
                ) : userNotifications.length === 0 ? (
                  <p className="text-center text-gray-600">No notifications yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {userNotifications.map((notif) => (
                      <li
                        key={notif._id}
                        className={`p-3 rounded-md ${notif.read ? "bg-gray-50 text-gray-700" : "bg-blue-100 text-gray-900 font-medium"
                          }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-bold text-base">{notif.title}</div>
                          <div className="flex items-center gap-2">
                            {notif.popup && (
                              <span className="bg-purple-200 text-purple-800 text-xs px-2 py-0.5 rounded-full">Popup</span>
                            )}
                            {notif.read ? (
                              <span className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full">Read</span>
                            ) : (
                              <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full">Unread</span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm leading-snug">{notif.message}</p>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                          <span>{new Date(notif.createdAt).toLocaleString()}</span>
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkAsRead(notif._id)}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Mark as Read
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </li>
        {/* NEW: Popup Notification Modal */}
        {showPopupNotification && currentPopupNotification && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] backdrop-filter backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-notification-title">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full relative transform transition-all duration-300 scale-100 opacity-100 animate-fade-in-up">
              <h3 id="popup-notification-title" className="text-xl font-bold text-gray-900 mb-3">{currentPopupNotification.title}</h3>
              <p className="text-gray-700 mb-4">{currentPopupNotification.message}</p>
              <div className="text-xs text-gray-500 mb-4">
                Received: {new Date(currentPopupNotification.createdAt).toLocaleString()}
              </div>
              <button
                onClick={handleClosePopup}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
              >
                Got it! (Mark as Read)
              </button>
            </div>
          </div>
        )}
      </ul>
    );
  }

if (isMobileMenu) {
  return (
    <ul className="flex items-center gap-3 ml-auto flex-row-reverse">
      {isAuthenticated ? (
        <>
          {/* Profile Icon with Dropdown */}
          <li className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="relative flex items-center justify-center p-2 hover:text-highlight-1 transition-colors duration-150"
              aria-label="Profile Menu"
              aria-expanded={isProfileDropdownOpen ? "true" : "false"}
              aria-haspopup="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                Profile
              </span>
            </button>

            {isProfileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-[9999] overflow-hidden"
                style={{ backgroundColor: "#FEEBB8" }}
              >
                <Link
                  to="/profile"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    if (closeMobileMenu) closeMobileMenu();
                  }}
                  className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  My Profile
                </Link>
                <Link
                  to="/orders"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    if (closeMobileMenu) closeMobileMenu();
                  }}
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                >
                  My Orders
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsProfileDropdownOpen(false);
                    if (closeMobileMenu) closeMobileMenu();
                  }}
                  className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Sign Out
                </button>
  </div>
)}
            </li>
            
          </>
        ) : (
          <li className="relative group">
            <button
              onClick={handleLoginClick}
              aria-label="Login"
              className="relative flex items-center justify-center p-2 hover:text-highlight-1 transition-colors duration-150"
            >
              <span className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-black-700 transition-colors duration-150">
                Login
              </span>
              <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                Login
              </span>
            </button>
          </li>
        )}
      </ul>
    );
  }

  return (
    <ul className="flex items-center gap-3 ml-auto">
      {/* Search */}
      <li className="relative transition-all duration-150 ease-in-out group">
        {isSearchOpen && (

          <form
            onSubmit={handleSearch}
            className="absolute top-full right-0 mt-2 w-72 md:w-96 border border-gray-300 rounded-md shadow-lg z-30 p-4 flex flex-col gap-2"
            style={{ backgroundColor: "#FEEBB8" }}
            ref={searchFormRef}
          >
            <input
              type="text"
              ref={searchInputRef}
              placeholder="Search keyword (title, content, author)"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              autoFocus
            />
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ backgroundColor: "#FEEBB8" }}
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              disabled={loadingCategories}
            >
              <option value="">
                {loadingCategories ? "Loading categories..." : "All Categories"}
              </option>
              {categories.map((category) => (
                <option key={category._id} value={category.name.en}>
                  {category.name.ta}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                placeholder="From Date"
                title="From Date"
                className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={searchFromDate}
                onChange={(e) => setSearchFromDate(e.target.value)}
              />
              <input
                type="date"
                placeholder="To Date"
                title="To Date"
                className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={searchToDate}
                onChange={(e) => setSearchToDate(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-black-700 transition-colors duration-200"
            >
              Search
            </button>
          </form>
        )}
        <button
          onClick={handleSearchToggle}
          aria-label="Open search"
          className="relative flex items-center justify-center group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            Search (Ctrl+K)
          </span>
        </button>
      </li>
      {isAuthenticated ? (
        <>
          {/* Cart */}
          <li className="relative group">
            <Link
              to="/cart"
              className="relative flex items-center justify-center p-2 hover:text-highlight-1 transition-colors duration-150"
              aria-label="View Cart"
            >
              <ShoppingCart className="h-6 w-6 stroke-[2.2] text-gray-800" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 rounded-full shadow-sm w-3 h-3"></span>
              )}
              <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                View Cart
              </span>
            </Link>
          </li>
          {/* Bookmarks */}
          {authenticatedNavItems.map(({  label, icon }, index) => (
            <li
              key={index}
              className="relative hover:text-highlight-1 transition-colors duration-150 ease-in-out group"
            >
              <Link
                to="/bookmarks"
                aria-label={label}
                className="relative flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-6"
                >
                  {icon}
                </svg>
                <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  {label}
                </span>
              </Link>
            </li>
          ))}
          
          {/* Profile Icon with Dropdown */}
          <li className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="relative flex items-center justify-center p-2 hover:text-highlight-1 transition-colors duration-150"
              aria-label="Profile Menu"
              aria-expanded={isProfileDropdownOpen ? "true" : "false"}
              aria-haspopup="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                Profile
              </span>
            </button>

             {isProfileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50"
                style={{ backgroundColor: "#FEEBB8" }}
              >
                <Link
                  to="/profile"
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                >
                  My Profile
                </Link>
                {/* NEW: My Orders Link */}
                <Link
                  to="/orders"
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                >
                  My Orders
                </Link>

                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsProfileDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </li>

          {/* Notifications */}
          <li className="relative" ref={dropdownRef}>
            <button
              onClick={handleNotificationIconClick}
              aria-label="View Notifications"
              className="relative flex items-center justify-center p-2 hover:text-highlight-1 transition-colors duration-150"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-[6px] py-[1px] rounded-full shadow-sm min-w-[18px] text-center">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              )}
              <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                Notifications
              </span>
            </button>
            {isNotificationsDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
                style={{ maxHeight: "400px" }}
              >
                <h3 className="text-lg font-semibold px-4 py-3 bg-blue-50 text-gray-800 border-b border-gray-200 sticky top-0 z-10">
                  Your Notifications
                </h3>
                <div
                  className="p-4 overflow-y-auto"
                  style={{ maxHeight: "calc(400px - 50px)" }}
                >
                  {loadingUserNotifications ? (
                    <p className="text-center text-blue-600">Loading notifications...</p>
                  ) : userNotificationError ? (
                    <p className="text-center text-red-600">Error: {userNotificationError}</p>
                  ) : userNotifications.length === 0 ? (
                    <p className="text-center text-gray-600">No notifications yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {userNotifications.map((notif) => (
                        <li
                          key={notif._id}
                          className={`p-3 rounded-md ${notif.read ? "bg-gray-50 text-gray-700" : "bg-blue-100 text-gray-900 font-medium"
                            }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-base">{notif.title}</div>
                            <div className="flex items-center gap-2">
                              {notif.popup && (
                                <span className="bg-purple-200 text-purple-800 text-xs px-2 py-0.5 rounded-full">Popup</span>
                              )}
                              {notif.read ? (
                                <span className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full">Read</span>
                              ) : (
                                <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full">Unread</span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm leading-snug">{notif.message}</p>
                          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                            <span>{new Date(notif.createdAt).toLocaleString()}</span>
                            {!notif.read && (
                              <button
                                onClick={() => handleMarkAsRead(notif._id)}
                                className="text-blue-600 hover:underline font-medium"
                              >
                                Mark as Read
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </li>
        </>
      ) : (
        <li className="relative group">
          <button
            onClick={handleLoginClick}
            aria-label="Login"
            className="relative flex items-center justify-center p-2 hover:text-highlight-1 transition-colors duration-150"
          >
            <span className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-black-700 transition-colors duration-150">
              Login
            </span>
            <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
              Login
            </span>
          </button>
        </li>
      )}
      {/* NEW: Popup Notification Modal */}
      {showPopupNotification && currentPopupNotification && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] backdrop-filter backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="popup-notification-title">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full relative transform transition-all duration-300 scale-100 opacity-100 animate-fade-in-up">
            <h3 id="popup-notification-title" className="text-xl font-bold text-gray-900 mb-3">{currentPopupNotification.title}</h3>
            <p className="text-gray-700 mb-4">{currentPopupNotification.message}</p>
            <div className="text-xs text-gray-500 mb-4">
              Received: {new Date(currentPopupNotification.createdAt).toLocaleString()}
            </div>
            <button
              onClick={handleClosePopup}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              Got it! (Mark as Read)
            </button>
          </div>
        </div>
      )}
    </ul>
  );
}