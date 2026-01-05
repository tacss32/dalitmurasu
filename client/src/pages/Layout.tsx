

import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/navbar/Navbar";
import SocialMediaScroller from "../components/SocialMediaScroller";
import { useState, useEffect } from "react";
import axios from "axios";

// Define the breakpoint for hiding the scroller (e.g., 1024px for tablet/mobile)
const HIDE_BREAKPOINT = 1024;

export default function Layout() {
  const [navbarHeight, setNavbarHeight] = useState(0);
  // Initial state check uses the new, broader breakpoint
  const [shouldHideScroller, setShouldHideScroller] = useState(window.innerWidth < HIDE_BREAKPOINT);

  useEffect(() => {
    // This effect handles the context menu
    const handleContextMenu = (e: { preventDefault: () => void; }) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);

    // This effect handles the screen resize
    const handleResize = () => {
      // Update state based on the broader breakpoint
      setShouldHideScroller(window.innerWidth < HIDE_BREAKPOINT);
    };
    window.addEventListener("resize", handleResize);

    // Track visit once per session
    const trackVisit = async () => {
      const visited = sessionStorage.getItem("visit_recorded");
      if (!visited) {
        sessionStorage.setItem("visit_recorded", "true");
        try {
          await axios.post(`${import.meta.env.VITE_API}api/analytics/visit`);
        } catch (error) {
          console.error("Error tracking visit:", error);
        }
      }
    };
    trackVisit();

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full font-mukta-malar select-none">
      <Navbar onHeightChange={setNavbarHeight} />
      <main
        style={{ paddingTop: `${navbarHeight}px` }}
        className="flex-grow md:p-4"
      >
        <Outlet />
      </main>
      {/* Change the condition to render the component ONLY if shouldHideScroller is false */}
      {!shouldHideScroller && <SocialMediaScroller />}
      <Footer />
    </div>
  );
}