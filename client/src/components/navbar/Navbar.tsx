import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
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

  const logoSrc = isScrolled ? "/logo.png" : "/logo1.png";
  const logoHeightClass = isScrolled ? "h-20" : "h-36";

  const isTitleBarVisible = !isScrolled;

  return (
    <div
      ref={navbarRef}
      className={`fixed top-0 left-0 w-full z-50 ${TRANSITION_DURATION}
        ${isScrolled ? "shadow-md bg-background-to" : "py-1"}`}
    >
      <div className={`flex w-full px-2 items-center`}>
        {/* Logo Container */}
        <div className={`flex-shrink-0 bg-transparent ${TRANSITION_DURATION}`}>
          <Link to="/">
            <img
              src={logoSrc}
              alt="logo"
              className={`${TRANSITION_DURATION} ${logoHeightClass}`}
            />
          </Link>
        </div>

        {/* Main Content Area (TitleBar + Nav) */}
        <div className={`flex flex-col flex-1 min-w-0 ${TRANSITION_DURATION}`}>
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
    </div>
  );
}
