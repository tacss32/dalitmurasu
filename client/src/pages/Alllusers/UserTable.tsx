import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface IUser {
    _id: string;
    name: string;
    email: string;
    phone: string;
    subscription: {
        isActive: boolean;
        planTitle?: string;
        endDate?: string;
    };
}

const SERVER_URL = import.meta.env.VITE_API;

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<IUser[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("token");
            const response = await axios.get(`${SERVER_URL}api/subscription/users`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search },
                withCredentials: true,
            });

            if (response.data.success) {
                setUsers(response.data.users);
            } else {
                toast.error("Failed to fetch users");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error fetching users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search to avoid spamming requests
        const timeout = setTimeout(() => {
            fetchUsers();
        }, 400);

        return () => clearTimeout(timeout);
    }, [search]);

    // --- CSV Export Logic ---
    const exportToCSV = () => {
        if (users.length === 0) {
            toast.info("No users to export.");
            return;
        }

        // 1. Define the CSV Headers
        const headers = [
            "Name",
            "Email",
            "Phone",
            "Subscription Status",
            "Plan",
            "Expiry Date",
        ];

        // 2. Map the user data to CSV row format
        const csvRows = users.map((user) => {
            const subscriptionStatus = user.subscription.isActive ? "Active" : "Not Subscribed";
            const planTitle = user.subscription.isActive ? user.subscription.planTitle || "" : "";
            const endDateFormatted =
                user.subscription.isActive && user.subscription.endDate
                    ? new Date(user.subscription.endDate).toLocaleDateString()
                    : "";

            // Escape strings for CSV (simple double-quote escape)
            const escape = (str: string | undefined | null) =>
                `"${(str || "").toString().replace(/"/g, '""')}"`;

            return [
                escape(user.name),
                escape(user.email),
                escape(user.phone),
                escape(subscriptionStatus),
                escape(planTitle),
                escape(endDateFormatted),
            ].join(",");
        });

        // 3. Combine headers and rows
        const csvContent =
            headers.join(",") + "\n" + csvRows.join("\n");

        // 4. Create a Blob and trigger download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.setAttribute("href", url);
        link.setAttribute("download", "users_export.csv");
        link.style.visibility = 'hidden'; // Hide the element

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Clean up

        toast.success("Users exported successfully!");
    };
    // -------------------------

    return (
        <div className="p-6">
            {/* Header and Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h1 className="text-2xl font-semibold text-gray-800 mb-3 sm:mb-0">
                    All Users
                </h1>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={exportToCSV}
                        disabled={loading}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50"
                    >
                        Export as CSV 📄
                    </button>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
                        <tr>
                            <th className="px-6 py-3 text-left">Name</th>
                            <th className="px-6 py-3 text-left">Email</th>
                            <th className="px-6 py-3 text-left">Phone</th>
                            <th className="px-6 py-3 text-left">Subscription Status</th>
                            <th className="px-6 py-3 text-left">Plan</th>
                            <th className="px-6 py-3 text-left">Expiry Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6 text-gray-500">
                                    Loading users...
                                </td>
                            </tr>
                        ) : users.length > 0 ? (
                            users.map((user) => (
                                <tr
                                    key={user._id}
                                    className="border-t hover:bg-gray-50 transition"
                                >
                                    <td className="px-6 py-3">{user.name || "—"}</td>
                                    <td className="px-6 py-3">{user.email || "—"}</td>
                                    <td className="px-6 py-3">{user.phone || "—"}</td>
                                    <td className="px-6 py-3">
                                        {user.subscription.isActive ? (
                                            <span className="text-green-600 font-medium">Active</span>
                                        ) : (
                                            <span className="text-red-500 font-medium">
                                                Not Subscribed
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3">
                                        {user.subscription.isActive
                                            ? user.subscription.planTitle
                                            : "—"}
                                    </td>
                                    <td className="px-6 py-3">
                                        {user.subscription.isActive && user.subscription.endDate
                                            ? new Date(
                                                user.subscription.endDate
                                            ).toLocaleDateString()
                                            : "—"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="text-center py-6 text-gray-500 italic"
                                >
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersPage;