import  { useState } from "react";
import { useNavigate } from "react-router-dom"; 

export default function Subscribe() {
  const navigate = useNavigate();
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const  handleShareClick = () => {
    if (navigator.share) {
      navigator
        .share({
          title: document.title,
          url: window.location.href,
        })
        .then(() => {
          console.log("Successful share");
          setShareMessage("Page shared successfully!");
          setTimeout(() => setShareMessage(null), 3000); // Clear message after 3 seconds
        })
        .catch((error) => {
          console.log("Error sharing", error);
          setShareMessage("Error sharing page.");
          setTimeout(() => setShareMessage(null), 3000); // Clear message after 3 seconds
        });
    } else {
      setShareMessage("Web Share API is not supported in your browser. You can manually copy the URL.");
      setTimeout(() => setShareMessage(null), 5000); // Clear message after 5 seconds
      console.log("Web Share API not supported.");
      // Optionally, you could provide a copy-to-clipboard functionality here.
    }
  };

  const handleSubscribeClick = () => {
    navigate("/subscriptions"); // Navigate to the user-facing subscription plans page
  };

  return (
    <div className="flex items-center border-2 border-highlight-1 rounded-lg relative">
      {/* Share message display */}
      {shareMessage && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg whitespace-nowrap z-20">
          {shareMessage}
        </div>
      )}

      <button
        type="button" // Changed type from "submit" to "button"
        onClick={handleSubscribeClick} // Added onClick handler
        className="bg-highlight-1 hover:bg-black text-white px-4 py-2 transition-colors duration-150 ease-in-out rounded-l-md" // Added rounded-l-md for styling
      >
        Subscribe
      </button>

      {/* Make the parent of the SVG (or the SVG itself if you can position it) relative */}
      <div className="relative group mx-2">
        {/* Added relative and group here */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="size-6 cursor-pointer text-black hover:text-highlight-1 transition-colors duration-150 ease-in-out"
          onClick={handleShareClick}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c-.037 .206 5.384 -5.962 10 -6v4l8 -7l-8 -7z"
          />
        </svg>
        {/* Tooltip text outside the SVG but within the relative group */}
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block
                     bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          Share
        </span>
      </div>
    </div>
  );
}
