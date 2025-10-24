// src/components/SubscriptionDashboard.tsx

import React, { useState, useEffect } from 'react';

// Use the API_BASE_URL from the environment variable
const API_BASE_URL = import.meta.env.VITE_API;

interface SubscriptionPlan {
  _id: string;
  title: string;
  durationInDays: number; // Added to display plan duration
}

interface SubscriptionSummary {
  planId: string;
  title: string;
  subscriberCount: number;
}

const SubscriptionDashboard: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [summaryData, setSummaryData] = useState<SubscriptionSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      // --- FIX: Retrieve token and set headers for authentication ---
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing. Please log in.');
        setIsLoading(false);
        return;
      }

      const authOptions = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      };
      // -----------------------------------------------------------------

      try {
        // Step 1: Fetch all available subscription plans, including durationInDays
        // FIX: Pass authOptions to the fetch call
        const plansResponse = await fetch(`${API_BASE_URL}api/subscription/`, authOptions);

        if (!plansResponse.ok) {
          // Check for specific 401 error
          if (plansResponse.status === 401) {
            throw new Error('Unauthorized: Session expired or invalid token.');
          }
          throw new Error('Failed to fetch subscription plans');
        }
        const allPlans: SubscriptionPlan[] = await plansResponse.json();
        setPlans(allPlans);

        // Step 2: Fetch the subscriber counts
        // FIX: Pass authOptions to the fetch call
        const summaryResponse = await fetch(`${API_BASE_URL}api/subscription/subscription-dashboard`, authOptions);

        if (!summaryResponse.ok) {
          if (summaryResponse.status === 401) {
            throw new Error('Unauthorized: Session expired or invalid token.');
          }
          throw new Error('Failed to fetch dashboard data');
        }
        const summary: { summary: SubscriptionSummary[] } = await summaryResponse.json();
        setSummaryData(summary.summary);

      } catch (err) {
        if (err instanceof Error) {
          setError(`Error: Failed to fetch dashboard data. ${err.message}`);
        } else {
          setError('Error: Failed to fetch dashboard data. An unknown network error occurred.');
        }
        console.error(err);
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
    return <div style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>{error}</div>;
  }

  // Create a map for quick lookup of subscriber counts by planId
  const summaryMap = new Map(summaryData?.map(item => [item.planId, item.subscriberCount]));

  // Calculate the total number of subscribers from the summary data
  const totalSubscribers = summaryData ? summaryData.reduce((sum, plan) => sum + plan.subscriberCount, 0) : 0;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Premium Article Dashboard</h1>
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>

        {/* Display Total Subscribers */}
        <div style={{ padding: '10px 0', textAlign: 'center', borderBottom: '2px solid #007bff', marginBottom: '20px' }}>
          <h2 style={{ margin: '0', color: '#007bff' }}>Total Subscribers</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '2.5em', fontWeight: 'bold' }}>{totalSubscribers}</p>
        </div>

        {/* Display Subscribers by Plan */}
        <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#555' }}>Subscribers by Plan</h2>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {plans.length > 0 ? (
            plans.map((plan) => {
              // Get the count from the summary map, or default to 0
              const count = summaryMap.get(plan._id) || 0;
              return (
                <li key={plan._id} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                      {plan.title}
                      <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'normal', marginLeft: '10px' }}>
                        ({plan.durationInDays} days)
                      </span>
                    </span>
                    <span style={{ backgroundColor: '#28a745', color: 'white', padding: '5px 10px', borderRadius: '20px', fontSize: '1em' }}>
                      {count} Subscriber{count !== 1 ? 's' : ''}
                    </span>
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

export default SubscriptionDashboard;