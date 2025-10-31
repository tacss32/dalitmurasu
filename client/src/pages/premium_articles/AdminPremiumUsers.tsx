import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { MdAccountCircle } from "react-icons/md";
import { format, parseISO } from "date-fns";

interface SubscriptionPayment {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
  subscriptionPlanId: {
    title: string;
    price: number;
  };
  amount: number;
  payment_status: string;
  createdAt: string;
}

const SubscribedUsersPage: React.FC = () => {
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [filters, setFilters] = useState({
    payment_status: "",
    min_amount: "",
    max_amount: "",
  });
  const API_BASE_URL = import.meta.env.VITE_API;

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in.");
        return;
      }

      const params: any = {};
      if (filters.payment_status) params.payment_status = filters.payment_status;
      if (filters.min_amount) params.min_amount = filters.min_amount;
      if (filters.max_amount) params.max_amount = filters.max_amount;

      const response = await axios.get(
        `${API_BASE_URL}api/subscription/subscribed-users`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      if (response.data.success) {
        setPayments(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to fetch data.");
      }
    } catch (error) {
      console.error("Error fetching filtered payments:", error);
      toast.error("Error fetching filtered subscription payments.");
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
        <MdAccountCircle className="text-4xl text-yellow-500 mr-2" />
           Subscription Payments
      </h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap items-center gap-4">
        <select
          className="border rounded-md p-2"
          value={filters.payment_status}
          onChange={(e) =>
            setFilters({ ...filters, payment_status: e.target.value })
          }
        >
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

       
        <button
          onClick={fetchPayments}
          className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
        >
          Apply Filters
        </button>
      </div>

      {/* Table */}
      {payments.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">No matching records found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((p) => (
                <tr key={p._id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {p.userId?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {p.userId?.email || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {p.subscriptionPlanId?.title || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    ₹{p.subscriptionPlanId?.price || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    ₹{p.amount}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm font-semibold ${p.payment_status === "success"
                        ? "text-green-600"
                        : p.payment_status === "failed"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                  >
                    {p.payment_status}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(parseISO(p.createdAt), "PPP")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubscribedUsersPage;
