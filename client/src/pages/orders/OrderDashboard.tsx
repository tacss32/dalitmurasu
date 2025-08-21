import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API;

interface DashboardStats {
  totalCODOrders: number;
  totalOnlineOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalPaidOrders: number;
}

const OrderDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}api/orders/dashboard`);
        setStats(res.data.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="p-4 text-gray-600">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-gradient-to-br">
      <h2 className="text-2xl font-bold mb-4">Order Dashboard</h2>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total COD Orders" value={stats.totalCODOrders} />
          <StatCard title="Total Online Orders" value={stats.totalOnlineOrders} />
          <StatCard title="Pending Orders" value={stats.pendingOrders} />
          <StatCard title="Delivered Orders" value={stats.deliveredOrders} />
          <StatCard title="Cancelled Orders" value={stats.cancelledOrders} />
          <StatCard title="Total Paid Orders" value={stats.totalPaidOrders} />
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
}

const StatCard = ({ title, value }: StatCardProps) => (
  <div className="bg-white shadow rounded-xl p-4 border border-gray-100">
    <h3 className="text-md font-medium text-gray-500">{title}</h3>
    <p className="text-2xl font-semibold text-gray-900">{value}</p>
  </div>
);

export default OrderDashboard;
