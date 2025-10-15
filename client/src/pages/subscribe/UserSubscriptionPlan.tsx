
import { useState, useEffect } from 'react';
import axios from 'axios';
import { MdCheckCircle, MdStar, MdAccessTime, MdTimer } from 'react-icons/md';

interface SubscriptionPlan {
  _id: string;
  title: string;
  description?: string;
  price: number;
  durationInDays: number;
  createdAt: string;
  updatedAt: string;
}

interface UserSubscription {
  _id: string;
  planId: SubscriptionPlan;
  userId: string;
  startDate: string; // This now correctly maps to subscriptionActivatedAt
  endDate: string;
  isActive: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function UserSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  // ⬇️ NEW: State to hold the count of stacked subscriptions
  const [stackedCount, setStackedCount] = useState<number>(0);

  const API_BASE_URL = import.meta.env.VITE_API;

  useEffect(() => {
    const fetchPlansAndSubscription = async () => {
      try {
        const token = localStorage.getItem("clientToken");

        // Fetch all plans (public)
        const plansResponse = await axios.get<SubscriptionPlan[]>(
          `${API_BASE_URL}api/subscription/`, // Corrected endpoint
        );
        setPlans(plansResponse.data);

        if (token) {
          try {
            const userSubResponse = await axios.get(
              `${API_BASE_URL}api/subscription/user-status`, // Corrected endpoint
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const subscription = userSubResponse.data.subscription || null;
            setUserSubscription(subscription);
            // ⬇️ NEW: Set the stacked count from the API response
            setStackedCount(userSubResponse.data.stackedCount || 0);

            if (subscription?.endDate) {
              const endDate = new Date(subscription.endDate);
              const now = new Date();
              const diff = endDate.getTime() - now.getTime();
              const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
              setRemainingDays(daysLeft);
            } else {
              setRemainingDays(null);
            }
          } catch (err) {
            console.error("Error fetching user subscription status:", err);
            setUserSubscription(null);
            setStackedCount(0); // Reset on error
          }
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load plans. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlansAndSubscription();
  }, [API_BASE_URL]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    // ⬇️ NEW: Client-side check before making API call
    if (stackedCount >= 2) {
      alert("Subscription limit reached. You cannot add another plan.");
      return;
    }

    const token = localStorage.getItem("clientToken");
    if (!token) {
      alert("Please login to subscribe.");
      return;
    }

    try {
      const createOrderResponse = await axios.post(
        `${API_BASE_URL}api/subscription/create-order`, // Corrected endpoint
        { planId: plan._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // ... (rest of handleSubscribe logic is the same)
      const { razorpayOrderId, amount, currency } = createOrderResponse.data;

      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount,
        currency,
        name: "Dalit Murasu",
        description: `Subscription: ${plan.title}`,
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            const verifyResponse = await axios.post(
              `${API_BASE_URL}api/subscription/verify-payment`, // Corrected endpoint
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan._id,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyResponse.data.success) {
              alert("Subscription successful!");
              window.location.reload();
            } else {
              alert(verifyResponse.data.message || "Payment verification failed.");
            }
          } catch (error) {
            console.error("Verification Error:", error);
            alert("An error occurred during payment verification.");
          }
        },
        prefill: { name: "Dalit Murasu User", email: "" },
        theme: { color: "#cb1e19" },
      });
      razorpay.open();

    } catch (error) {
      console.error("Payment Error:", error);
      // ⬇️ NEW: Better error handling for limit reached
      if (axios.isAxiosError(error) && error.response?.data?.limitReached) {
        alert(error.response.data.message);
      } else {
        alert("Failed to initiate subscription. Please try again.");
      }
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white/30">
        <div className="text-xl font-semibold text-gray-700">Loading available plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white/30 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative text-center">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-white/30 p-4">
        <p className="text-xl font-semibold text-gray-700 mb-4">No subscription plans are currently available.</p>
        <p className="text-gray-600">Please check back later or contact support.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center" style={{ backgroundColor: '#feebbd' }}>
      <h2 className="text-4xl font-extrabold text-highlight-1 mb-10 text-center">Choose Your Subscription Plan</h2>

      

      {/* Remaining days counter for active user */}
      {userSubscription && remainingDays !== null && (
        <div className="mb-8 text-center bg-white/40 px-6 py-3 rounded-lg shadow-md">
          <div className="flex justify-center items-center space-x-2 text-lg font-semibold text-gray-800">
            <MdTimer className="text-red-600 text-2xl" />
            <span>
              Your current plan (<strong>{userSubscription.planId.title}</strong>) expires in{" "}
              <span className="text-red-700 font-bold">{remainingDays}</span> day
              {remainingDays !== 1 ? "s" : ""}.
            </span>
          </div>
        </div>
      )}

      {/* ⬇️ NEW: Add a visual indicator for the subscription limit */}
      {stackedCount >= 2 && (
        <div className="mb-8 text-center bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-md">
          <p className="font-semibold">
            You have reached the maximum limit of 2 stacked subscriptions.
          </p>
          <p className="text-sm">You can subscribe to a new plan after your current one expires.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {plans.map((plan) => {
          const isCurrentPlan = userSubscription?.planId?._id === plan._id;

          return (
            <div
              key={plan._id}
              className={`relative bg-white/30 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between p-6 ${isCurrentPlan ? 'border-2 border-red-600' : 'border border-gray-200'
                }`}
            >
              {isCurrentPlan && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                  Current Plan
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">{plan.title}</h3>
                <p className="text-center text-gray-600 mb-4">{plan.description || 'No description provided.'}</p>
                <div className="text-center mb-6">
                  <span className="text-5xl font-extrabold text-red-600">₹{plan.price.toFixed(2)}</span>
                  <span className="text-xl text-gray-500"> / {plan.durationInDays} days</span>
                </div>
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-center"><MdCheckCircle className="text-green-500 mr-2 text-xl" /> Access to Premium Content</li>
                  <li className="flex items-center"><MdStar className="text-blue-500 mr-2 text-xl" /> Ad-Free Experience</li>
                  <li className="flex items-center"><MdAccessTime className="text-purple-500 mr-2 text-xl" /> Unlimited Reading</li>
                </ul>
              </div>

              {/* ✅ MODIFIED: Button is disabled based on stackedCount */}
              <button
                onClick={() => handleSubscribe(plan)}
                className="w-full py-3 rounded-lg text-white font-semibold transition duration-300 ease-in-out bg-[#cb1e19] hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={stackedCount >= 2}
              >
                {stackedCount >= 2
                  ? "Limit Reached"
                  : userSubscription
                    ? isCurrentPlan
                      ? "Extend Subscription"
                      : "Switch & Extend"
                    : "Subscribe Now"
                }
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}