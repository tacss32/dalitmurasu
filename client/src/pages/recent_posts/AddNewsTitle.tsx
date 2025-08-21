import { useState, useEffect, useCallback } from "react";
import Loader from '../../components/Loader';

// Define interfaces for your data structures
interface PostTitleEntry {
  _id: string;
  postId: string;
  title: string;
  source: "recent" | "universal"; // Enforce specific source values
  createdAt: string; // Assuming it's a string from the DB
}

interface AvailablePost {
  _id: string;
  title: string;
  createdAt: string; // Assuming it's a string from the DB
  source: "recent" | "universal"; // Enforce specific source values
}

export default function AddNewsTitle() {
  const [selectedTitles, setSelectedTitles] = useState<PostTitleEntry[]>([]); // Typed array
  const [allAvailableTitles, setAllAvailableTitles] = useState<AvailablePost[]>(
    []
  ); // Typed array
  const [searchTerm, setSearchTerm] = useState<string>(""); // Explicitly string
  const [selectedPostToAdd, setSelectedPostToAdd] =
    useState<AvailablePost | null>(null); // Can be AvailablePost or null
  const [message, setMessage] = useState<string>(""); // Explicitly string
  const [isAddingTitle, setIsAddingTitle] = useState<boolean>(false); // New state for loader

  const SERVER_URL = import.meta.env.VITE_API;

  // Fetch already selected titles
  const fetchSelectedTitles = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}api/post_titles/selected`);
      const data: PostTitleEntry[] | { error?: string; message?: string } =
        await res.json(); // Type assertion for data

      if (res.ok) {
        setSelectedTitles(data as PostTitleEntry[]); // Cast data to the expected type
      } else {
        setMessage(
          (data as { error?: string }).error ||
            (data as { message?: string }).message ||
            "Failed to fetch selected titles."
        );
      }
    } catch (err: any) {
      // Explicitly type err as 'any' for now, or use 'unknown' and narrow
      console.error("Error fetching selected titles:", err);
      setMessage("An error occurred while fetching selected titles.");
    }
  }, [SERVER_URL]);

  // Fetch all available titles from RecentPost and UniversalPost
  const fetchAllAvailableTitles = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}api/post_titles`); // This uses your getAllTitles route
      const data: AvailablePost[] | { error?: string; message?: string } =
        await res.json(); // Type assertion for data

      if (res.ok) {
        setAllAvailableTitles(data as AvailablePost[]); // Cast data to the expected type
      } else {
        setMessage(
          (data as { error?: string }).error ||
            (data as { message?: string }).message ||
            "Failed to fetch all available titles."
        );
      }
    } catch (err: any) {
      // Explicitly type err as 'any' for now
      console.error("Error fetching all available titles:", err);
      setMessage("An error occurred while fetching all available titles.");
    }
  }, [SERVER_URL]);

  useEffect(() => {
    fetchSelectedTitles();
    fetchAllAvailableTitles();
  }, [fetchSelectedTitles, fetchAllAvailableTitles]);

  // Handle adding a title to the PostTitle collection
  const handleAddToPostTitles = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!selectedPostToAdd) {
      setMessage("Please select a title to add.");
      return;
    }

    setIsAddingTitle(true); // Show loader

    const payload = {
      postId: selectedPostToAdd._id,
      title: selectedPostToAdd.title,
      source: selectedPostToAdd.source,
    };

    try {
      const res = await fetch(`${SERVER_URL}api/post_titles/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: { message?: string; error?: string } = await res.json();

      if (res.ok) {
        setMessage(data.message || "Title added successfully!");
        setSelectedPostToAdd(null); // Clear selection
        setSearchTerm(""); // Clear search
        fetchSelectedTitles(); // Refresh the list of selected titles
      } else {
        setMessage(data.error || data.message || "Failed to add title.");
      }
    } catch (err: any) {
      console.error("Error adding post title:", err);
      setMessage("An error occurred while adding the title.");
    } finally {
      setIsAddingTitle(false); // Hide loader regardless of success or failure
    }
  };

  // Handle removing a title from the PostTitle collection
  const handleRemoveFromPostTitles = async (id: string) => {
    setMessage("");
    try {
      const res = await fetch(`${SERVER_URL}api/post_titles/${id}`, {
        method: "DELETE",
      });

      const data: { message?: string; error?: string } = await res.json();

      if (res.ok) {
        setMessage(data.message || "Title removed successfully!");
        fetchSelectedTitles(); // Refresh the list of selected titles
      } else {
        setMessage(data.error || data.message || "Failed to remove title.");
      }
    } catch (err: any) {
      console.error("Error removing post title:", err);
      setMessage("An error occurred while removing the title.");
    }
  };

  // Filter available titles based on search term
  const filteredAvailableTitles = allAvailableTitles.filter(
    (
      item: AvailablePost // Explicitly type item
    ) => item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10 px-4 relative"> {/* Added relative positioning */}
      {isAddingTitle && (
        <div className="absolute inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-50"> {/* Overlay for loader */}
          <Loader />
        </div>
      )}
      <div className="w-full max-w-4xl backdrop-blur-lg bg-white/70 border border-gray-200 shadow-xl rounded-2xl p-8 space-y-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Manage Post Titles
        </h2>
        {message && (
          <div
            className={`p-3 rounded-md text-center ${
              message.includes("successfully")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
        {/* Section 1: Already Selected Titles */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-gray-800">
            Currently Selected Titles
          </h3>
          {selectedTitles.length === 0 ? (
            <p className="text-gray-600">No titles currently selected.</p>
          ) : (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
              {selectedTitles.map(
                (
                  item: PostTitleEntry // Explicitly type item
                ) => (
                  <li
                    key={item._id}
                    className="p-4 flex justify-between items-center bg-white hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">
                        Source: {item.source} | Added:{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromPostTitles(item._id)} // item._id is now typed as string
                      className="ml-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-300 text-sm"
                    >
                      Remove
                    </button>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
        <hr className="border-gray-300" />{" "}
        {/* Added a horizontal rule for separation */}
        {/* Section 2: Add New Title from All Available Posts */}
        <form onSubmit={handleAddToPostTitles} className="space-y-4 pt-6">
          <h3 className="text-2xl font-semibold text-gray-800">
            Add New Title to Selected
          </h3>
          <div>
            <label
              htmlFor="search-titles"
              className="block text-sm font-semibold text-gray-700"
            >
              Search or Select a Post Title
            </label>
            <input
              type="text"
              id="search-titles"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                // Type e as React.ChangeEvent<HTMLInputElement>
                setSearchTerm(e.target.value);
                setSelectedPostToAdd(null); // Clear selection when typing
              }}
              placeholder="Start typing to search titles..."
              className="mt-1 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchTerm && filteredAvailableTitles.length > 0 && (
              <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredAvailableTitles.map(
                  (
                    item: AvailablePost // Explicitly type item
                  ) => (
                    <div
                      key={item._id}
                      className="p-3 cursor-pointer hover:bg-indigo-50 flex justify-between items-center border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        setSelectedPostToAdd(item);
                        setSearchTerm(item.title); // Display selected title in search box
                      }}
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          Source: {item.source}
                        </p>
                      </div>
                      {selectedPostToAdd &&
                        selectedPostToAdd._id === item._id && (
                          <span className="text-green-500 text-sm">
                            Selected
                          </span>
                        )}
                    </div>
                  )
                )}
              </div>
            )}
            {searchTerm && filteredAvailableTitles.length === 0 && (
              <p className="mt-2 text-gray-500 text-sm">
                No matching titles found.
              </p>
            )}
          </div>

          {selectedPostToAdd && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <p className="font-semibold text-indigo-800">Selected to add:</p>
              <p className="text-indigo-700">{selectedPostToAdd.title}</p>
              <p className="text-sm text-indigo-600">
                Source: {selectedPostToAdd.source} | ID: {selectedPostToAdd._id}
              </p>
            </div>
          )}

          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={!selectedPostToAdd || isAddingTitle} // Disable button when adding
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected Title to List
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
