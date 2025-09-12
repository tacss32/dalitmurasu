import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
 
// Define the type for entries fetched from the PostTitle collection
interface PostTitleEntry {
  _id: string;
  postId: string; // The ID of the original post
  title: string;
  source: "recent" | "universal" | "pdf"; // ⭐ allow pdf as well
  createdAt: string;
}
 
export default function TitleBar() {
  // const { t } = useTranslation();
  const navigate = useNavigate(); // ⭐ ADDED
  const SERVER_URL = import.meta.env.VITE_API;
 
  const [selectedTitles, setSelectedTitles] = useState<PostTitleEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
 
  const fetchSelectedTitles = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}api/post_titles/selected`);
      type FetchResponseData =
        | PostTitleEntry[]
        | { error?: string; message?: string };
      const data: FetchResponseData = await res.json();
 
      if (res.ok) {
        setSelectedTitles(data as PostTitleEntry[]);
        setErrorMessage("");
      } else {
        const errorDetails = data as { error?: string; message?: string };
        setErrorMessage(
          errorDetails.error ||
            errorDetails.message ||
            "Failed to fetch selected titles."
        );
      }
    } catch (err: unknown) {
      console.error("Error fetching selected titles:", err);
      if (err instanceof Error) {
        setErrorMessage(
          `An error occurred while fetching selected titles: ${err.message}`
        );
      } else {
        setErrorMessage(
          "An unknown error occurred while fetching selected titles."
        );
      }
    }
  }, [SERVER_URL]);
 
  useEffect(() => {
    fetchSelectedTitles();
  }, [fetchSelectedTitles]);
 
  // ⭐ helper to handle navigation
  const handleClick = (post: PostTitleEntry) => {
    if (post.source === "universal") {
      navigate(`/posts/${post.postId}`);
    } else if (post.source === "recent") {
      navigate(`/premium-articles/${post.postId}`);
    } else if (post.source === "pdf") {
      navigate(`/pdf/${post.postId}`);
    }
  };
 
  return (
    <>
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}
      </style>
 
      <nav className="w-full flex justify-center px-4">
        <div className="flex items-center gap-3 w-full max-w-4xl overflow-hidden rounded-md text-black px-3 py-1">
          <h1 className="font-bold text-highlight-1 flex-shrink-0 px-3">
            #{("புதிய செய்திகள்")}
          </h1>
 
          <div className="flex-1 min-w-0 overflow-hidden border-x-2 border-highlight-1">
            {errorMessage ? (
              <p className="text-red-600 text-center">{errorMessage}</p>
            ) : (
              <div
                className="w-max whitespace-nowrap flex gap-6"
                style={{
                  animation: `marquee ${Math.max(
                    20,
                    selectedTitles.length * 50
                  )}s linear infinite`,
                }}
              >
                {/* ⭐ Render clickable titles */}
                {selectedTitles.map((post) => (
                  <span
                    key={post._id}
                    onClick={() => handleClick(post)}
                    className="cursor-pointer hover:underline"
                  >
                    {post.title}
                  </span>
                ))}
 
                {/* duplicate for smooth loop */}
                {selectedTitles.map((post) => (
                  <span
                    key={post._id + "-dup"}
                    onClick={() => handleClick(post)}
                    className="cursor-pointer hover:underline"
                  >
                    {post.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
 
 