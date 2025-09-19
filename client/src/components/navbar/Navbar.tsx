import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Tags from "./Tags";
import TitleBar from "./TitleBar";
import Menus from "./Menus";
import Subscribe from "./Subscribe";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";

interface NavbarProps {
  onHeightChange: (height: number) => void;
}

const SCROLL_THRESHOLD = 30;
const TRANSITION_DURATION = "duration-300 ease-in-out";

export default function Navbar({ onHeightChange }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close the mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > SCROLL_THRESHOLD);
    };

    window.addEventListener("scroll", handleScroll);

    const measureHeight = () => {
      if (navbarRef.current) {
        onHeightChange(navbarRef.current.offsetHeight);
      }
    };

    measureHeight();

    const observer = new ResizeObserver(measureHeight);
    if (navbarRef.current) {
      observer.observe(navbarRef.current);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (navbarRef.current) {
        observer.unobserve(navbarRef.current);
      }
    };
  }, [onHeightChange]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        closeMobileMenu();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle body scrolling and clicks outside the menu
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
      // Add a slight delay for the event listener to avoid immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleOutsideClick);
      }, 100);
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
        clearTimeout(timeoutId);
      };
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMobileMenuOpen]);

  const logoSrc = isScrolled ? "/logo.png" : "/logo1.png";
  const logoHeightClass = isScrolled
    ? "h-12 sm:h-14 md:h-16 lg:h-18 xl:h-20"
    : "h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36";

  const isTitleBarVisible = !isScrolled;

  return (
    <>
      {/* --- NAVBAR HEADER --- */}
      <div
        ref={navbarRef}
        className={`fixed top-0 left-0 w-full z-50 ${TRANSITION_DURATION}
          ${isScrolled
            ? "shadow-md bg-background-to/95 backdrop-blur-sm"
            : "py-1 bg-transparent"
          }`}
      >
        {/* Mobile/Tablet View (Hidden on xl screens) */}
        <div className="xl:hidden">
          <div className="flex justify-center items-center py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4">
            <TitleBar />
          </div>
          <div className="flex w-full px-2 sm:px-3 md:px-4 xl:px-2 items-center">
            <div className={`flex-shrink-0 bg-transparent ${TRANSITION_DURATION}`}>
              <Link to="/" className="block">
                <img
                  src={logoSrc}
                  alt="logo"
                  className={`${TRANSITION_DURATION} ${logoHeightClass} w-auto`}
                />
              </Link>
            </div>
            <div className="flex ml-auto items-center">
              <Menus isMobileHeader={true} closeMobileMenu={closeMobileMenu} />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop View (Visible only on xl screens) */}
        <div className="hidden xl:flex flex-col flex-1 min-w-0">
          <div className="flex w-full px-2 sm:px-3 md:px-4 xl:px-2 items-center justify-between">
            <div className={`flex-shrink-0 bg-transparent ${TRANSITION_DURATION}`}>
              <Link to="/" className="block">
                <img
                  src={logoSrc}
                  alt="logo"
                  className={`${TRANSITION_DURATION} ${logoHeightClass} w-auto`}
                />
              </Link>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div
                className={`w-full justify-center flex ${TRANSITION_DURATION}
                  ${isTitleBarVisible ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"}`}
              >
                <TitleBar />
                <Subscribe />
              </div>
              <nav
                className={`w-full flex justify-between items-center relative
                  ${isScrolled ? "" : "mt-2"}`}
              >
                <div className="flex-1 min-w-0">
                  <Tags />
                </div>
                <div className="flex-shrink-0">
                  <Menus />
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE / TABLET MENU (Now a sibling) --- */}
      {/* --- MOBILE / TABLET MENU Now a sibling) --- */}
      <div
        ref={mobileMenuRef}
        className={`xl:hidden fixed inset-y-0 right-0 w-80 md:w-96 transform ${TRANSITION_DURATION}
    ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
    backdrop-blur-sm shadow-lg border-l bg-background-to z-50 overflow-y-auto`}
      >
       {/* Top bar: social icons + close button */}
<div className="flex justify-between items-center p-4">
  {/* Social media icons */}
  <div className="flex space-x-4 text-2xl">
    <a
      href="https://www.facebook.com/dalitmurasuadmin?rdid=O3FlEPCoVVrE3uAm&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F19DuFLdYay%2F#"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-red-700 dark:hover:text-red-100"
    >
      <FaFacebook />
    </a>
    <a
      href="https://x.com/DalitMurasu?t=xF15mBqW1rLbOYfOnMd_0Q&s=08"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-red-700 dark:hover:text-red-100"
    >
      <FaTwitter />
    </a>
    <a
      href="http://googleusercontent.com/maps.google.com/3"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-red-700 dark:hover:text-red-100"
    >
      <FaInstagram />
    </a>
    <a
      href="https://wa.me/919444452877"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-red-700 dark:hover:text-red-100"
    >
      <FaWhatsapp />
    </a>
  </div>

  {/* Close button */}
  <button
    onClick={closeMobileMenu}
    className="text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md"
    aria-label="Close mobile menu"
  >
    <X className="h-6 w-6" />
  </button>
</div>


        {/* Main content */}
        <div className="px-4 pb-6 space-y-6">
         <div className="space-y-4">
  {/* Row for Subscribe (left) and Login (right) */}
  <div className="flex justify-between items-center gap-4">
    {/* Subscribe (left) */}
    <div>
      <Subscribe />
    </div>

    {/* Login/Profile (right) */}
    <div>
      <Menus isMobileMenu={true} closeMobileMenu={closeMobileMenu} />
    </div>
  </div>

  {/* Tags below */}
  <div className="pb-4 border-b bg-background-to">
    <Tags isMobileView={true} closeMobileMenu={closeMobileMenu} />
  </div>
</div>


        </div>
      </div>

    </>
  );
}