// src/layouts/Layout.jsx

import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/navbar/Navbar";
import SocialMediaScroller from "../components/SocialMediaScroller"; // Import the new component
import { useState, useEffect } from "react";

export default function Layout() {
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    // ... context menu code remains the same
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
      <SocialMediaScroller /> {/* Add the component here */}
      <Footer />
    </div>
  );
}