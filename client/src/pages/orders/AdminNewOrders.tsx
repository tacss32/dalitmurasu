import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { MdCheckCircle, MdCancel, MdPendingActions } from "react-icons/md"; // Import icons for status

interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string; // Keep _id for internal use
  orderId: string; // The user-friendly order ID
  userId?: string;
  name: string;
  phone: string;
  address: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMode: "cod" | "online";
  paymentStatus: "pending" | "paid";
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  razorpayOrderId?: string;
  paymentId?: string;
  signature?: string;
  createdAt: string;
  updatedAt: string;
}

export default function NewOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      const currentTimestamp = new Date().toISOString();
      localStorage.setItem("lastNotificationCheck", currentTimestamp);

      const res = await axios.get(`${API_BASE_URL}api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success && Array.isArray(res.data.data)) {
        const pendingOrders = res.data.data.filter((order: Order) => order.status === 'pending');
        const sortedOrders = pendingOrders.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(sortedOrders);
      } else {
        toast.error(res.data.message || "Failed to fetch orders.");
        setError(res.data.message || "Failed to fetch orders.");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      let errorMessage = "An unexpected error occurred.";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
      }
      toast.error(`Error fetching orders: ${errorMessage}`);
      setError(`Failed to load orders: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return <MdCheckCircle className="text-green-500 text-xl" title="Delivered" />;
      case 'cancelled':
        return <MdCancel className="text-red-500 text-xl" title="Cancelled" />;
      case 'pending':
      case 'processing':
      case 'shipped':
      default:
        return <MdPendingActions className="text-yellow-500 text-xl" title={status} />;
    }
  };

  const getPaymentStatusIcon = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return <MdCheckCircle className="text-green-500 text-xl" title="Paid" />;
      case 'pending':
      default:
        return <MdPendingActions className="text-yellow-500 text-xl" title="Pending" />;
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-700">Loading orders...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">New Orders (Pending)</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">No pending orders to display at this time.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Mode
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {order.paymentMode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <div className="flex items-center justify-center gap-1">
                      {getPaymentStatusIcon(order.paymentStatus)}
                      <span className="capitalize">{order.paymentStatus}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <div className="flex items-center justify-center gap-1">
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}