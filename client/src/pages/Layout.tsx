// src/layouts/Layout.jsx

import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/navbar/Navbar";
import SocialMediaScroller from "../components/SocialMediaScroller";
import { useState, useEffect } from "react";

export default function Layout() {
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Assuming 768px isyour mobile breakpoint

  useEffect(() => {
    // This effect handles the context menu
    const handleContextMenu = (e: { preventDefault: () => void; }) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);

    // This effect handles the screen resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full font-mukta-malar">
      <Navbar onHeightChange={setNavbarHeight} />
      <main
        style={{ paddingTop: `${navbarHeight}px` }}
        className="flex-grow md:p-4"
      >
        <Outlet />
      </main>
      {!isMobile && <SocialMediaScroller />} {/* Conditionally render the component */}
      <Footer />
    </div>
  );
}