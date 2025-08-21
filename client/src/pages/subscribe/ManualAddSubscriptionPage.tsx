import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { MdPersonAdd, MdCreditCard } from "react-icons/md";

// Interface for the subscription plan data
interface SubscriptionPlan {
  _id: string;
  title: string;
  price: number;
}

const ManualAddSubscriptionPage: React.FC = () => {
  // Assuming the API base URL is stored in an environment variable
  const API_BASE_URL = import.meta.env.VITE_API;

  // State for the username and the selected subscription plan title
  const [username, setUsername] = useState("");
  const [selectedPlanTitle, setSelectedPlanTitle] = useState("");

  // State for the list of available subscription plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  
  // State for form submission and data loading
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);

  // Effect hook to fetch subscription plans when the component mounts
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}api/subscription/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data) {
          setPlans(response.data);
          if (response.data.length > 0) {
            // Set the default selected plan to the first one in the list
            setSelectedPlanTitle(response.data[0].title);
          }
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
        toast.error("Failed to fetch subscription plans.");
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, [API_BASE_URL]);

  // Handler for the form submission
  const handleManualSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast.error("Please enter a Username.");
      return;
    }
    if (!selectedPlanTitle) {
      toast.error("Please select a subscription plan.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        username: username,
        title: selectedPlanTitle,
      };

      // API endpoint to manually subscribe a user
      const response = await axios.post(`${API_BASE_URL}api/subscription/subscribe-user`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success(`Subscription added manually for user ${username}!`);
        // Reset the form after successful submission
        setUsername("");
      } else {
        toast.error(response.data.message || "Failed to manually add subscription.");
      }
    } catch (error) {
      console.error("Error adding subscription manually:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "An error occurred.");
      } else {
        toast.error("Failed to manually add subscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen font-sans">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
        <MdPersonAdd className="mr-3 text-yellow-500" />
        Manually Add Subscription
      </h1>

      <form onSubmit={handleManualSubscription} className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto space-y-6">
        {/* Username Section */}
        <div className="space-y-4">
          <label htmlFor="username" className="text-lg font-semibold text-gray-700 block">
            1. Enter User Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdPersonAdd className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="username"
              placeholder="e.g., JohnDoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>

        {/* Subscription Plan Dropdown Section */}
        <div className="space-y-4">
          <label htmlFor="plan-select" className="text-lg font-semibold text-gray-700 block">
            2. Select Subscription Plan
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdCreditCard className="h-5 w-5 text-gray-400" />
            </div>
            {plansLoading ? (
              <p className="pl-10 text-gray-500">Loading plans...</p>
            ) : (
              <select
                id="plan-select"
                value={selectedPlanTitle}
                onChange={(e) => setSelectedPlanTitle(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none bg-white"
                disabled={plans.length === 0}
              >
                {plans.length > 0 ? (
                  plans.map((plan) => (
                    <option key={plan._id} value={plan.title}>
                      {plan.title} - ₹{plan.price}
                    </option>
                  ))
                ) : (
                  <option value="">No plans available</option>
                )}
              </select>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-yellow-500 text-white font-bold py-3 px-4 rounded-md hover:bg-yellow-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading || plansLoading || !username || !selectedPlanTitle}
        >
          {loading ? "Adding Subscription..." : "Add Subscription"}
        </button>
      </form>
    </div>
  );
};

export default ManualAddSubscriptionPage;
