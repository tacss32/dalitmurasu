import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API;

/* ---------------- TYPES ---------------- */

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

/* ---------------- COMPONENT ---------------- */

const SubscriptionDashboard: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [statsData, setStatsData] = useState<SubscriptionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        const plansResponse = await fetch(`${API_BASE_URL}api/subscription/`);
        if (!plansResponse.ok) throw new Error("Failed to fetch plans");
        setPlans(await plansResponse.json());

        const statsResponse = await fetch(
          `${API_BASE_URL}api/subscription/subscription-dashboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!statsResponse.ok) throw new Error("Failed to fetch stats");
        setStatsData(await statsResponse.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) return <div style={{ textAlign: 'center' }}>Loading dashboard...</div>;
  if (error) return <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>;

  const totalRevenue = statsData?.totalRevenue ?? 0;
  const totalSubscriptions = statsData?.totalSubscriptions ?? 0;
  const activeSubscriptions = statsData?.activeSubscriptions ?? 0;
  const subscriptionsByPlan = statsData?.subscriptionsByPlan ?? [];

  /* ---------- SAFE MAP ---------- */
  const planStatsMap = new Map(
    subscriptionsByPlan.map(p => [
      p.planName,
      {
        totalCount: p.count ?? 0,
        totalRevenue: p.revenue ?? 0,
        activeCount: p.activeSubscribers ?? 0,
        activeRevenue: p.activeRevenue ?? 0,
      },
    ])
  );

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: 'auto', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center' }}>Subscription Dashboard 📈</h1>

      {/* -------- OVERVIEW CARDS -------- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 20,
        marginBottom: 30
      }}>
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toFixed(2)}`} color="#007bff" />
        <StatCard title="Total Payments" value={totalSubscriptions.toString()} color="#28a745" />
        <StatCard title="Active Subscriptions" value={activeSubscriptions.toString()} color="#ffc107" />
        <StatCard title="Total Plans Offered" value={plans.length.toString()} color="#17a2b8" />
      </div>

      {/* ================= TOTAL BREAKDOWN ================= */}
      <BreakdownSection title="Breakdown by Plan (TOTAL)">
        {plans.map(plan => {
          const stats = planStatsMap.get(plan.title) || { totalCount: 0, totalRevenue: 0 };
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
          const stats = planStatsMap.get(plan.title) || { activeCount: 0, activeRevenue: 0 };
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

/* ---------------- UI HELPERS ---------------- */

const BreakdownSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 15, marginBottom: 30 }}>
    <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: 10 }}>{title}</h2>
    <ul style={{ listStyle: 'none', padding: 0 }}>{children}</ul>
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
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <strong>{plan.title}</strong>
        <p style={{ fontSize: 13, color: '#666' }}>
          Duration: {plan.durationInDays} days | Price: ₹{plan.price.toFixed(2)}
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          backgroundColor: count > 0 ? badgeColor : '#6c757d',
          color: '#fff',
          padding: '5px 10px',
          borderRadius: 20,
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
    background: '#fff',
    padding: 20,
    borderRadius: 8,
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    borderLeft: `5px solid ${color}`,
    textAlign: 'center'
  }}>
    <p style={{ color: '#666' }}>{title}</p>
    <h3 style={{ color }}>{value}</h3>
  </div>
);

export default SubscriptionDashboard;
