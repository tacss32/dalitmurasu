import React, { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API;

interface OrderItem {
    title: string;
    quantity: number;
    price: number;
}

interface Order {
    _id: string;
    orderId: string;
    name: string;
    phone: string;
    address: string;
    items: OrderItem[];
    totalAmount: number;
    deliveryFee: number;
    paymentMode: "cod" | "online";
    paymentStatus: "pending" | "paid" | "failed";
    status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
    createdAt: string;
}

const MyOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

    // New state for filters
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [startDateFilter, setStartDateFilter] = useState<string>("");
    const [endDateFilter, setEndDateFilter] = useState<string>("");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem("clientToken");
            if (!token) {
                setError("You are not logged in. Please log in to view your orders.");
                setLoading(false);
                return;
            }

            const response = await axios.get(`${API}api/orders/myorders`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setOrders(response.data.data);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.message || "Failed to fetch orders.");
            } else {
                setError("An unexpected error occurred.");
            }
            console.error("Error fetching user orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        setCancellingOrder(orderId);
        try {
            const token = localStorage.getItem("clientToken");
            if (!token) {
                setError("Authentication token is missing. Please log in again.");
                return;
            }
            const response = await axios.put(
                `${API}api/orders/cancel/${orderId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.data.success) {
                setOrders((prevOrders) =>
                    prevOrders.map((order) =>
                        order._id === orderId ? { ...order, status: "cancelled" } : order
                    )
                );
                alert("Order successfully cancelled!");
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                alert(
                    err.response.data.message || "Failed to cancel order. Please try again."
                );
            } else {
                alert("An unexpected error occurred during cancellation.");
            }
            console.error("Error cancelling order:", err);
        } finally {
            setCancellingOrder(null);
        }
    };

    // Define statuses that should disable the cancel button
    const nonCancellableStatuses = ["shipped", "delivered", "cancelled"];

    // Filter orders based on state
    const filteredOrders = orders.filter((order) => {
        // Filter by status
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;

        // Filter by date range
        const orderDate = new Date(order.createdAt);
        const start = startDateFilter ? new Date(startDateFilter) : null;
        const end = endDateFilter ? new Date(endDateFilter) : null;

        // Adjust end date to include the whole day
        if (end) {
            end.setHours(23, 59, 59, 999);
        }

        const matchesDateRange = (!start || orderDate >= start) && (!end || orderDate <= end);

        return matchesStatus && matchesDateRange;
    });

    const getStatusColor = (status: Order["status"]) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "processing":
                return "bg-orange-100 text-orange-800";
            case "shipped":
                return "bg-blue-100 text-blue-800";
            case "delivered":
                return "bg-green-100 text-green-800";
            default:
                return "bg-red-100 text-red-800";
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen text-lg font-semibold text-gray-600">
                Loading your orders...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen text-red-600 font-semibold">
                Error: {error}
            </div>
        );
    }


    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold mb-6 text-highlight-1 flex items-center gap-2">
                    My Orders
                </h1>

                {/* Filter controls */}
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
                    <div className="w-full md:w-auto">
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Status
                        </label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="w-full md:w-auto">
                        <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            From Date
                        </label>
                        <input
                            type="date"
                            id="start-date-filter"
                            value={startDateFilter}
                            onChange={(e) => setStartDateFilter(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            To Date
                        </label>
                        <input
                            type="date"
                            id="end-date-filter"
                            value={endDateFilter}
                            onChange={(e) => setEndDateFilter(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                    </div>
                </div>
            </div>
            {filteredOrders.length === 0 ? (
                <div className="text-center text-gray-500 text-lg">
                    {orders.length === 0 ? "You have not placed any orders yet." : "No orders match the selected filters."}
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredOrders.map((order) => (
                        <div
                            key={order._id}
                            className="p-3 border rounded-xl shadow-md bg-background-to hover:shadow-lg transition"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xl font-semibold text-gray-700">
                                    Order ID:{" "}
                                    <span className="text-gray-900 font-normal">{order.orderId}</span>
                                </h2>
                                <span
                                    className={`px-3 py-1 rounded-full text-xl font-medium ${getStatusColor(
                                        order.status
                                    )}`}
                                >
                                    {order.status.toUpperCase()}
                                </span>
                            </div>

                            {/* Info */}
                            <p className="text-xl text-gray-700">
                                <strong>Order Date:</strong>{" "}
                                {new Date(order.createdAt).toLocaleDateString('en-GB')}
                            </p>

                            {/* Items */}
                            <div className="mt-4">
                                <h4 className="font-semibold text-gray-700 text-xl">Items:</h4>
                                <ul className="list-disc list-inside text-md text-gray-700 mt-1 space-y-1 ml-5">
                                    {order.items.map((item, index) => (
                                        <li key={index} className="flex justify-between">
                                            <span>
                                                {item.title} (x{item.quantity})
                                            </span>
                                            <span >₹{item.price.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                                {/* Subtotal line */}
                                <div className="flex justify-between mt-2 text-xl text-gray-700">
                                    <span>Subtotal:</span>
                                    <span>₹{order.totalAmount.toFixed(2)}</span>
                                </div>
                                {/* Delivery fee line */}
                                <div className="flex justify-between text-xl text-gray-700">
                                    <span>Delivery Fee:</span>
                                    <span>₹{order.deliveryFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2 text-xl text-gray-700 font-bold">
                                    <span>Total Amount:</span>
                                    <span>
                                        ₹{(order.totalAmount + order.deliveryFee).toFixed(2)}
                                    </span>
                                </div>
                            </div>


                            {/* Cancel Button */}
                            <div className="mt-4 text-right">
                                <button
                                    onClick={() => handleCancelOrder(order._id)}
                                    disabled={
                                        nonCancellableStatuses.includes(order.status) ||
                                        cancellingOrder === order._id
                                    }
                                    className={`py-2 px-4 rounded-md font-semibold text-sm transition-colors duration-300 ${nonCancellableStatuses.includes(order.status)
                                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                        : "bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                        }`}
                                >
                                    {cancellingOrder === order._id
                                        ? "Cancelling..."
                                        : "Cancel Order"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrders;