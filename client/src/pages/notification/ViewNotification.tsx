import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Define the interface for a notification, including the 'read' status
interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean; // This property is crucial for displaying read status
}

// Define interface for client user names (for the dropdown/list)
interface ClientUser {
  _id: string;
  name: string;
  email?: string; // Optional, as searchUsersByPrefix returns it
  phone?: string; // Optional, as searchUsersByPrefix returns it
}

// New interface for aggregated user notification data
interface UserNotificationSummary extends ClientUser {
  totalNotifications: number;
  unreadNotifications: number;
}

const API_BASE_URL = import.meta.env.VITE_API;

// Component starts here
const AdminNotificationsView: React.FC = () => {
  const [userName, setUserName] = useState<string>(""); // For individual user view
  const [notifications, setNotifications] = useState<Notification[]>([]); // For individual user view
  const [loading, setLoading] = useState<boolean>(false); // For individual user notifications
  const [error, setError] = useState<string | null>(null); // For individual user notifications

  // State for editing a notification
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editMessage, setEditMessage] = useState<string>("");

  // States for user management (All users & Search)
  const [allClientUserNames, setAllClientUserNames] = useState<ClientUser[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<ClientUser[]>([]);
  const [userLoading, setUserLoading] = useState<boolean>(false); // For fetching/searching users
  const [userError, setUserError] = useState<string | null>(null); // For fetching/searching users

  // New state for "All Users Summary View"
  const [showAllUsersSummary, setShowAllUsersSummary] = useState<boolean>(false);
  const [allUsersSummaryData, setAllUsersSummaryData] = useState<UserNotificationSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Fetch notifications for a specific user (memoized)
  const fetchNotifications = useCallback(async () => {
    if (!userName) {
      setNotifications([]); // Clear notifications if username is empty
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ success: boolean; data: Notification[] }>(
        `${API_BASE_URL}api/notifications/${userName}`
      );
      setNotifications(res.data.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to fetch notifications");
        toast.error(err.response?.data?.message || "Failed to fetch notifications");
      } else {
        setError("An unexpected error occurred while fetching notifications.");
        toast.error("An unexpected error occurred while fetching notifications.");
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [userName]);

  // Fetch all client user names (memoized)
  const fetchAllClientUserNames = useCallback(async () => {
    setUserLoading(true);
    setUserError(null);
    try {
      const res = await axios.get<{ success: boolean; users: ClientUser[] }>(
        `${API_BASE_URL}api/notifications/client-users`
      );
      setAllClientUserNames(res.data.users);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setUserError(err.response?.data?.message || "Failed to fetch client user names");
        toast.error(err.response?.data?.message || "Failed to fetch client user names");
      } else {
        setUserError("An unexpected error occurred while fetching client user names.");
        toast.error("An unexpected error occurred while fetching client user names.");
      }
      setAllClientUserNames([]);
    } finally {
      setUserLoading(false);
    }
  }, []);

  // Search client users by prefix (memoized)
  const searchClientUsers = useCallback(async (query: string) => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setUserLoading(true);
    setUserError(null);
    try {
      const res = await axios.get<{ success: boolean; users: ClientUser[] }>(
        `${API_BASE_URL}api/notifications/search-users?q=${query}`
      );
      setSearchResults(res.data.users);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setUserError(err.response?.data?.message || "Failed to search users");
        toast.error(err.response?.data?.message || "Failed to search users");
      } else {
        setUserError("An unexpected error occurred while searching users.");
        toast.error("An unexpected error occurred while searching users.");
      }
      setSearchResults([]);
    } finally {
      setUserLoading(false);
    }
  }, []);

  // New: Fetch summary for all users (memoized)
  const fetchAllUsersSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const allUsersResponse = await axios.get<{ success: boolean; users: ClientUser[] }>(
        `${API_BASE_URL}api/notifications/client-users`
      );

      if (!allUsersResponse.data.success) {
        setSummaryError("Failed to fetch all client users for summary.");
        toast.error("Failed to fetch all client users for summary.");
        return;
      }

      const users = allUsersResponse.data.users;
      const summaryPromises = users.map(async (user) => {
        try {
          const notificationsResponse = await axios.get<{ success: boolean; data: Notification[] }>(
            `${API_BASE_URL}api/notifications/${user.name}`
          );
          const notifications = notificationsResponse.data.data;
          const totalNotifications = notifications.length;
          const unreadNotifications = notifications.filter((notif) => !notif.read).length;
          return { ...user, totalNotifications, unreadNotifications };
        } catch (notifErr: unknown) {
          console.warn(`Could not fetch notifications for user ${user.name}:`, notifErr);
          // If notifications fail for one user, just return their data with 0 counts
          return { ...user, totalNotifications: 0, unreadNotifications: 0 };
        }
      });

      const summaryResults = await Promise.all(summaryPromises);
      setAllUsersSummaryData(summaryResults);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setSummaryError(err.response?.data?.message || "Failed to fetch users summary");
        toast.error(err.response?.data?.message || "Failed to fetch users summary");
      } else {
        setSummaryError("An unexpected error occurred while fetching users summary.");
        toast.error("An unexpected error occurred while fetching users summary.");
      }
      setAllUsersSummaryData([]);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Effect to fetch notifications when userName changes
  useEffect(() => {
    if (!showAllUsersSummary) { // Only fetch individual notifications if not in summary view
      fetchNotifications();
    }
  }, [fetchNotifications, showAllUsersSummary]);

  // Effect to fetch all client user names on component mount
  useEffect(() => {
    fetchAllClientUserNames();
  }, [fetchAllClientUserNames]);

  // Effect to perform search when searchQuery changes (with a debounce for better performance)
  useEffect(() => {
    const handler = setTimeout(() => {
      searchClientUsers(searchQuery);
    }, 500); // Debounce for 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, searchClientUsers]);

  // Effect to fetch all users summary when showAllUsersSummary becomes true
  useEffect(() => {
    if (showAllUsersSummary) {
      fetchAllUsersSummary();
      setUserName(""); // Clear individual user selection when showing summary
      setSearchQuery(""); // Clear search query when switching to summary
      setSearchResults([]); // Clear search results when switching to summary
    }
  }, [showAllUsersSummary, fetchAllUsersSummary]);

  // Handle Edit button click (for individual notification)
  const handleEditClick = (notification: Notification) => {
    setIsEditing(true);
    setCurrentNotification(notification);
    setEditTitle(notification.title);
    setEditMessage(notification.message);
  };

  // Handle Edit form submission (for individual notification)
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentNotification) return;

    setLoading(true);
    setError(null);
    try {
      await axios.put(`${API_BASE_URL}api/notifications/edit-by-title/${currentNotification.title}`, {
        newTitle: editTitle,
        message: editMessage,
      });
      toast.success("Notification updated successfully!");
      setIsEditing(false); // Close the modal
      setCurrentNotification(null); // Clear current notification
      fetchNotifications(); // Re-fetch notifications to show updated data
      // If in summary view, also re-fetch summary to reflect changes
      if (showAllUsersSummary) {
          fetchAllUsersSummary();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to update notification");
        toast.error(err.response?.data?.message || "Failed to update notification");
      } else {
        setError("An unexpected error occurred while updating notification.");
        toast.error("An unexpected error occurred while updating notification.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete button click (for individual notification)
  const handleDelete = async (title: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}api/notifications/by-title`, {
        data: { title }, // Send title in the 'data' property for DELETE requests
      });
      toast.success("Notification deleted!");
      fetchNotifications(); // Re-fetch notifications after deletion
      // If in summary view, also re-fetch summary to reflect changes
      if (showAllUsersSummary) {
          fetchAllUsersSummary();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to delete notification");
        toast.error(err.response?.data?.message || "Failed to delete notification");
      } else {
        setError("An unexpected error occurred.");
        toast.error("An unexpected error occurred.");
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to switch to individual user view
  const viewUserNotifications = (name: string) => {
    setUserName(name);
    setShowAllUsersSummary(false); // Exit summary view
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
        Notification Management
      </h2>

      {/* View Mode Toggle */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setShowAllUsersSummary(false)}
          className={`py-2 px-6 rounded-lg font-semibold transition duration-300 ease-in-out ${
            !showAllUsersSummary
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white text-blue-600 border border-blue-300 hover:bg-blue-50"
          }`}
        >
          View Individual User Notifications
        </button>
        <button
          onClick={() => setShowAllUsersSummary(true)}
          className={`py-2 px-6 rounded-lg font-semibold transition duration-300 ease-in-out ${
            showAllUsersSummary
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white text-blue-600 border border-blue-300 hover:bg-blue-50"
          }`}
        >
          View All Users Summary
        </button>
      </div>

      {/* Conditional Rendering based on showAllUsersSummary */}
      {showAllUsersSummary ? (
        // All Users Summary View
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-2xl font-bold text-gray-700 mb-4">All Users Notification Summary</h3>
          {summaryLoading && (
            <p className="text-center text-blue-600 text-lg font-medium">Loading summary...</p>
          )}
          {summaryError && (
            <p className="text-center text-red-600 text-lg font-medium">Error: {summaryError}</p>
          )}
          {!summaryLoading && !summaryError && (
            <>
              {allUsersSummaryData.length === 0 ? (
                <p className="text-center text-gray-600 text-lg">No users found to summarize.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                        <th className="py-3 px-6 border-b border-gray-200">S.No</th>
                        <th className="py-3 px-6 border-b border-gray-200">User Name</th>
                        <th className="py-3 px-6 border-b border-gray-200 text-center">Total Messages</th>
                        <th className="py-3 px-6 border-b border-gray-200 text-center">Unread Messages</th>
                        <th className="py-3 px-6 border-b border-gray-200 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm">
                      {allUsersSummaryData.map((user, index) => (
                        <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-6 whitespace-nowrap">{index + 1}</td>
                          <td className="py-3 px-6 whitespace-nowrap font-medium">{user.name}</td>
                          <td className="py-3 px-6 text-center">{user.totalNotifications}</td>
                          <td className="py-3 px-6 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                user.unreadNotifications > 0
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {user.unreadNotifications}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-center">
                            <button
                              onClick={() => viewUserNotifications(user.name)} // This button will now say "Manage Notifications"
                              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded-lg text-xs transition duration-200 ease-in-out"
                            >
                              Manage Notifications
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Individual User Notifications View (Existing logic)
        <>
          {/* User Selection Section */}
          <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-700 mb-4">Select or Search for a User</h3>

            {/* Search by Prefix */}
            <div className="mb-4">
              <label htmlFor="searchUserInput" className="block text-gray-700 text-sm font-bold mb-2">
                Search Users (by Name, Email, or Phone Prefix):
              </label>
              <input
                type="text"
                id="searchUserInput"
                placeholder="Start typing to search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out text-gray-700"
              />
              {userLoading && searchQuery.length > 0 && (
                <p className="text-blue-600 text-sm mt-2">Searching users...</p>
              )}
              {userError && (
                <p className="text-red-600 text-sm mt-2">Error searching users: {userError}</p>
              )}
              {searchResults.length > 0 && searchQuery.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-md max-h-48 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {searchResults.map((user) => (
                      <li
                        key={user._id}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                        onClick={() => {
                          setUserName(user.name);
                          setSearchQuery(""); // Clear search after selection
                          setSearchResults([]); // Clear results
                        }}
                      >
                        <div>
                          <div className="font-semibold text-gray-800">{user.name}</div>
                          {user.email && <div className="text-xs text-gray-600">Email: {user.email}</div>}
                          {user.phone && <div className="text-xs text-gray-600">Phone: {user.phone}</div>}
                        </div>
                        <button
                          className="text-blue-500 hover:text-blue-700 text-sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent li click
                            setUserName(user.name);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                        >
                          Select
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {searchResults.length === 0 && searchQuery.length > 0 && !userLoading && !userError && (
                <p className="text-gray-500 text-sm mt-2">No users found matching "{searchQuery}".</p>
              )}
            </div>

            {/* OR separator */}
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Select from All Users Dropdown */}
            <div className="mb-4">
              <label htmlFor="selectUserDropdown" className="block text-gray-700 text-sm font-bold mb-2">
                Select from All Users:
              </label>
              <select
                id="selectUserDropdown"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out text-gray-700 bg-white"
                disabled={userLoading}
              >
                <option value="">-- Select a User --</option>
                {userLoading ? (
                  <option disabled>Loading users...</option>
                ) : (
                  allClientUserNames.map((user) => (
                    <option key={user._id} value={user.name}>
                      {user.name}
                    </option>
                  ))
                )}
              </select>
              {userError && !searchQuery && (
                <p className="text-red-600 text-sm mt-2">Error loading users for dropdown: {userError}</p>
              )}
            </div>

            {/* Current Selected User Display */}
            {userName && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm font-medium">
                Currently viewing notifications for: <span className="font-semibold">{userName}</span>
                <button
                  onClick={() => setUserName("")}
                  className="ml-4 text-blue-600 hover:text-blue-800 underline"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {/* Loading and Error States for Notifications */}
          {loading && (
            <p className="text-center text-blue-600 text-lg font-medium">Loading notifications...</p>
          )}
          {error && (
            <p className="text-center text-red-600 text-lg font-medium">Error: {error}</p>
          )}

          {/* Notification List */}
          {!loading && !error && (
            <ul className="space-y-6">
              {notifications.length === 0 && userName && (
                <p className="text-center text-gray-600 text-lg">No notifications found for "{userName}".</p>
              )}
              {notifications.length === 0 && !userName && (
                <p className="text-center text-gray-600 text-lg">Please select or enter a username to view notifications.</p>
              )}
              {notifications.map((notif: Notification) => (
                <li
                  key={notif._id}
                  className={`border p-6 rounded-xl shadow-lg transition-all duration-300 ease-in-out ${
                    notif.read ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200 font-semibold"
                  } hover:shadow-xl`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-extrabold text-xl text-gray-900">{notif.title}</div>
                    {notif.read ? (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Read
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Unread
                      </span>
                    )}
                  </div>
                  <div className="text-base text-gray-700 mb-3">{notif.message}</div>
                  <div className="text-xs text-gray-500">
                    Received:{" "}
                    {notif.createdAt
                      ? new Date(notif.createdAt).toLocaleString()
                      : "N/A"}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out text-sm"
                      onClick={() => handleEditClick(notif)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out text-sm"
                      onClick={() => handleDelete(notif.title)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Edit Notification Modal */}
      {isEditing && currentNotification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">Edit Notification</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="editTitle" className="block text-gray-700 text-sm font-bold mb-2">
                  New Title:
                </label>
                <input
                  type="text"
                  id="editTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out text-gray-700"
                  required
                />
              </div>
              <div>
                <label htmlFor="editMessage" className="block text-gray-700 text-sm font-bold mb-2">
                  New Message:
                </label>
                <textarea
                  id="editMessage"
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out text-gray-700 h-28 resize-y"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-5 rounded-lg shadow-md transition duration-300 ease-in-out text-sm"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsView;