import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { MdAccountCircle, MdEmail, MdPhone, MdCalendarToday, MdCreditCard } from "react-icons/md";
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
  const API_BASE_URL = import.meta.env.VITE_API;

  useEffect(() => {
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
          setUsers(response.data.users);
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

    fetchSubscribedUsers();
  }, [API_BASE_URL]);

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Subscribed Users</h1>
      {users.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">No users are currently subscribed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
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
                {/* --- FIX APPLIED HERE --- */}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscribedUsersPage;