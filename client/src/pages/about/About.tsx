import { useEffect } from "react";
import OurStory from "./OurStory";     

export default function About() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative p-4"> {/* Make this container relative */}
        <img 
          src="abouthead.svg" 
          alt="About Us Header Image" 
          className="mt-1 w-full h-100 object-cover rounded-lg" // Changed h-100 to h-auto for better responsiveness
        />
        {/* Overlay text */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white p-4">
          <h1 className="text-3xl font-bold text-white">ஓர் அறிமுகம்</h1>
          
        </div>
      </div>
      <OurStory />   
    </div>
  );
}