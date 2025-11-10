import axios from "axios";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  MdStar,
  MdNotifications,
  MdVisibility,
  MdAttachMoney,
  MdSearch,
  MdAdd,
  MdAllInbox,
  MdArticle,
  MdCategory,
  MdImage,
  MdLogout,
  MdPhotoCamera,
  MdPictureAsPdf,
  MdMailOutline,
} from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Interface for Category
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
  isInBanner: false;
  setHeader: false;
}

// Hardcoded categories to be added to the dropdown
const customCategories: CustomCategory[] = [
  {
    _id: "archive",
    name: { en: "Archive", ta: "தலித் முரசு களஞ்சியம் " },
    isAvailable: true,
    isInBanner: false,
    setHeader: false,
  },
  {
    _id: "shop",
    name: { en: "shop", ta: "அங்காடி" },
    isAvailable: true,
    isInBanner: false,
    setHeader: false,
  },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API;

  // Ref for the closing timer (Crucial for smooth closing delay)
  const closeTimer = useRef<number | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchFromDate, setSearchFromDate] = useState("");
  const [searchToDate, setSearchToDate] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchIconsContainerRef = useRef<HTMLDivElement>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);

  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navSections = [
    {
      title: "News Head",
      icon: <MdArticle className="text-xl" />,
      mainLink: "/admin/news-title",
      subLinks: [],
    },
    {
      title: "Header Image",
      icon: <MdArticle className="text-xl" />,
      mainLink: "/admin/header-image",
      subLinks: [],
    },
    {
      title: "Banners",
      icon: <MdImage className="text-xl" />,
      mainLink: "/admin/banners",
      subLinks: [],
    },
    {
      title: "Categories",
      icon: <MdCategory className="text-xl" />,
      mainLink: "/admin/categories",
      subLinks: [],
    },
    {
      title: "Premium Articles",
      icon: <MdStar className="text-xl" />,
      mainLink: "/admin/premiumArticles-dashboard",
      subLinks: [
        {
          label: "Add New",
          href: "/admin/premium-articles/create",
          icon: <MdAdd />,
        },
        {
          label: "View All",
          href: "/admin/premium-articles",
          icon: <MdAllInbox />,
        },
        {
          label: "Premium Users",
          href: "/admin/subscription-plans/Premium-users",
          icon: <MdAllInbox />,
        },
      ],
    },
    {
      title: "Gallery",
      icon: <MdPhotoCamera className="text-xl" />,
      mainLink: "/admin/addphotos/upload",
      subLinks: [],
    },
    {
      title: "Cartoons",
      icon: <MdPhotoCamera className="text-xl" />,
      mainLink: "/admin/cartoons/upload",
      subLinks: [],
    },

    {
      title: "Newsletter Image",
      icon: <MdMailOutline className="text-xl" />,
      mainLink: "/admin/newsletter-image",
      subLinks: [],
    },
    {
      title: "Universal Posts",
      icon: <MdAllInbox className="text-xl" />,
      mainLink: "/admin/universal",
      subLinks: [
        { label: "Add New", href: "/admin/universal/create", icon: <MdAdd /> },
      ],
    },
    {
      title: "Pinned Posts",
      icon: <MdStar className="text-xl" />,
      mainLink: "/admin/GetAll-posts",
      subLinks: [
        { label: "All Posts", href: "/admin/GetAll-posts", icon: <MdStar /> },
        {
          label: "Pinned Posts",
          href: "/admin/pinned-posts",
          icon: <MdStar />,
        },
      ],
    },

    {
      title: "Books",
      icon: <MdArticle className="text-xl" />,
      mainLink: "/admin/books",
      subLinks: [],
    },
    {
      title: "PDF Uploads",
      icon: <MdPictureAsPdf className="text-xl" />,
      mainLink: "/admin/pdf-uploads",
      subLinks: [
        { label: "Add New", href: "/admin/pdf-uploads/create", icon: <MdAdd /> },
      ],
    },
    {
      title: "Notifications",
      icon: <MdNotifications className="text-xl" />,
      mainLink: "/admin/notifications/view",
      subLinks: [
        {
          label: "Send Notification",
          href: "/admin/notifications/send",
          icon: <MdAdd />,
        },
        {
          label: "View All",
          href: "/admin/notifications/view",
          icon: <MdVisibility />,
        },
      ],
    },
    {
      title: "Orders",
      icon: <MdAllInbox className="text-xl" />,
      mainLink: "/admin/orders-dashboard",
      subLinks: [
        {
          label: "View All Orders",
          href: "/admin/orders",
          icon: <MdAllInbox />,
        },
      ],
    },
    {
      title: "Subscription Plans",
      icon: <MdAttachMoney className="text-xl" />,
      mainLink: "/admin/subscription-dashboard",
      subLinks: [
        {
          label: "Add New Plan",
          href: "/admin/subscription-plans/create",
          icon: <MdAdd />,
        },
        {
          label: "View All Plans",
          href: "/admin/subscription-plans",
          icon: <MdAllInbox />,
        },
        {
          label: "Subscribed Users",
          href: "/admin/subscription-plans/subscribed-users",
          icon: <MdAllInbox />,
        },
        {
          label: "Manually Add",
          href: "/admin/subscription-plans/manual-add",
          icon: <MdAdd />,
        },
      ],
    },
    {
      title: "Users",
      icon: <MdAllInbox className="text-xl" />,
      mainLink: "/admin/users-dashboard",
      subLinks: [
        {
          label: "View All Users",
          href: "/admin/Users",
          icon: <MdAllInbox />,
        },
      ],
    },
   
  ];

  const performTokenVerification = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth/login", { replace: true });
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}api/auth/admin/verify-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!(res.status === 200 && res.data.isValid)) {
        localStorage.removeItem("token");
        navigate("/auth/login", { replace: true });
      }
    } catch (error) {
      let errorMessage =
        "An unexpected error occurred during token verification.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      console.error("Admin token verification failed:", errorMessage);
      localStorage.removeItem("token");
      navigate("/auth/login", { replace: true });
    }
  };

  const fetchNewOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setNewOrdersCount(0);
        return;
      }

      const lastCheck = localStorage.getItem("lastNotificationCheck");

      const res = await axios.get(`${API_BASE_URL}api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success && Array.isArray(res.data.data)) {
        const orders = res.data.data;
        const newPendingOrders = orders.filter((order: any) => {
          const orderCreatedAt = new Date(order.createdAt).getTime();
          const lastCheckTime = lastCheck ? new Date(lastCheck).getTime() : 0;

          return order.status === "pending" && orderCreatedAt > lastCheckTime;
        });
        setNewOrdersCount(newPendingOrders.length);
      } else {
        setNewOrdersCount(0);
      }
    } catch (error) {
      console.error("Error fetching new orders:", error);
      setNewOrdersCount(0);
    }
  }, [API_BASE_URL]);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await axios.get<Category[]>(
        `${API_BASE_URL}api/categories`
      );
      const fetchedCategories = response.data.filter((cat) => cat.isAvailable);
      const allCategories = [...fetchedCategories, ...customCategories];
      setCategories(allCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories(customCategories);
    } finally {
      setLoadingCategories(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    performTokenVerification();
    fetchNewOrders();
    fetchCategories();

    const tokenVerificationInterval = setInterval(() => {
      performTokenVerification();
    }, 5 * 60 * 1000);

    const notificationInterval = setInterval(() => {
      fetchNewOrders();
    }, 30 * 1000);

    return () => {
      clearInterval(tokenVerificationInterval);
      clearInterval(notificationInterval);
    };
  }, [navigate, API_BASE_URL, fetchNewOrders, fetchCategories]);

  // REVISED: Mouse event logic with CLOSING DELAY for reliability
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. OPENING: Trigger open when near the edge (0-20px)
      if (e.clientX < 20) {
        // Clear any pending close action immediately
        if (closeTimer.current !== null) {
          clearTimeout(closeTimer.current);
          closeTimer.current = null;
        }
        setIsSidebarOpen(true);
      }
    };

    const handleMouseLeaveSidebar = () => {
      // 2. CLOSING: Set a delay for closing (300ms)
      // Only set the timer if one is not already running
      if (closeTimer.current === null) {
        closeTimer.current = setTimeout(() => {
          // If the search keyword is empty, close everything
          if (!searchKeyword) {
            setIsSearchOpen(false);
            setIsSidebarOpen(false);
          }
          closeTimer.current = null; // Mark as cleared/executed
        }, 300) as unknown as number; // 300ms delay for closing
      }
    };

    const sidebarElement = document.querySelector("aside");
    if (sidebarElement) {
      sidebarElement.addEventListener("mouseleave", handleMouseLeaveSidebar);
    }

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (sidebarElement) {
        sidebarElement.removeEventListener("mouseleave", handleMouseLeaveSidebar);
      }
      // Clean up the timer when the component unmounts
      if (closeTimer.current !== null) {
        clearTimeout(closeTimer.current);
      }
    };
  }, [searchKeyword]);

  // Click outside logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleSearchToggle();
      }
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleClickOutside = (event: MouseEvent) => {
      const sidebarElement = document.querySelector("aside");

      if (sidebarElement && !sidebarElement.contains(event.target as Node)) {
        setIsSidebarOpen(false);
        setIsSearchOpen(false);
        setSearchKeyword("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth/login", { replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchOpen(false);
    toast.info("Initiating search...");

    const queryParams = new URLSearchParams();
    if (searchKeyword) {
      queryParams.append("keyword", searchKeyword);
    }
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
    navigate(`/admin/search${queryString ? `?${queryString}` : ""}`);

    setSearchKeyword("");
    setSearchCategory("");
    setSearchFromDate("");
    setSearchToDate("");
  };

  const handleSearchToggle = () => {
    setIsSearchOpen((prev) => !prev);
    setIsSidebarOpen(true);
    if (!isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <aside
      // ASIDE element: Controls the width transition
      className={`bg-gray-900 text-white p-6 flex flex-col h-screen fixed inset-y-0 left-0 z-10 
        transition-all duration-300 ease-in-out
        ${
          isSidebarOpen ? "w-80 overflow-y-auto" : "w-16 overflow-hidden"
        }`}
    >
      <div className="flex items-center justify-between gap-2 mb-4 border-b border-gray-700 pb-4 ">
        {/* Smoother transition for Admin Panel title */}
        <Link
          to={"/admin/dashboard"}
          className={`flex items-center gap-2 transition-opacity duration-200 ${
            isSidebarOpen ? "opacity-100 block" : "opacity-0 hidden"
          }`}
        >
          <h2 className="text-2xl font-extrabold text-yellow-400">
            Admin Panel
          </h2>
        </Link>
        <div
          // Vertical layout for icons when sidebar is closed
          className={`relative flex items-center gap-2 ${
            !isSidebarOpen ? "flex-col gap-4" : ""
          }`}
          ref={searchIconsContainerRef}
        >
          <button
            onClick={handleSearchToggle}
            aria-label="Open search"
            className="relative text-yellow-400 hover:text-yellow-300 transition-colors duration-200 group"
          >
            <MdSearch className="text-2xl" />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Search (Ctrl+K)
            </span>
          </button>

          <Link
            to="/admin/new-orders"
            // Conditional margin for horizontal spacing when open
            className={`relative text-yellow-400 hover:text-yellow-300 transition-colors duration-200 group ${
              isSidebarOpen ? "ml-2" : ""
            }`}
            aria-label="New Orders Notifications"
            onClick={() => {
              setNewOrdersCount(0);
              localStorage.setItem(
                "lastNotificationCheck",
                new Date().toISOString()
              );
            }}
          >
            <MdNotifications className="text-2xl" />
            {newOrdersCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-0.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {newOrdersCount}
              </span>
            )}
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              New Orders
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="text-lg text-red-400 hover:text-red-300 transition-colors duration-200"
          >
            <MdLogout className="text-2xl" />
          </button>

          {isSearchOpen && (
            <form
              onSubmit={handleSearch}
              className="absolute top-full right-0 mt-2 w-60 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-30 p-4 flex flex-col gap-2"
              ref={searchFormRef}
            >
              <input
                type="text"
                ref={searchInputRef}
                placeholder="Search keyword (title, content)"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <select
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                disabled={loadingCategories}
              >
                <option value="">
                  {loadingCategories
                    ? "Loading categories..."
                    : "All Categories"}
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
                  className="w-1/2 bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={searchFromDate}
                  onChange={(e) => setSearchFromDate(e.target.value)}
                />
                <input
                  type="date"
                  placeholder="To Date"
                  title="To Date"
                  className="w-1/2 bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={searchToDate}
                  onChange={(e) => setSearchToDate(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-600 text-white py-2 rounded-md hover:bg-yellow-700 transition-colors duration-200"
              >
                Search
              </button>
            </form>
          )}
        </div>
      </div>
      
      {/* REVISED NAVIGATION: Always rendered but uses opacity/translate to hide/show smoothly */}
      <nav 
        className={`flex flex-col space-y-4 pt-4 
          transition-all duration-300 ease-in-out 
          ${isSidebarOpen 
            ? "opacity-100 translate-x-0 pointer-events-auto" 
            : "opacity-0 -translate-x-4 pointer-events-none"
          }`}
      >
        {navSections.map((section, index) => (
          <div key={index}>
            <Link
              to={section.mainLink}
              className="flex items-center gap-3 text-lg font-semibold hover:text-yellow-300 transition-colors duration-200 py-2 group"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="text-2xl min-w-[28px] flex justify-start items-center">
                {section.icon}
              </span>
              {/* Menu title content - relies on parent <nav> transition */}
              <span className="whitespace-nowrap">
                {section.title}
              </span>
            </Link>
            {/* Sub-Links: Use opacity/height transition for a smoother dropdown effect */}
            {section.subLinks.length > 0 && (
              <div 
                className={`ml-8 mt-2 flex flex-col space-y-1 
                  transition-opacity duration-300 ease-in-out
                  ${isSidebarOpen ? "opacity-100 max-h-40" : "opacity-0 max-h-0 overflow-hidden"}`}
              >
                {section.subLinks.map((subLink, subIndex) => (
                  <Link
                    key={subIndex}
                    to={subLink.href}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-300 transition-colors duration-200 py-1"
                  >
                    {subLink.icon && (
                      <span className="text-lg">
                        {subLink.icon}
                      </span>
                    )}
                    {subLink.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}