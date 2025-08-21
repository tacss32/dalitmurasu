import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// New interface for user search results
interface User {
  name: string;
}

export default function SendNotification() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetUserNames, setTargetUserNames] = useState("");
  // NEW state for the popup checkbox
  const [popup, setPopup] = useState(false);
  const [allUsers, setAllUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API;

  // Handles submitting the form with the new popup state
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // If 'allUsers' is selected, don't send individual names
    const namesToSend = allUsers
      ? []
      : targetUserNames
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name !== "");

    // Check for validation
    if (!allUsers && namesToSend.length === 0) {
      toast.error("Please provide at least one user name or select 'All Users'.");
      setLoading(false);
      return;
    }

    if (!title || !message) {
      toast.error("Title and message are required.");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}api/notifications`, {
        title,
        message,
        targetUserNames: namesToSend,
        popup, // NEW: Include popup state
        allUsers, // NEW: Include allUsers state
      });
      toast.success("Notification sent successfully!");
      setTitle("");
      setMessage("");
      setTargetUserNames("");
      setPopup(false);
      setAllUsers(false);
      setSearchTerm("");
      setSearchResults([]);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to send notification");
      } else {
        toast.error("An unexpected error occurred while sending notification.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchTerm.length > 2 && !allUsers) {
        setIsSearching(true);
        try {
          const res = await axios.get<{ success: boolean; users: User[] }>(
            `${API_BASE_URL}api/notifications/search-users?q=${searchTerm}`
          );
          setSearchResults(res.data.users);
        } catch (err) {
          console.error("User search error:", err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, allUsers, API_BASE_URL]);

  const handleUserSelect = (userName: string) => {
    const currentNames = targetUserNames
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name !== "");
    if (!currentNames.includes(userName)) {
      setTargetUserNames(
        currentNames.length > 0 ? `${targetUserNames}, ${userName}` : userName
      );
    }
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleAllUsersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAllUsers(e.target.checked);
    if (e.target.checked) {
      setTargetUserNames("");
      setSearchTerm("");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
        Send New Notification
      </h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-8 rounded-xl shadow-lg max-w-xl mx-auto"
      >
        <div>
          <label
            htmlFor="title"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Notification Title:
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Important Update"
            className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out text-gray-700"
            required
          />
        </div>
        <div>
          <label
            htmlFor="message"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Notification Message:
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g., We have released a new feature!"
            className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out text-gray-700 h-32 resize-y"
            required
          />
        </div>
        <div>
          <label
            htmlFor="targetUserNames"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Target User Names:
          </label>
          <input
            type="text"
            id="targetUserNames"
            value={targetUserNames}
            onChange={(e) => {
              setTargetUserNames(e.target.value);
              setSearchTerm(e.target.value.split(",").pop()?.trim() || "");
            }}
            placeholder="e.g., JohnDoe, JaneSmith"
            className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out text-gray-700"
            disabled={allUsers}
          />
          {isSearching && <p className="text-sm text-gray-500 mt-2">Searching...</p>}
          {searchResults.length > 0 && (
            <ul className="border border-gray-300 rounded-lg mt-2 max-h-40 overflow-y-auto">
              {searchResults.map((user) => (
                <li
                  key={user.name}
                  onClick={() => handleUserSelect(user.name)}
                  className="p-2 cursor-pointer hover:bg-gray-200"
                >
                  {user.name}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple user names with commas.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allUsers"
              checked={allUsers}
              onChange={handleAllUsersChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allUsers" className="ml-2 text-gray-700 font-medium">
              Send to All Users
            </label>
          </div>
          {/* NEW: Popup Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="popup"
              checked={popup}
              onChange={(e) => setPopup(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="popup" className="ml-2 text-gray-700 font-medium">
              Show as Popup
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Notification"}
        </button>
      </form>
    </div>
  );
}