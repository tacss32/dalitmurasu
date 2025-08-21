import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Access the API base URL from Vite's environment variables
const API_BASE_URL = import.meta.env.VITE_API;

interface OrderStats {
  totalCODOrders: number;
  totalOnlineOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalPaidOrders: number;
}

// Interface for the subscription summary data from the backend
interface SubscriptionSummary {
  planId: string;
  title: string;
  subscriberCount: number;
}

const Dashboard = () => {
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [totalSubscribedUsers, setTotalSubscribedUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch order stats
        const orderResponse = await axios.get(`${API_BASE_URL}api/orders/dashboard`);
        setOrderStats(orderResponse.data.data);

        // Fetch subscription summary data
        const subscriptionResponse = await axios.get(`${API_BASE_URL}api/subscription/subscription-dashboard`);
        const summary: { summary: SubscriptionSummary[] } = subscriptionResponse.data;

        // Calculate the total number of subscribers by summing the counts
        const totalCount = summary.summary.reduce((sum, plan) => sum + plan.subscriberCount, 0);
        setTotalSubscribedUsers(totalCount);

      } catch (err) {
        setError("Failed to fetch dashboard stats.");
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleOrderCardClick = () => {
    navigate("/admin/orders");
  };

  const handleSubscriptionCardClick = () => {
    navigate("/admin/subscription-dashboard"); 
  };


  return (
    <div className="h-full bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 animate-fade-in-down">
          Admin Dashboard 📈
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

      {(orderStats || totalSubscribedUsers !== null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 w-full max-w-4xl">

          {/* Subscribed Users Card (Updated) */}
          {totalSubscribedUsers !== null && (
            <div 
              className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer"
              onClick={handleSubscriptionCardClick}
            >
              <h2 className="text-2xl font-bold text-gray-200">Total Subscribed Users</h2>
              <p className="mt-2 text-4xl font-extrabold text-purple-400">
                {totalSubscribedUsers}
              </p>
            </div>
          )}

          {/* Existing Order Stats Cards */}
          {orderStats && (
            <>
              <div 
                className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer"
                onClick={handleOrderCardClick}
              >
                <h2 className="text-2xl font-bold text-gray-200">Total Orders</h2>
                <p className="mt-2 text-4xl font-extrabold text-white">
                  {orderStats.totalCODOrders + orderStats.totalOnlineOrders}
                </p>
              </div>
              <div 
                className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer"
                onClick={handleOrderCardClick}
              >
                <h2 className="text-2xl font-bold text-gray-200">Pending Orders</h2>
                <p className="mt-2 text-4xl font-extrabold text-yellow-400">
                  {orderStats.pendingOrders}
                </p>
              </div>
              <div 
                className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer"
                onClick={handleOrderCardClick}
              >
                <h2 className="text-2xl font-bold text-gray-200">Cancelled Orders</h2>
                <p className="mt-2 text-4xl font-extrabold text-red-500">
                  {orderStats.cancelledOrders}
                </p>
              </div>
              <div 
                className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer"
                onClick={handleOrderCardClick}
              >
                <h2 className="text-2xl font-bold text-gray-200">Delivered Orders</h2>
                <p className="mt-2 text-4xl font-extrabold text-green-500">
                  {orderStats.deliveredOrders}
                </p>
              </div>
              <div 
                className="bg-gray-700 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer"
                onClick={handleOrderCardClick}
              >
                <h2 className="text-2xl font-bold text-gray-200">Total Paid Orders</h2>
                <p className="mt-2 text-4xl font-extrabold text-green-400">
                  {orderStats.totalPaidOrders}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;