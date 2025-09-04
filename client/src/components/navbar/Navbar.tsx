import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Tags from "./Tags";
import TitleBar from "./TitleBar";
import Menus from "./Menus";
import Subscribe from "./Subscribe";

interface NavbarProps {
  onHeightChange: (height: number) => void;
}

const SCROLL_THRESHOLD = 30;
const TRANSITION_DURATION = "duration-300 ease-in-out";

export default function Navbar({ onHeightChange }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

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

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const logoSrc = isScrolled ? "/logo.png" : "/logo1.png";
  const logoHeightClass = isScrolled 
    ? "h-12 sm:h-14 md:h-16 lg:h-18 xl:h-20" 
    : "h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36";

  const isTitleBarVisible = !isScrolled;

  return (
    <div
      ref={navbarRef}
      className={`fixed top-0 left-0 w-full z-50 ${TRANSITION_DURATION}
        ${isScrolled 
          ? "shadow-md bg-background-to /95 backdrop-blur-sm" 
          : "py-1 bg-transparent"
        }`}
    >
      <div className="flex w-full px-2 sm:px-3 md:px-4 xl:px-2 items-center">
        {/* Logo Container - Responsive sizing */}
        <div className={`flex-shrink-0 bg-transparent ${TRANSITION_DURATION}`}>
          <Link to="/" className="block">
            <img
              src={logoSrc}
              alt="logo"
              className={`${TRANSITION_DURATION} ${logoHeightClass} w-auto`}
            />
          </Link>
        </div>

        {/* Mobile Menu Button - Hidden on desktop */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="xl:hidden ml-auto p-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Desktop Main Content Area - Visible only on xl screens */}
        <div className="hidden xl:flex flex-col flex-1 min-w-0">
          {/* TitleBar and Subscribe */}
          <div
            className={`w-full justify-center px-4 flex ${TRANSITION_DURATION}
              ${
                isTitleBarVisible
                  ? "opacity-100 h-auto"
                  : "opacity-0 h-0 overflow-hidden"
              }`}
          >
            <TitleBar />
            <Subscribe />
          </div>

          {/* Navigation Menu */}
          <nav
            className={`w-full flex justify-between items-center px-4 text-black relative
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

      {/* Mobile/Tablet Menu - Hidden on desktop */}
      <div
  className={`xl:hidden ${TRANSITION_DURATION} ${
    isMobileMenuOpen
      ? "max-h-screen opacity-100"
      : "max-h-0 opacity-0 overflow-hidden"
  }  backdrop-blur-sm shadow-lg border-t bg-background-to`}
>
  <div className="px-4 py-6 space-y-6">
     
    {/* Add a separate container for the icons */}
    <div className="flex justify-center items-center py-4 border-b">
      {/* Assuming TitleBar contains the search, profile, and cart icons */}
      <TitleBar />
    </div>
    <div className="space-y-4">
      <div className="pb-4 border-b bg-background-to">
        <Tags />
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1">
          {/* Ensure Menus component renders the icons */}
          <Menus />
        </div>
        <div className="flex-shrink-0">
          <Subscribe />
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="xl:hidden fixed inset-0 top-full bg-black/20 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}