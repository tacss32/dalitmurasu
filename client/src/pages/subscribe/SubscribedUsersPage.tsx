import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    MdAccountCircle,
    MdEmail,
    MdCreditCard,
    MdAccessTime,
    MdAttachMoney,
    MdDeleteForever,
    MdPhone,
    MdCalendarToday,
    MdClose,
    MdFileDownload, // 💡 NEW: Import icon for export button
} from "react-icons/md";
import { format, parseISO } from "date-fns";

// Updated to remove phone, as it's now on ISubscriptionPayment
interface IUser {
    name: string;
    email: string;
}

interface IPlan {
    title: string;
    price: number;
}

// Updated to include 'canceled' status and 'phone' directly
interface ISubscriptionPayment {
    _id: string;
    userId: IUser;
    subscriptionPlanId: IPlan;
    amount: number;
    payment_status: "success" | "failed" | "canceled" | "pending";
    createdAt: string;
    phone?: string;
    startDate?: string;
    endDate?: string;
}

const FilteredSubscriptionPayments: React.FC = () => {
    const API_BASE_URL = import.meta.env.VITE_API;

    const [filteredPayments, setFilteredPayments] = useState<ISubscriptionPayment[]>([]);
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [selectedPayment, setSelectedPayment] = useState<ISubscriptionPayment | null>(null);

    const fetchPayments = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Authentication token missing. Please log in.");
                return;
            }

            const params: any = {};
            if (fromDate) params.start_date = fromDate;
            if (toDate) params.end_date = toDate;
            if (searchQuery) params.search = searchQuery;

            const res = await axios.get(`${API_BASE_URL}api/subscription/subscribed-users`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            if (res.data.success) {
                const allPayments = res.data.data as ISubscriptionPayment[];

                // LOCAL FILTERING: Show only 'success' or 'canceled' payments
                const filtered = allPayments.filter(
                    (payment) =>
                        payment.payment_status === "success" || payment.payment_status === "canceled"
                );

                setFilteredPayments(filtered);
            } else {
                toast.error("Failed to load subscription payments.");
            }
        } catch (err) {
            console.error("Error fetching subscription payments:", err);
            toast.error("Failed to fetch subscription payments.");
        }
    }, [API_BASE_URL, fromDate, toDate, searchQuery]);

    // 💡 NEW FUNCTION: Converts JSON data to CSV format
    const convertToCSV = (data: ISubscriptionPayment[]) => {
        const headers = [
            "ID", "User Name", "Email", "Phone", "Plan Title",
            "Amount (₹)", "Payment Status", "Subscription Start Date",
            "Subscription End Date", "Payment Date"
        ];

        const rows = data.map(payment => [
            `"${payment._id}"`, // Ensure ID is treated as a string to preserve leading zeros if any
            `"${payment.userId?.name || 'N/A'}"`,
            `"${payment.userId?.email || 'N/A'}"`,
            `"${payment.phone || 'N/A'}"`,
            `"${payment.subscriptionPlanId?.title || 'Unknown'}"`,
            payment.amount,
            `"${payment.payment_status.toUpperCase()}"`,
            `"${payment.startDate ? format(parseISO(payment.startDate), 'yyyy-MM-dd') : 'N/A'}"`,
            `"${payment.endDate ? format(parseISO(payment.endDate), 'yyyy-MM-dd') : 'N/A'}"`,
            `"${payment.createdAt ? format(parseISO(payment.createdAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}"`
        ].join(','));

        return [headers.join(','), ...rows].join('\n');
    };

    // 💡 NEW FUNCTION: Handles the CSV file creation and download
    const handleExportCSV = () => {
        if (filteredPayments.length === 0) {
            toast.info("No data to export.");
            return;
        }

        const csvData = convertToCSV(filteredPayments);

        // Create a Blob with the CSV data
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });

        // Create a temporary link element for download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);

        // Set filename based on current filters
        const filename = `payments_${fromDate || 'start'}_to_${toDate || 'end'}_${searchQuery || 'all'}.csv`;
        link.setAttribute('download', filename);

        // Append link to the body, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Payments exported successfully!");
    };


    const openDetailsModal = (payment: ISubscriptionPayment) => {
        setSelectedPayment(payment);
    };

    const closeDetailsModal = () => {
        setSelectedPayment(null);
    };

    // 1. Function to REMOVE RECORD (Unsubscribe/Delete) - Keep as is
    const handleUnsubscribe = async (paymentId: string) => {
        if (!window.confirm("WARNING: Are you sure you want to PERMANENTLY DELETE this subscription record from the database?"))
            return;

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Authentication token missing. Please log in.");
                return;
            }

            // Calls the API to remove the record
            const res = await axios.put(
                `${API_BASE_URL}api/subscription/unsubscribe-user/${paymentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                toast.success(res.data.message || "Subscription record deleted.");
                setFilteredPayments((prev) =>
                    prev.filter((payment) => payment._id !== paymentId)
                );
                setSelectedPayment(null);
            } else {
                toast.error(res.data.message || "Failed to delete subscription record.");
            }
        } catch (err) {
            console.error("Error deleting subscription record:", err);
            toast.error("Failed to delete subscription record.");
        }
    };

    // 2. Function to CANCEL SUBSCRIPTION (Status Change, not delete) - Keep as is
    const handleCancelSubscription = async (paymentId: string) => {
        if (!window.confirm("Are you sure you want to CANCEL this user's subscription? (Record remains)"))
            return;

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Authentication token missing. Please log in.");
                return;
            }

            // NOTE: This PUT endpoint must be implemented on your backend 
            const res = await axios.put(
                `${API_BASE_URL}api/subscription/cancel-subscription/${paymentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                toast.success(res.data.message || "Subscription successfully canceled.");

                // Update the local state to show "CANCELED" status
                setFilteredPayments(prev =>
                    prev.map(payment =>
                        payment._id === paymentId ? { ...payment, payment_status: "canceled" } : payment
                    )
                );

                setSelectedPayment(null);
            } else {
                toast.error(res.data.message || "Failed to cancel subscription.");
            }
        } catch (err) {
            console.error("Error canceling subscription:", err);
            toast.error("Failed to cancel subscription.");
        }
    };

    // Debouncing useEffect hook: Calls fetchPayments 500ms after user stops typing/changing dates
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchPayments();
        }, 500); // 500ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery, fromDate, toDate, fetchPayments]); // Dependencies trigger the effect

    return (
        <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                Subscription Payments 💳
            </h1>

            {/* FILTERS AND EXPORT BUTTONS */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                <div className="flex flex-col md:flex-row gap-4 flex-1 items-end">

                    {/* 1. SEARCH INPUT */}
                    <div className="flex flex-col flex-1 min-w-[200px]">
                        <label className="text-sm text-gray-600 mb-1">Search User (Name/Email)</label>
                        <input
                            type="text"
                            placeholder="Name or Email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>

                    {/* 2. From Date */}
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600 mb-1">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>

                    {/* 3. To Date */}
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600 mb-1">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    {/* 💡 NEW: Export CSV Button */}
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                        title="Export current filtered data to CSV"
                    >
                        <MdFileDownload className="mr-2 text-xl" />
                        Export CSV
                    </button>

                    {/* Apply Filters Button */}
                    <button
                        onClick={fetchPayments}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            <hr className="my-6" />

            {/* DISPLAY (Remaining JSX is unchanged) */}
            {filteredPayments.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <p className="text-gray-600">No payments found for selected filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPayments.map((payment) => (
                        <div
                            key={payment._id}
                            onClick={() => openDetailsModal(payment)}
                            className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-yellow-400 relative cursor-pointer"
                        >
                           
                            {/* User Info */}
                            <div className="flex items-center mb-4 border-b pb-2">
                                <MdAccountCircle className="text-4xl text-yellow-500 mr-3" />
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {payment.userId?.name || "N/A"}
                                    </h2>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <MdEmail className="mr-1" />
                                        <span>{payment.userId?.email || "N/A"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info (Summary) */}
                            <ul className="space-y-2 text-gray-700">
                                <li className="flex items-center">
                                    <MdCreditCard className="mr-2 text-yellow-500" />
                                    <span>
                                        Plan:{" "}
                                        <span className="font-medium">
                                            {payment.subscriptionPlanId?.title || "Unknown"}
                                        </span>
                                    </span>
                                </li>
                                <li className="flex items-center">
                                    <MdAttachMoney className="mr-2 text-green-500" />
                                    <span>Amount: ₹{payment.amount}</span>
                                </li>
                                <li className="flex items-center">
                                    <MdAccessTime className="mr-2 text-yellow-500" />
                                    <span>
                                        Expiry Date:{" "}
                                        {payment.endDate
                                            ? format(parseISO(payment.endDate), "PP")
                                            : "N/A"}
                                    </span>
                                </li>
                                <li className="flex items-center">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${payment.payment_status === "success"
                                            ? "bg-green-100 text-green-700"
                                            : payment.payment_status === "failed"
                                                ? "bg-red-100 text-red-700"
                                                : payment.payment_status === "canceled"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {payment.payment_status.toUpperCase()}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* --- Detail Modal --- (Unchanged) */}
            {selectedPayment && (
                <div
                    className="fixed inset-0  backdrop-blur-sm bg-opacity-75 flex items-center justify-center p-4 z-50"
                    onClick={closeDetailsModal}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeDetailsModal}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                            title="Close"
                        >
                            <MdClose className="text-2xl" />
                        </button>

                        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                            Subscription Details
                        </h2>

                        <ul className="space-y-4 text-gray-700">
                            {/* User Details: Name */}
                            <li className="flex items-center">
                                <MdAccountCircle className="mr-3 text-3xl text-yellow-500" />
                                <div>
                                    <p className="font-semibold text-lg">{selectedPayment.userId?.name || "N/A"}</p>
                                    <p className="text-sm text-gray-500">User Name</p>
                                </div>
                            </li>
                            {/* User Details: Email */}
                            <li className="flex items-center">
                                <MdEmail className="mr-3 text-xl text-blue-500" />
                                <div>
                                    <p>{selectedPayment.userId?.email || "N/A"}</p>
                                    <p className="text-sm text-gray-500">Email</p>
                                </div>
                            </li>
                            {/* User Details: Phone */}
                            <li className="flex items-center">
                                <MdPhone className="mr-3 text-xl text-purple-500" />
                                <div>
                                    <p>{selectedPayment.phone || "N/A"}</p>
                                    <p className="text-sm text-gray-500">Phone</p>
                                </div>
                            </li>

                            <hr />

                            {/* Plan Title */}
                            <li className="flex items-center">
                                <MdCreditCard className="mr-3 text-xl text-yellow-500" />
                                <div>
                                    <p className="font-semibold">{selectedPayment.subscriptionPlanId?.title || "Unknown"}</p>
                                    <p className="text-sm text-gray-500">Plan Title</p>
                                </div>
                            </li>

                            {/* Start Date */}
                            {selectedPayment.startDate && (
                                <li className="flex items-center">
                                    <MdCalendarToday className="mr-3 text-xl text-green-500" />
                                    <div>
                                        <p>{format(parseISO(selectedPayment.startDate), "PP")}</p>
                                        <p className="text-sm text-gray-500">Start Date</p>
                                    </div>
                                </li>
                            )}

                            {/* End Date */}
                            {selectedPayment.endDate && (
                                <li className="flex items-center">
                                    <MdCalendarToday className="mr-3 text-xl text-red-500" />
                                    <div>
                                        <p>{format(parseISO(selectedPayment.endDate), "PP")}</p>
                                        <p className="text-sm text-gray-500">End Date</p>
                                    </div>
                                </li>
                            )}

                            {/* Amount & Status */}
                            <li className="flex items-center">
                                <MdAttachMoney className="mr-3 text-xl text-green-500" />
                                <div>
                                    <p className="font-bold">₹{selectedPayment.amount} ({selectedPayment.payment_status.toUpperCase()})</p>
                                    <p className="text-sm text-gray-500">Payment Amount & Status</p>
                                </div>
                            </li>
                        </ul>

                        <hr className="my-6" />

                        {/* --- Action Buttons: Cancel (Status Change) vs. Delete (Record Removal) --- */}
                        <div className="flex justify-between gap-3 flex-wrap">

                            {/* 1. Cancel Subscription Button (Status Change) */}
                            <button
                                onClick={() => selectedPayment && handleCancelSubscription(selectedPayment._id)}
                                className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex-1 min-w-[180px]"
                            >
                                <MdCalendarToday className="mr-2" />
                                Cancel Subscription
                            </button>

                            <div className="flex gap-3">
                                {/* 2. Unsubscribe / Delete Record Button (Permanent Removal) */}
                                <button
                                    onClick={() => selectedPayment && handleUnsubscribe(selectedPayment._id)}
                                    className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    <MdDeleteForever className="mr-2" />
                                    Delete Record
                                </button>

                               
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilteredSubscriptionPayments;