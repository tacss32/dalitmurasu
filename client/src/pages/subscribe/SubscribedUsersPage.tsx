import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { MdAccountCircle, MdEmail, MdPhone, MdCalendarToday, MdCreditCard, MdDeleteForever } from "react-icons/md";
import { format, parseISO } from 'date-fns';

interface SubscribedUser {
  _id: string;
  name: string;
  email: string;
  gender: string;
  age: number;
  phone: string;
  subscriptionStartDate: string;
  subscriptionExpiresAt: string;
  title: string | null;
}

const SubscribedUsersPage: React.FC = () => {
  const [users, setUsers] = useState<SubscribedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SubscribedUser[]>([]);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterExpiryDateFrom, setFilterExpiryDateFrom] = useState("");
  const [filterExpiryDateTo, setFilterExpiryDateTo] = useState("");
  const [availableTitles, setAvailableTitles] = useState<string[]>([]);
  const API_BASE_URL = import.meta.env.VITE_API;

  const fetchSubscribedUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in.");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}api/subscription/subscribed-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const fetchedUsers: SubscribedUser[] = response.data.users;
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
        toast.success("Subscribed users fetched successfully!");
      } else {
        toast.error(response.data.message || "Failed to fetch subscribed users.");
      }
    } catch (error) {
      console.error("Error fetching subscribed users:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "An error occurred.");
      } else {
        toast.error("Failed to fetch subscribed users.");
      }
    }
  };

  useEffect(() => {
    fetchSubscribedUsers();
  }, [API_BASE_URL]);

  useEffect(() => {
    if (users.length > 0) {
      const titles = users
        .map(user => user.title)
        .filter((title, index, self): title is string => title !== null && self.indexOf(title) === index);
      setAvailableTitles(titles);
    }
  }, [users]);

  useEffect(() => {
    const applyFilters = () => {
      let tempUsers = [...users];

      if (filterTitle) {
        tempUsers = tempUsers.filter(user => user.title === filterTitle);
      }

      // Filter by expiry date range
      if (filterExpiryDateFrom && filterExpiryDateTo) {
        const fromDate = parseISO(filterExpiryDateFrom);
        const toDate = parseISO(filterExpiryDateTo);

        tempUsers = tempUsers.filter(user => {
          if (!user.subscriptionExpiresAt) return false;
          const expiryDate = parseISO(user.subscriptionExpiresAt);
          return expiryDate >= fromDate && expiryDate <= toDate;
        });
      } else if (filterExpiryDateFrom) {
        const fromDate = parseISO(filterExpiryDateFrom);
        tempUsers = tempUsers.filter(user => {
          if (!user.subscriptionExpiresAt) return false;
          return parseISO(user.subscriptionExpiresAt) >= fromDate;
        });
      } else if (filterExpiryDateTo) {
        const toDate = parseISO(filterExpiryDateTo);
        tempUsers = tempUsers.filter(user => {
          if (!user.subscriptionExpiresAt) return false;
          return parseISO(user.subscriptionExpiresAt) <= toDate;
        });
      }

      setFilteredUsers(tempUsers);
    };

    applyFilters();
  }, [users, filterTitle, filterExpiryDateFrom, filterExpiryDateTo]);

  const handleRemoveUser = async (userId: string) => {
    const confirmation = window.confirm("Are you sure you want to remove this user's subscription?");
    if (!confirmation) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in.");
        return;
      }

      const response = await axios.put(`${API_BASE_URL}api/subscription/unsubscribe-user/${userId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        // Remove the user from the local state
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
        setFilteredUsers(prevFiltered => prevFiltered.filter(user => user._id !== userId));
        toast.success("User subscription removed successfully!");
      } else {
        toast.error(response.data.message || "Failed to remove subscription.");
      }
    } catch (error) {
      console.error("Error removing subscription:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "An error occurred.");
      } else {
        toast.error("Failed to remove subscription.");
      }
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Subscribed Users</h1>

      {/* Filter Inputs */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select
          value={filterTitle}
          onChange={(e) => setFilterTitle(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 flex-1"
        >
          <option value="">All Plans</option>
          {availableTitles.map(title => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>

        <input
          type="date"
          placeholder="Expiry Date (From)"
          value={filterExpiryDateFrom}
          onChange={(e) => setFilterExpiryDateFrom(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 flex-1"
        />

        <input
          type="date"
          placeholder="Expiry Date (To)"
          value={filterExpiryDateTo}
          onChange={(e) => setFilterExpiryDateTo(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 flex-1"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">No users match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 relative">
              <div className="flex items-center mb-4">
                <MdAccountCircle className="text-4xl text-yellow-500 mr-4" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                  <p className="text-sm text-gray-500">ID: {user._id}</p>
                </div>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <MdEmail className="mr-2 text-yellow-500" />
                  <span>{user.email}</span>
                </li>
                <li className="flex items-center">
                  <MdPhone className="mr-2 text-yellow-500" />
                  <span>{user.phone}</span>
                </li>
                <li className="flex items-center">
                  <MdCreditCard className="mr-2 text-yellow-500" />
                  <span>Plan: <span className="font-medium">{user.title || "N/A"}</span></span>
                </li>
                {user.subscriptionStartDate && (
                  <li className="flex items-center">
                    <MdCalendarToday className="mr-2 text-yellow-500" />
                    <span>Start Date: {format(parseISO(user.subscriptionStartDate), 'PPP')}</span>
                  </li>
                )}
                {user.subscriptionExpiresAt && (
                  <li className="flex items-center">
                    <MdCalendarToday className="mr-2 text-yellow-500" />
                    <span>Expiry: <span className="text-red-500 font-medium">{format(parseISO(user.subscriptionExpiresAt), 'PPP')}</span></span>
                  </li>
                )}
                <li className="flex items-center">
                  <span>Age: {user.age}</span>
                </li>
                <li className="flex items-center">
                  <span>Gender: {user.gender}</span>
                </li>
              </ul>
              <button
                className="mt-4 w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                onClick={() => handleRemoveUser(user._id)}
              >
                <MdDeleteForever className="mr-2" /> Remove subscriber
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscribedUsersPage;
