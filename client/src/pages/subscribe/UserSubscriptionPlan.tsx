import { useState, useEffect } from 'react';
import axios from 'axios';
import { MdCheckCircle, MdStar, MdAccessTime } from 'react-icons/md';

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
  planId: SubscriptionPlan; // Or just the string ID if your API returns that
  userId: string;
  startDate: string;
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

  const API_BASE_URL = import.meta.env.VITE_API;

  useEffect(() => {
    const fetchPlansAndSubscription = async () => {
      try {
        const token = localStorage.getItem("clientToken");

        // Fetch subscription plans
        const plansResponse = await axios.get<SubscriptionPlan[]>(
          `${API_BASE_URL}api/subscriptions`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        setPlans(plansResponse.data);

        // Fetch user's current subscription if they are logged in
        if (token) {
          try {
            const userSubResponse = await axios.get(
              `${API_BASE_URL}api/subscriptions/user-status`, // Assumed new API endpoint
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            // The API should return the active subscription or null/undefined
            setUserSubscription(userSubResponse.data.subscription);
          } catch (userSubError) {
            console.error("Error fetching user subscription status:", userSubError);
            // It's fine if this fails; it just means the user isn't subscribed
            setUserSubscription(null);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error || 'Failed to load plans. Please try again.');
        } else {
          setError('An unexpected error occurred while loading plans.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPlansAndSubscription();
  }, [API_BASE_URL]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    const token = localStorage.getItem("clientToken");

    if (!token) {
      alert("Please login to subscribe.");
      return;
    }

    // Check if the user is already subscribed to this plan
    if (userSubscription && userSubscription.planId._id === plan._id) {
      alert("You are already subscribed to this plan.");
      return;
    }

    try {
      const createOrderResponse = await axios.post(
        `${API_BASE_URL}api/subscriptions/create-order`,
        { planId: plan._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { razorpayOrderId, amount, currency, userId } = createOrderResponse.data;

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
              `${API_BASE_URL}api/subscriptions/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId,
                planId: plan._id,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (verifyResponse.data.success) {
              alert("Subscription successful!");
              window.location.reload();
            } else {
              alert("Payment verification failed.");
            }
          } catch (error) {
            console.error("Verification Error:", error);
            alert("An error occurred during payment verification.");
          }
        },
        prefill: {
          name: "Dalit Murasu User",
          email: "",
        },
        theme: {
          color: "#cb1e19",
        },
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Failed to initiate subscription. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading available plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative text-center">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
        <p className="text-xl font-semibold text-gray-700 mb-4">No subscription plans are currently available.</p>
        <p className="text-gray-600">Please check back later or contact support.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center" style={{ backgroundColor: '#feebbd' }}>
      <h2 className="text-4xl font-extrabold text-gray-900 mb-10 text-center">Choose Your Subscription Plan</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between p-6 border border-gray-200"
          >
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">{plan.title}</h3>
              <p className="text-center text-gray-600 mb-4">{plan.description || 'No description provided.'}</p>
              <div className="text-center mb-6">
                <span className="text-5xl font-extrabold text-red-600">₹{plan.price.toFixed(2)}</span>
                <span className="text-xl text-gray-500"> / {plan.durationInDays} days</span>
              </div>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-center">
                  <MdCheckCircle className="text-green-500 mr-2 text-xl" /> Access to Premium Content
                </li>
                <li className="flex items-center">
                  <MdStar className="text-blue-500 mr-2 text-xl" /> Ad-Free Experience
                </li>
                <li className="flex items-center">
                  <MdAccessTime className="text-purple-500 mr-2 text-xl" /> Unlimited Reading
                </li>
              </ul>
            </div>
            {/* Conditional button rendering logic */}
            <button
              onClick={() => handleSubscribe(plan)}
              disabled={userSubscription?.planId._id === plan._id}
              className={`w-full py-3 rounded-lg text-white font-semibold transition duration-300 ease-in-out ${
                userSubscription?.planId._id === plan._id ? 'bg-gray-400 cursor-not-allowed' : 'hover:opacity-90'
              }`}
              style={{ backgroundColor: userSubscription?.planId._id === plan._id ? '' : '#cb1e19' }}
            >
              {userSubscription?.planId._id === plan._id ? 'Subscribed' : 'Subscribe Now'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}