import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API;

interface OrderStats {
  totalCODOrders: number;
  totalOnlineOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

const Dashboard = () => {
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [totalSubscribedUsers, setTotalSubscribedUsers] = useState<number | null>(
    null
  );
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalVisits, setTotalVisits] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Session expired or token missing. Please log in again.");
        setLoading(false);
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      try {
        // 1️⃣ Fetch order stats
        const orderResponse = await axios.get(
          `${API_BASE_URL}api/orders/dashboard`,
          config
        );
        setOrderStats(orderResponse.data.data);

        // 2️⃣ Fetch subscription dashboard summary
        const subscriptionResponse = await axios.get(
          `${API_BASE_URL}api/subscription/subscription-dashboard`,
          config
        );

        const data = subscriptionResponse.data;

        if (typeof data.activeSubscriptions === "number") {
          setTotalSubscribedUsers(data.activeSubscriptions);
        } else if (Array.isArray(data.subscriptionsByPlan)) {
          const totalCount = data.subscriptionsByPlan.reduce(
            (sum: number, plan: { count: number }) => sum + (plan.count || 0),
            0
          );
          setTotalSubscribedUsers(totalCount);
        } else {
          setTotalSubscribedUsers(0);
        }

        // 3️⃣ Fetch all users to get total count
        const usersResponse = await axios.get(
          `${API_BASE_URL}api/subscription/users`,
          config
        );
        if (
          usersResponse.data.success &&
          Array.isArray(usersResponse.data.users)
        ) {
          setTotalUsers(usersResponse.data.users.length);
        } else {
          setTotalUsers(0);
        }

        // 4️⃣ Fetch visitor analytics
        let analyticsUrl = `${API_BASE_URL}api/analytics/data`;
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (params.toString()) analyticsUrl += `?${params.toString()}`;

        const analyticsResponse = await axios.get(analyticsUrl, config);
        if (analyticsResponse.data.success) {
          setTotalVisits(analyticsResponse.data.totalVisits);
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setError("Failed to fetch dashboard stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate, startDate, endDate]);

  const handleOrderCardClick = () => {
    navigate("/admin/orders");
  };

  const handleSubscriptionCardClick = () => {
    navigate("/admin/subscription-dashboard");
  };
  const handleAllusersCardClick = () => {
    navigate("/admin/users-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 animate-fade-in-down">
          Admin Dashboard 📊
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 animate-fade-in-up">
          Welcome back,{" "}
          <span className="font-semibold text-yellow-400">Admin!</span>
        </p>
      </div>

      {loading && (
        <div className="mt-12 text-2xl text-gray-400">Loading stats...</div>
      )}

      {error && (
        <div className="mt-12 text-2xl text-red-500">Error: {error}</div>
      )}

      {(orderStats ||
        totalSubscribedUsers !== null ||
        totalUsers !== null ||
        totalVisits !== null) && (
          <>
            {/* --- Main Stats Grid --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 w-full max-w-6xl">
              {/* 🧍 Total Users */}
              {totalUsers !== null && (
                <div
                  className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer"
                  onClick={handleAllusersCardClick}
                >
                  <h2 className="text-2xl font-bold text-gray-200">
                    Total Users
                  </h2>
                  <p className="mt-2 text-4xl font-extrabold text-blue-400">
                    {totalUsers}
                  </p>
                </div>
              )}

              {/* 🌟 Total Subscribed Users */}
              {totalSubscribedUsers !== null && (
                <div
                  className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer"
                  onClick={handleSubscriptionCardClick}
                >
                  <h2 className="text-2xl font-bold text-gray-200">
                    Active Subscribers
                  </h2>
                  <p className="mt-2 text-4xl font-extrabold text-purple-400">
                    {totalSubscribedUsers}
                  </p>
                </div>
              )}

              {/* 🛍️ Order Stats */}
              {orderStats && (
                <>
                  <div
                    className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer"
                    onClick={handleOrderCardClick}
                  >
                    <h2 className="text-2xl font-bold text-gray-200">
                      Total Orders
                    </h2>
                    <p className="mt-2 text-4xl font-extrabold text-white">
                      {orderStats.totalCODOrders + orderStats.totalOnlineOrders}
                    </p>
                  </div>

                  <div
                    className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer"
                    onClick={handleOrderCardClick}
                  >
                    <h2 className="text-2xl font-bold text-gray-200">
                      Pending Orders
                    </h2>
                    <p className="mt-2 text-4xl font-extrabold text-yellow-400">
                      {orderStats.pendingOrders}
                    </p>
                  </div>

                  <div
                    className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer"
                    onClick={handleOrderCardClick}
                  >
                    <h2 className="text-2xl font-bold text-gray-200">
                      Cancelled Orders
                    </h2>
                    <p className="mt-2 text-4xl font-extrabold text-red-500">
                      {orderStats.cancelledOrders}
                    </p>
                  </div>

                  <div
                    className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer"
                    onClick={handleOrderCardClick}
                  >
                    <h2 className="text-2xl font-bold text-gray-200">
                      Delivered Orders
                    </h2>
                    <p className="mt-2 text-4xl font-extrabold text-green-500">
                      {orderStats.deliveredOrders}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* --- Analytics & Visitors Section (Moved to Bottom) --- */}
            {totalVisits !== null && (
              <div className="w-full max-w-6xl mt-8">
                <div className="bg-gray-700 p-6 rounded-lg shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">

                  {/* Left Side: Stats Display */}
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-2xl font-bold text-gray-200">
                      Visitor Analytics
                    </h2>
                    <div className="flex items-baseline justify-center md:justify-start gap-3 mt-2">
                      <p className="text-5xl font-extrabold text-teal-400">
                        {totalVisits}
                      </p>
                      <span className="text-gray-400 text-lg">
                        Visits
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      {startDate || endDate ? "Based on selected date range" : "All time records"}
                    </p>
                  </div>

                  {/* Right Side: Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-gray-800 p-4 rounded-lg">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-400 mb-1 ml-1">
                        From
                      </label>
                      <input
                        type="date"
                        className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-teal-500 text-sm"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-400 mb-1 ml-1">
                        To
                      </label>
                      <input
                        type="date"
                        className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-teal-500 text-sm"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="bg-gray-700 hover:bg-red-700 text-white px-4 py-2 rounded text-sm h-[38px] mt-4 sm:mt-0 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
};

export default Dashboard;