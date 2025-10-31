import React, { useState, useEffect } from 'react';

// Assuming this is correctly set up in your environment
const API_BASE_URL = import.meta.env.VITE_API;

// Removed SubscriptionPlan and SubscriptionSummary interfaces as they are no longer necessary for the dashboard data structure.
// The plans are fetched from one endpoint, and the stats from another.

// Interface for the detailed breakdown by plan from the controller
interface PlanStats {
  planName: string;
  count: number;
  revenue: number;
}

// Interface for the overall subscription statistics response
interface SubscriptionStats {
  success: boolean;
  totalRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  subscriptionsByPlan: PlanStats[];
}

// Interface for the subscription plans fetched separately (if needed for duration/details)
// NOTE: I'll update the plan fetching logic to match the controller's expectation (using plan names for the breakdown)
// However, the original code fetches ALL plans to display the ones with 0 subscriptions too.
// I will keep the plan fetching to ensure all plans are listed, even if they have 0 sales.
interface SubscriptionPlan {
  _id: string;
  title: string;
  durationInDays: number; // Added to display plan duration
  price: number; // Also useful for comparison/display
}


const SubscriptionDashboard: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [statsData, setStatsData] = useState<SubscriptionStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Step 1: Fetch all available subscription plans (to list all plans, including 0-sales)
        const plansResponse = await fetch(`${API_BASE_URL}api/subscription/`);
        if (!plansResponse.ok) {
          throw new Error('Failed to fetch subscription plans');
        }
        const allPlans: SubscriptionPlan[] = await plansResponse.json();
        setPlans(allPlans);
        

        // Step 2: Fetch the comprehensive subscription statistics
        // The URL needs to be corrected based on the previous structure (assuming subscription-dashboard is the correct path for the controller)
        // I will assume the controller is mounted at a suitable admin path like 'api/admin/subscription-stats' or similar.
        // Based on the user's provided code, I'll use a new path for clarity but you might need to adjust the backend route setup.
        const statsResponse = await fetch(`${API_BASE_URL}api/subscription/subscription-dashboard`, {
          // NOTE: I am using '/stats' as a probable route for the controller
          // The original fetch was to `api/subscription/subscription-dashboard` which might be the intended route.
          // I'll stick to 'api/subscription/stats' for a clearer distinction.
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }
        const stats: SubscriptionStats = await statsResponse.json();
        setStatsData(stats);
        console.log()
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div style={{ textAlign: 'center', marginTop: '20px' }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>Error: {error}</div>;
  }

  // Use the fetched stats data for display
  const totalRevenue = statsData?.totalRevenue ?? 0;
  const totalSubscriptions = statsData?.totalSubscriptions ?? 0;
  const activeSubscriptions = statsData?.activeSubscriptions ?? 0;
  const subscriptionsByPlan = statsData?.subscriptionsByPlan ?? [];

  // Create a map for quick lookup of plan stats (count, revenue) by planName
  const planStatsMap = new Map(subscriptionsByPlan.map(item => [item.planName, { count: item.count, revenue: item.revenue }]));

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Subscription Dashboard 📈</h1>

      {/* ---------------------------------------------------- */}
      {/* OVERVIEW STATS CARDS */}
      {/* ---------------------------------------------------- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>

        {/* Total Revenue */}
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toFixed(2)}`} color="#007bff" />

        {/* Total Successful Subscriptions */}
        <StatCard title="Total Payments" value={totalSubscriptions.toString()} color="#28a745" />

        {/* Currently Active Subscriptions */}
        <StatCard title="Active Subscriptions" value={activeSubscriptions.toString()} color="#ffc107" />

        {/* Total Plans */}
        <StatCard title="Total Plans Offered" value={plans.length.toString()} color="#17a2b8" />
      </div>

      {/* ---------------------------------------------------- */}
      {/* SUBSCRIPTIONS BREAKDOWN BY PLAN */}
      {/* ---------------------------------------------------- */}
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#555' }}>Breakdown by Plan</h2>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {plans.length > 0 ? (
            plans.map((plan) => {
              // Get the stats for this plan, or default to 0
              const stats = planStatsMap.get(plan.title) || { count: 0, revenue: 0 };
              const count = stats.count;
             
              const revenue = stats.revenue;

              return (
                <li key={plan._id} style={{ padding: '15px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flexGrow: 1 }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>
                        {plan.title}
                      </span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                        Duration: {plan.durationInDays} days | Price: ₹{plan.price.toFixed(2)}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '150px' }}>
                      <span style={{
                        backgroundColor: count > 0 ? '#28a745' : '#6c757d',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '20px',
                        fontSize: '1em',
                        fontWeight: 'bold'
                      }}>
                        {count} Subscriber{count !== 1 ? 's' : ''}
                      </span>
                      <p style={{ margin: '5px 0 0 0', fontSize: '1.1em', fontWeight: 'bold', color: '#333' }}>
                        Revenue: ₹{revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', marginTop: '20px', color: '#777' }}>
              No subscription plans found.
            </div>
          )}
        </ul>
      </div>
    </div>
  );
};

// Helper component for stat cards
interface StatCardProps {
  title: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    borderLeft: `5px solid ${color}`,
    textAlign: 'center'
  }}>
    <p style={{ margin: '0 0 5px 0', fontSize: '1em', color: '#666', fontWeight: '500' }}>{title}</p>
    <h3 style={{ margin: '0', fontSize: '1.8em', color: color }}>{value}</h3>
  </div>
);

export default SubscriptionDashboard;