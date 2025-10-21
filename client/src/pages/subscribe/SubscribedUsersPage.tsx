import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { MdAccountCircle, MdEmail, MdPhone, MdCalendarToday, MdCreditCard, MdDeleteForever } from "react-icons/md";
import { format, parseISO } from 'date-fns';

// --- UPDATED INTERFACE: Added _id for the plan object ---
interface ActiveSubscription {
    _id: string; // <--- ADD THIS
    subscriptionStartDate: string;
    subscriptionExpiresAt: string;
    title: string | null;
}

interface SubscribedUser {
    _id: string;
    name: string;
    email: string;
    gender: string;
    age: number;
    phone: string;
    activeSubscriptions: ActiveSubscription[];
}

const SubscribedUsersPage: React.FC = () => {
    const [users, setUsers] = useState<SubscribedUser[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<SubscribedUser[]>([]);
    const [filterTitle, setFilterTitle] = useState("");
    const [filterExpiryDateFrom, setFilterExpiryDateFrom] = useState("");
    const [filterExpiryDateTo, setFilterExpiryDateTo] = useState("");
    const [availableTitles, setAvailableTitles] = useState<string[]>([]);
    const API_BASE_URL = import.meta.env.VITE_API;

    // ... (Your fetchSubscribedUsers and two useEffect blocks remain the same, 
    //     except the backend logic will now return the plan _id to fill the interface) ...
    // NOTE: Your backend 'getSubscribedUsers' function will need to include 
    // the '_id' from the subscriptionPlan array in the 'plans' object. 
    // Make sure to update the mapping logic in 'getSubscribedUsers' as well!
    // Example: const plans = activePlans.map((plan) => ({ _id: plan._id, ... }));

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
                // toast.success("Subscribed users fetched successfully! 🚀");
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

    // ... (Your two useEffect blocks for availableTitles and applyFilters remain the same) ...

    useEffect(() => {
        if (users.length > 0) {
            // Use flatMap to combine all titles from all activeSubscriptions arrays
            const allTitles = users.flatMap(user =>
                user.activeSubscriptions.map(sub => sub.title)
            );

            const uniqueTitles = allTitles
                .filter((title, index, self): title is string =>
                    title !== null && self.indexOf(title) === index
                );
            setAvailableTitles(uniqueTitles);
        }
    }, [users]);

    useEffect(() => {
        const applyFilters = () => {
            let tempUsers = [...users];

            // 1. Filter by Plan Title: User must have at least one subscription matching the filter
            if (filterTitle) {
                tempUsers = tempUsers.filter(user =>
                    user.activeSubscriptions.some(sub => sub.title === filterTitle)
                );
            }

            // 2. Filter by Expiry Date Range: User must have at least one subscription expiring within the range
            if (filterExpiryDateFrom || filterExpiryDateTo) {
                const fromDate = filterExpiryDateFrom ? parseISO(filterExpiryDateFrom) : new Date(0);
                // Use a date far in the future if 'To' date is not set
                const toDate = filterExpiryDateTo ? parseISO(filterExpiryDateTo) : new Date(8640000000000000);

                tempUsers = tempUsers.filter(user =>
                    user.activeSubscriptions.some(sub => {
                        if (!sub.subscriptionExpiresAt) return false;
                        const expiryDate = parseISO(sub.subscriptionExpiresAt);
                        // The expiry date of the plan must be within the specified range
                        return expiryDate >= fromDate && expiryDate <= toDate;
                    })
                );
            }

            setFilteredUsers(tempUsers);
        };

        applyFilters();
    }, [users, filterTitle, filterExpiryDateFrom, filterExpiryDateTo]);


    // --- NEW: Function to remove a single plan ---
    const handleRemovePlan = async (userId: string, planId: string, planTitle: string | null) => {
        const confirmation = window.confirm(`Are you sure you want to remove the plan: ${planTitle} for this user?`);
        if (!confirmation) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Authentication token not found. Please log in.");
                return;
            }

            // Backend call to remove the specific plan
            const response = await axios.put(`${API_BASE_URL}api/subscription/unsubscribe-user/${userId}`, { planId }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                toast.success(`${planTitle} subscription removed successfully!`);

                const hasActiveSubs: boolean = response.data.hasActiveSubscriptions;

                // Optimistically update the state
                setUsers(prevUsers => {
                    return prevUsers.map(user => {
                        if (user._id === userId) {
                            if (!hasActiveSubs) {
                                // If the user has no more active subscriptions, remove them from the list
                                return null;
                            }
                            // Otherwise, filter out the removed plan
                            return {
                                ...user,
                                activeSubscriptions: user.activeSubscriptions.filter(sub => sub._id !== planId)
                            };
                        }
                        return user;
                    }).filter(user => user !== null) as SubscribedUser[]; // Filter out nulls
                });
                // The filtering useEffect will handle updating filteredUsers
            } else {
                toast.error(response.data.message || "Failed to remove subscription plan.");
            }
        } catch (error) {
            console.error("Error removing subscription plan:", error);
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.message || "An error occurred.");
            } else {
                toast.error("Failed to remove subscription plan.");
            }
        }
    };


    // --- REVISED: Function to remove all plans (original unsubscribe) ---
    // This is now an option to quickly remove ALL subscriptions for a user
    const handleRemoveAllUserSubscriptions = async (userId: string) => {
        const confirmation = window.confirm("Are you sure you want to remove ALL active subscriptions for this user?");
        if (!confirmation) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Authentication token not found. Please log in.");
                return;
            }

            // Backend call without planId to remove all subscriptions
            const response = await axios.put(`${API_BASE_URL}api/subscription/unsubscribe-user/${userId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                // Remove the user from the local state completely
                setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
                // setFilteredUsers will update via useEffect
                toast.success("User completely unsubscribed! 👋");
            } else {
                toast.error(response.data.message || "Failed to remove all subscriptions.");
            }
        } catch (error) {
            console.error("Error removing all subscriptions:", error);
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.message || "An error occurred.");
            } else {
                toast.error("Failed to remove all subscriptions.");
            }
        }
    };

    return (
        <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Subscribed Users</h1>

            {/* Filter Inputs (NO CHANGE) */}
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

                            {/* --- USER HEADER INFO (NO CHANGE) --- */}
                            <div className="flex items-center mb-4 border-b pb-4">
                                <MdAccountCircle className="text-4xl text-yellow-500 mr-4" />
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                                    <p className="text-sm text-gray-500">ID: {user._id}</p>
                                </div>
                            </div>

                            {/* --- USER CONTACT/DEMOGRAPHICS (NO CHANGE) --- */}
                            <ul className="space-y-2 text-gray-700 mb-4">
                                <li className="flex items-center">
                                    <MdEmail className="mr-2 text-yellow-500" />
                                    <span>{user.email}</span>
                                </li>
                                <li className="flex items-center">
                                    <MdPhone className="mr-2 text-yellow-500" />
                                    <span>{user.phone}</span>
                                </li>
                                <li className="flex items-center text-sm">
                                    <span>Age: {user.age} / Gender: {user.gender}</span>
                                </li>
                            </ul>

                            {/* --- ACTIVE SUBSCRIPTIONS (Loop - REVISED) --- */}
                            <h3 className="text-lg font-bold mt-4 mb-2 text-yellow-600 border-t pt-4">Active Plans ({user.activeSubscriptions.length})</h3>

                            {user.activeSubscriptions.map((sub, index) => (
                                <div key={sub._id || index} className="mb-3 p-3 border border-gray-200 rounded-md bg-yellow-50 relative">
                                    {/* Plan Details */}
                                    <li className="flex items-center list-none mb-1">
                                        <MdCreditCard className="mr-2 text-yellow-600" />
                                        <span>Plan: <span className="font-medium">{sub.title || "N/A"}</span></span>
                                    </li>
                                    {sub.subscriptionStartDate && (
                                        <li className="flex items-center list-none mb-1 text-sm text-gray-600">
                                            <MdCalendarToday className="mr-2 text-yellow-600" />
                                            <span>Start: {format(parseISO(sub.subscriptionStartDate), 'PPP')}</span>
                                        </li>
                                    )}
                                    {sub.subscriptionExpiresAt && (
                                        <li className="flex items-center list-none text-sm">
                                            <MdCalendarToday className="mr-2 text-yellow-600" />
                                            <span>Expires: <span className="text-red-500 font-medium">{format(parseISO(sub.subscriptionExpiresAt), 'PPP')}</span></span>
                                        </li>
                                    )}

                                    {/* REMOVE PLAN BUTTON (NEW) */}
                                    <button
                                        className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 transition-colors"
                                        onClick={() => handleRemovePlan(user._id, sub._id, sub.title)}
                                        title={`Remove only the ${sub.title} plan`}
                                    >
                                        <MdDeleteForever className="text-xl" />
                                    </button>
                                </div>
                            ))}

                            {/* --- ACTION BUTTON (Revised to 'Remove All') --- */}
                            {user.activeSubscriptions.length > 0 && (
                                <button
                                    className="mt-4 w-full flex items-center justify-center bg-highlight-1 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors duration-300"
                                    onClick={() => handleRemoveAllUserSubscriptions(user._id)}
                                >
                                    <MdDeleteForever className="mr-2" /> Remove ALL Subscriptions
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubscribedUsersPage;