import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    MdPerson,
    MdCheckCircle,
    MdCancel,
    MdStar,
} from "react-icons/md";

interface IUser {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    subscription: {
        isActive: boolean;
        planTitle?: string;
        endDate?: string;
    };
}

const SERVER_URL = import.meta.env.VITE_API;

const Dashboard: React.FC = () => {
    const [users, setUsers] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const response = await axios.get(`${SERVER_URL}api/subscription/users`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            if (response.data.success) {
                setUsers(response.data.users);
            } else {
                toast.error("Failed to fetch user data");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error fetching users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // 🧮 Compute stats from user list
    const totalUsers = users.length;
    const activeSubscribers = users.filter((u) => u.subscription?.isActive).length;
    const inactiveUsers = totalUsers - activeSubscribers;

    // Unique plan names count
    const uniquePlans = Array.from(
        new Set(users.map((u) => u.subscription?.planTitle).filter(Boolean))
    ).length;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-semibold text-gray-800 mb-6">
             Dashboard
            </h1>

            {loading ? (
                <div className="text-gray-500 text-center">Loading dashboard...</div>
            ) : totalUsers === 0 ? (
                <div className="text-gray-500 text-center">No dashboard data.</div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="bg-white shadow rounded-xl p-5 flex items-center space-x-4 border border-gray-100">
                            <MdPerson className="text-blue-500 text-3xl" />
                            <div>
                                <p className="text-gray-600 text-sm">Total Users</p>
                                <h2 className="text-2xl font-bold">{totalUsers}</h2>
                            </div>
                        </div>

                        <div className="bg-white shadow rounded-xl p-5 flex items-center space-x-4 border border-gray-100">
                            <MdCheckCircle className="text-green-500 text-3xl" />
                            <div>
                                <p className="text-gray-600 text-sm">Active Subscribers</p>
                                <h2 className="text-2xl font-bold">{activeSubscribers}</h2>
                            </div>
                        </div>

                        <div className="bg-white shadow rounded-xl p-5 flex items-center space-x-4 border border-gray-100">
                            <MdCancel className="text-red-500 text-3xl" />
                            <div>
                                <p className="text-gray-600 text-sm">Inactive Users</p>
                                <h2 className="text-2xl font-bold">{inactiveUsers}</h2>
                            </div>
                        </div>

                        <div className="bg-white shadow rounded-xl p-5 flex items-center space-x-4 border border-gray-100">
                            <MdStar className="text-yellow-500 text-3xl" />
                            <div>
                                <p className="text-gray-600 text-sm">Unique Plans</p>
                                <h2 className="text-2xl font-bold">{uniquePlans}</h2>
                            </div>
                        </div>
                    </div>

                    {/* Simple plan breakdown */}
                    <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
                        <h2 className="text-lg font-bold mb-4 text-gray-800 ">
                            Plan Distribution
                        </h2>

                        <ul className="space-y-2">
                            {Array.from(
                                new Set(users.map((u) => u.subscription?.planTitle).filter(Boolean))
                            ).map((planTitle, idx) => {
                                const count = users.filter(
                                    (u) => u.subscription?.planTitle === planTitle
                                ).length;
                               

                                return (
                                    <li
                                        key={idx}
                                        className="flex justify-between text-2xl border-b pb-2 text-gray-700"
                                    >
                                        <span>{planTitle}</span>
                                        <span>
                                            {count} users 
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
