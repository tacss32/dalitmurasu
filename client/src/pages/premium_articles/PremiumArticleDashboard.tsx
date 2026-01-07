import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API;

/* -------------------- TYPES -------------------- */

interface PlanStats {
  planName: string;

  // TOTAL
  count: number;
  revenue: number;

  // ACTIVE
  activeSubscribers: number;
  activeRevenue: number;
}

interface SubscriptionStats {
  success: boolean;
  totalRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  subscriptionsByPlan: PlanStats[];
}

interface SubscriptionPlan {
  _id: string;
  title: string;
  durationInDays: number;
  price: number;
}

/* -------------------- COMPONENT -------------------- */

const SubscriptionDashboard: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [statsData, setStatsData] = useState<SubscriptionStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        const plansResponse = await fetch(`${API_BASE_URL}api/subscription/`);
        if (!plansResponse.ok) throw new Error("Failed to fetch plans");
        const allPlans: SubscriptionPlan[] = await plansResponse.json();
        setPlans(allPlans);

        const statsResponse = await fetch(
          `${API_BASE_URL}api/subscription/subscription-dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!statsResponse.ok) throw new Error("Failed to fetch stats");
        const stats: SubscriptionStats = await statsResponse.json();
        setStatsData(stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
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

  const totalSubscriptions = statsData?.totalSubscriptions ?? 0;
  const activeSubscriptions = statsData?.activeSubscriptions ?? 0;
  const subscriptionsByPlan = statsData?.subscriptionsByPlan ?? [];

  /* ---------- SAFE MAP ---------- */
  const planStatsMap = new Map(
    subscriptionsByPlan.map(item => [
      item.planName,
      {
        totalCount: item.count ?? 0,
        totalRevenue: item.revenue ?? 0,
        activeCount: item.activeSubscribers ?? 0,
        activeRevenue: item.activeRevenue ?? 0,
      },
    ])
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Premium-Article Dashboard 📈</h1>

      {/* ---------------- OVERVIEW ---------------- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <StatCard title="Total Payments" value={totalSubscriptions.toString()} color="#28a745" />
        <StatCard title="Active Subscriptions" value={activeSubscriptions.toString()} color="#ffc107" />
        <StatCard title="Total Plans Offered" value={plans.length.toString()} color="#17a2b8" />
      </div>

      {/* ================= TOTAL BREAKDOWN ================= */}
      <BreakdownSection title="Breakdown by Plan (TOTAL)">
        {plans.map(plan => {
          const stats = planStatsMap.get(plan.title) || {
            totalCount: 0,
            totalRevenue: 0,
          };

          return (
            <PlanRow
              key={plan._id}
              plan={plan}
              count={stats.totalCount}
              revenue={stats.totalRevenue}
              badgeColor="#007bff"
              label="Subscriber"
            />
          );
        })}
      </BreakdownSection>

      {/* ================= ACTIVE BREAKDOWN ================= */}
      <BreakdownSection title="Breakdown by Plan (ACTIVE)">
        {plans.map(plan => {
          const stats = planStatsMap.get(plan.title) || {
            activeCount: 0,
            activeRevenue: 0,
          };

          return (
            <PlanRow
              key={plan._id}
              plan={plan}
              count={stats.activeCount}
              revenue={stats.activeRevenue}
              badgeColor="#28a745"
              label="Active Subscriber"
            />
          );
        })}
      </BreakdownSection>
    </div>
  );
};

/* -------------------- HELPERS -------------------- */

const BreakdownSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', marginBottom: '30px' }}>
    <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#555' }}>{title}</h2>
    <ul style={{ listStyleType: 'none', padding: 0 }}>{children}</ul>
  </div>
);

const PlanRow = ({
  plan,
  count,
  revenue,
  badgeColor,
  label,
}: {
  plan: SubscriptionPlan;
  count: number;
  revenue: number;
  badgeColor: string;
  label: string;
}) => (
  <li style={{ padding: '15px 0', borderBottom: '1px solid #eee' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <strong>{plan.title}</strong>
        <p style={{ fontSize: '0.9em', color: '#666' }}>
          Duration: {plan.durationInDays} days | Price: ₹{plan.price.toFixed(2)}
        </p>
      </div>

      <div style={{ textAlign: 'right', minWidth: '150px' }}>
        <span style={{
          backgroundColor: count > 0 ? badgeColor : '#6c757d',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '20px',
          fontWeight: 'bold'
        }}>
          {count} {label}{count !== 1 ? 's' : ''}
        </span>
        <p style={{ marginTop: 5, fontWeight: 'bold' }}>
          Revenue: ₹{Number(revenue || 0).toFixed(2)}
        </p>
      </div>
    </div>
  </li>
);

const StatCard = ({ title, value, color }: { title: string; value: string; color: string }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    borderLeft: `5px solid ${color}`,
    textAlign: 'center'
  }}>
    <p style={{ color: '#666' }}>{title}</p>
    <h3 style={{ color }}>{value}</h3>
  </div>
);

export default SubscriptionDashboard;
