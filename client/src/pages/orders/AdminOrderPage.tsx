import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdEdit, MdClose, MdCheckCircle, MdErrorOutline, MdInfoOutline, MdFileDownload } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { CSVLink } from "react-csv";

// Interfaces (re-defined for clarity, assuming they are not globally available)
interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string; // Keep _id for internal API calls
  orderId: string; // The user-friendly order ID
  userId: string; // Could be ObjectId, but string for display
  name: string;
  phone: string;
  address: string; // Added address to the Order interface
  items: OrderItem[];
  totalAmount: number;
  paymentMode: "cod" | "online";
  paymentStatus: "pending" | "paid";
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New state for filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  // State for the update modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<Order["status"]>("pending");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const navigate = useNavigate(); // For potential redirection on auth failure

  // Function to fetch all orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const token = localStorage.getItem("token"); // Get admin token from localStorage
    if (!token) {
      setError("Admin not authenticated. Please log in.");
      setLoading(false);
      navigate("/auth/login", { replace: true });
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch orders.");
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      if (err.response && err.response.status === 401) {
        setError("Unauthorized: Your session may have expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/auth/login", { replace: true });
      } else {
        setError(err.response?.data?.message || "An error occurred while fetching orders.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Effect to load orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Function to open the update modal
  const openUpdateModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status); // Pre-fill with current status
    setIsUpdateModalOpen(true);
    setError(null); // Clear any previous errors
    setSuccessMessage(null); // Clear any previous success messages
  };

  // Function to close the update modal
  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedOrder(null);
    setNewStatus("pending"); // Reset
  };

  // Function to handle order status update
  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Admin not authenticated. Please log in.");
      setIsUpdating(false);
      navigate("/auth/login", { replace: true });
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}api/orders/${selectedOrder._id}`, // Use _id for the API call
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage("Order updated successfully!");
        fetchOrders(); // Re-fetch orders to show updated data
        closeUpdateModal(); // Close modal on success
        setTimeout(() => setSuccessMessage(null), 3000); // Clear success message
      } else {
        setError(response.data.message || "Failed to update order.");
      }
    } catch (err: any) {
      console.error("Error updating order:", err);
      if (err.response && err.response.status === 401) {
        setError("Unauthorized: Your session may have expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/auth/login", { replace: true });
      } else {
        setError(err.response?.data?.message || "An error occurred while updating the order.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Helper to get status color
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "processing":
        return "text-blue-600 bg-blue-100";
      case "shipped":
        return "text-purple-600 bg-purple-100";
      case "delivered":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Filter orders based on state
  const filteredOrders = orders.filter((order) => {
    // Filter by status
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    // Filter by date
    const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
    const matchesDate = !dateFilter || orderDate === dateFilter;

    return matchesStatus && matchesDate;
  });

  // Prepare data for CSV export
  const csvData = filteredOrders.map((order) => ({
    "Order ID": order.orderId,
    "Customer Name": order.name,
    "Customer Phone": order.phone,
    "Delivery Address": order.address.replace(/\n/g, ", "), // Replace newlines with commas for a single line
    "Total Amount": `₹${order.totalAmount.toFixed(2)}`,
    Status: order.status,
    "Payment Mode": order.paymentMode,
    "Payment Status": order.paymentStatus,
    "Ordered On": formatDate(order.createdAt),
    "Items": order.items.map(item => `${item.title} (x${item.quantity})`).join('; '), // List items for CSV
  }));

  // Define headers for the CSV
  const csvHeaders = [
    { label: "Order ID", key: "Order ID" },
    { label: "Customer Name", key: "Customer Name" },
    { label: "Customer Phone", key: "Customer Phone" },
    { label: "Delivery Address", key: "Delivery Address" },
    { label: "Total Amount", key: "Total Amount" },
    { label: "Status", key: "Status" },
    { label: "Payment Mode", key: "Payment Mode" },
    { label: "Payment Status", key: "Payment Status" },
    { label: "Ordered On", key: "Ordered On" },
    { label: "Items", key: "Items" },
  ];

  return (
    <div className="flex-1 p-6 bg-gray-100 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-4xl font-extrabold text-gray-800">
          Manage Orders
        </h1>
        {filteredOrders.length > 0 && (
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename={`orders-${new Date().toISOString()}.csv`}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 shadow-md text-sm"
          >
            <MdFileDownload className="mr-2 text-lg" />
            Export as CSV
          </CSVLink>
        )}
      </div>

      {/* Filter controls */}
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <div className="w-full md:w-auto">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
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
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
          <input
            type="date"
            id="date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="ml-4 text-gray-700">Loading orders...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <MdErrorOutline className="text-xl mr-2" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <MdCheckCircle className="text-xl mr-2" />
          <span>{successMessage}</span>
        </div>
      )}

      {!loading && filteredOrders.length === 0 && !error && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative flex items-center justify-center">
          <MdInfoOutline className="text-xl mr-2" />
          <span>No orders match the current filters. Try adjusting your search criteria.</span>
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Mobile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordered On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                    {order.phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                    {order.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ₹{order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.paymentMode.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openUpdateModal(order)}
                      className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                      title="Edit Order"
                    >
                      <MdEdit className="text-xl" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Update Order Modal */}
      {isUpdateModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-md">
            <div className="flex justify-between items-center border-b pb-2 mb-3">
              <h2 className="text-xl font-bold text-gray-800">Update Order</h2>
              <button
                onClick={closeUpdateModal}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded relative mb-3 flex items-center text-sm">
                <MdErrorOutline className="text-xl mr-2" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded relative mb-3 flex items-center text-sm">
                <MdCheckCircle className="text-xl mr-2" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Order ID:
                </label>
                <p className="text-gray-900 font-semibold text-sm">{selectedOrder.orderId}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Customer Name:
                </label>
                <p className="text-gray-900 text-sm">{selectedOrder.name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Customer Phone:
                </label>
                <p className="text-gray-900 text-sm">{selectedOrder.phone}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Delivery Address:
                </label>
                <p className="text-gray-900 text-sm">{selectedOrder.address}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Current Status:
                </label>
                <span
                  className={`px-1.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    selectedOrder.status
                  )}`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-0.5">
                  New Status
                </label>
                <select
                  id="status"
                  className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Order["status"])}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="border-t pt-3 mt-3">
                <h3 className="text-base font-semibold text-gray-700 mb-1.5">Order Items:</h3>
                <ul className="space-y-1 max-h-24 overflow-y-auto border p-1 rounded-md bg-gray-50">
                  {selectedOrder.items.map((item, index) => (
                    <li key={index} className="flex justify-between text-xs text-gray-800">
                      <span>{item.title} (x{item.quantity})</span>
                      <span>₹{(item.quantity * item.price).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between font-bold text-gray-900 text-sm mt-1.5">
                  <span>Total Amount:</span>
                  <span>₹{selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={closeUpdateModal}
                  className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-3 py-1.5 rounded-md shadow-sm text-sm font-medium text-white ${
                    isUpdating
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  }`}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}