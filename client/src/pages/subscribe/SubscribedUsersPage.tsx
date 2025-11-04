import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    MdAccountCircle,
    MdEmail,
    MdCreditCard,
    MdAccessTime,
    MdAttachMoney,
    MdDeleteForever,
} from "react-icons/md";
import { format, parseISO } from "date-fns";

interface IUser {
    name: string;
    email: string;
}

interface IPlan {
    title: string;
    price: number;
}

interface ISubscriptionPayment {
    _id: string;
    userId: IUser;
    subscriptionPlanId: IPlan;
    amount: number;
    payment_status:  "success" | "failed";
    createdAt: string;
}

const FilteredSubscriptionPayments: React.FC = () => {
    const API_BASE_URL = import.meta.env.VITE_API;

    const [filteredPayments, setFilteredPayments] = useState<ISubscriptionPayment[]>([]);
    // const [paymentStatus, setPaymentStatus] = useState<string>("");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Authentication token missing. Please log in.");
                return;
            }

            const params: any = {
                payment_status: "success" 
            };
            if (fromDate) params.start_date = fromDate;
            if (toDate) params.end_date = toDate;

            const res = await axios.get(`${API_BASE_URL}api/subscription/subscribed-users`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            if (res.data.success) {
                setFilteredPayments(res.data.data);
            } else {
                toast.error("Failed to load subscription payments.");
            }
        } catch (err) {
            console.error("Error fetching subscription payments:", err);
            toast.error("Failed to fetch subscription payments.");
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!window.confirm("Are you sure you want to delete this subscription payment record?"))
            return;

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Authentication token missing. Please log in.");
                return;
            }

            const res = await axios.put(
                `${API_BASE_URL}api/subscription/unsubscribe-user/${paymentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                toast.success(res.data.message);
                setFilteredPayments((prev) =>
                    prev.filter((payment) => payment._id !== paymentId)
                );
            } else {
                toast.error(res.data.message || "Failed to delete subscription payment.");
            }
        } catch (err) {
            console.error("Error deleting subscription payment:", err);
            toast.error("Failed to delete subscription payment.");
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    return (
        <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                Subscription Payments
            </h1>

            {/* FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
                {/* <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 flex-1"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                </select> */}

                {/* Date Range Filters */}
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600 mb-1">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>

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

                <button
                    onClick={fetchPayments}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    Apply
                </button>
            </div>

            {/* DISPLAY */}
            {filteredPayments.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <p className="text-gray-600">No payments found for selected filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPayments.map((payment) => (
                        <div
                            key={payment._id}
                            className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-yellow-400 relative"
                        >
                            {/* Delete Button */}
                            <button
                                onClick={() => handleDeletePayment(payment._id)}
                                className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors"
                                title="Delete Subscription Payment"
                            >
                                <MdDeleteForever className="text-2xl" />
                            </button>

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

                            {/* Payment Info */}
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
                                        Date:{" "}
                                        {payment.createdAt
                                            ? format(parseISO(payment.createdAt), "PPPp")
                                            : "N/A"}
                                    </span>
                                </li>

                                <li className="flex items-center">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${payment.payment_status === "success"
                                                ? "bg-green-100 text-green-700"
                                                : payment.payment_status === "failed"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-yellow-100 text-yellow-700"
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
        </div>
    );
};

export default FilteredSubscriptionPayments;
