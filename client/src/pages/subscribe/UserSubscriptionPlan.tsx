import { useState, useEffect, useCallback } from "react";
import axios from "axios";
// Import useNavigate from react-router-dom (assuming you are using it)
import { useNavigate } from "react-router-dom";
import {
  MdCheckCircle,
  MdStar,
  MdAccessTime,
  MdTimer,
  // Added an icon for donation
  MdOutlineAttachMoney,
} from "react-icons/md";

interface SubscriptionPlan {
  _id: string;
  title: string;
  description?: string;
  price: number;
  durationInDays: number;
  createdAt?: string;
  updatedAt?: string;
}

interface SubscriptionItem {
  plan: SubscriptionPlan;
  startDate: string;
  endDate: string;
}

interface UserSubscriptionStatus {
  isActive: boolean;
  overallEndDate: string;
  stackedCount: number;
  subscriptions: SubscriptionItem[];
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
  const [userSubData, setUserSubData] = useState<UserSubscriptionStatus | null>(
    null
  );
  const [remainingDays, setRemainingDays] = useState<number | null>(null);

  // --- NEW: Initialize useNavigate hook ---
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API;

  const fetchPlansAndSubscription = useCallback(async () => {
    // Set loading to true only if data isn't already present
    setLoading((prev) => !prev && !plans.length);
    try {
      const token = localStorage.getItem("clientToken");

      // Fetch all available plans (only if not already fetched)
      if (plans.length === 0) {
        const plansRes = await axios.get(`${API_BASE_URL}api/subscription/`);
        setPlans(plansRes.data);
      }

      if (token) {
        const res = await axios.get(
          `${API_BASE_URL}api/subscription/user-status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data: UserSubscriptionStatus = res.data;
        console.log("Subscription status:", data);
        setUserSubData(data);

        if (data.isActive && data.overallEndDate) {
          const endDate = new Date(data.overallEndDate);
          const now = new Date();
          const diff = endDate.getTime() - now.getTime();
          const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
          setRemainingDays(daysLeft);
        } else {
          setRemainingDays(null);
        }
      }
    } catch (err) {
      console.error("Error fetching plans/subscriptions:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, plans.length]); // Add plans.length as dependency

  useEffect(() => {
    fetchPlansAndSubscription();
  }, [fetchPlansAndSubscription]); // Dependency array now includes the callback

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Page is visible, re-fetching subscription status...");
        fetchPlansAndSubscription();
      }
    };

    // Add event listener for tab visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchPlansAndSubscription]); // Dependency array includes the callback

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if ((userSubData?.stackedCount ?? 0) >= 2) {
      alert("Subscription limit reached. You cannot add another plan.");
      return;
    }

    const token = localStorage.getItem("clientToken");
    if (!token) {
      alert("Please login to subscribe.");
      return;
    }

    try {
      const createOrderRes = await axios.post(
        `${API_BASE_URL}api/subscription/create-order`,
        { planId: plan._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { razorpayOrderId, amount, currency } = createOrderRes.data;

      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount,
        currency,
        name: "Dalit Murasu",
        description: `Subscription: ${plan.title}`,
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await axios.post(
              `${API_BASE_URL}api/subscription/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan._id,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              alert("Subscription successful!");
              // Call fetch function instead of full reload
              fetchPlansAndSubscription();
            } else {
              alert(verifyRes.data.message || "Payment verification failed.");
            }
          } catch (error) {
            console.error("Verification Error:", error);
            alert("Error verifying payment.");
          }
        },
        prefill: { name: "Dalit Murasu User", email: "" },
        theme: { color: "#feebbd" },
      });

      razorpay.open();
    } catch (error: any) {
      console.error("Payment Error:", error);
      if (error.response && error.response.data.limitReached) {
        alert(error.response.data.message); // Show specific error from backend
      } else {
        alert("Failed to initiate payment.");
      }
    }
  };

  // --- NEW: Handler for the donation button ---
  const handleDonationClick = () => {
    navigate("/donation");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl font-semibold">Loading subscription plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[#feebbd] flex flex-col items-center">
      <h2 className="text-4xl font-extrabold mb-5 text-center text-[#cb1e19]">
        Choose Your Subscription Plan
      </h2>

      {/* --- NEW: Donation Button Added Here --- */}
      <button
        onClick={handleDonationClick}
        className="flex items-center justify-center mb-10 px-6 py-3 rounded-lg text-white font-semibold transition bg-highlight-1 hover:bg-highlight-1/90 shadow-md"
      >
        <MdOutlineAttachMoney className="text-2xl mr-2" />
         Make a Donation
      </button>
      {/* ------------------------------------- */}

      {/* Active Subscription Details */}
      {userSubData && userSubData.isActive && (
        <div className="mb-8 w-full max-w-3xl bg-white/50 p-5 rounded-xl shadow">
          <h3 className="text-2xl font-bold text-center mb-4 text-gray-800">
            Your Active Subscriptions
          </h3>

          {userSubData.subscriptions.map((sub, index) => (
            <div
              key={index}
              className="border border-gray-300 rounded-lg p-4 mb-3 "
            >
              <h4 className="text-lg font-semibold text-[#cb1e19]">
                {sub.plan?.title || "Plan not found"}
              </h4>
              <p className="text-gray-600 text-sm">
                Start: {new Date(sub.startDate).toLocaleDateString()} <br />
                End: {new Date(sub.endDate).toLocaleDateString()}
              </p>
            </div>
          ))}

          <div className="flex justify-center items-center space-x-2 mt-3 text-gray-800 font-semibold">
            <MdTimer className="text-red-600 text-xl" />
            {remainingDays !== null && (
              <span>
                Overall expiry in{" "}
                <span className="font-bold text-red-700">{remainingDays}</span>{" "}
                day{remainingDays !== 1 ? "s" : ""}.
              </span>
            )}
          </div>

          <div className="text-center mt-2 text-sm text-gray-600">
            Stacked subscriptions: {userSubData?.stackedCount ?? 0} / 2
          </div>
        </div>
      )}

      {/* Warning if limit reached */}
      {(userSubData?.stackedCount ?? 0) >= 2 && (
        <div className="mb-8 bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-md text-center">
          <p className="font-semibold">
            You have reached the maximum limit of 2 stacked subscriptions.
          </p>
        </div>
      )}

      {/* All Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {plans.map((plan) => {
          const isActive = userSubData?.subscriptions.some(
            (sub) => sub.plan?._id === plan._id
          );

          return (
            <div
              key={plan._id}
              className={`relative bg-white/50 rounded-xl shadow-lg p-6 transition duration-300 ${isActive
                  ? "border-2 border-red-600"
                  : "border border-gray-200"
                }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Active Plan
                </div>
              )}
              <h3 className="text-2xl font-bold text-center mb-3 text-gray-800">
                {plan.title}
              </h3>
              <p className="text-center text-gray-600 mb-4">
                {plan.description || "No description provided."}
              </p>
              <div className="text-center mb-6">
                <span className="text-5xl font-extrabold text-red-600">
                  ₹{plan.price.toFixed(2)}
                </span>
                <span className="text-xl text-gray-500">
                  {" "}
                  / {plan.durationInDays} days
                </span>
              </div>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-center">
                  <MdCheckCircle className="text-green-500 mr-2 text-xl" />{" "}
                  Access to Premium Content
                </li>
                <li className="flex items-center">
                  <MdStar className="text-blue-500 mr-2 text-xl" /> Ad-Free
                  Experience
                </li>
                <li className="flex items-center">
                  <MdAccessTime className="text-purple-500 mr-2 text-xl" />{" "}
                  Unlimited Reading
                </li>
              </ul>
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={(userSubData?.stackedCount ?? 0) >= 2}
                className="w-full py-3 rounded-lg text-white font-semibold transition bg-[#cb1e19] hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isActive
                  ? "Extend Subscription"
                  : userSubData?.isActive // Check if user has *any* active sub
                    ? "Add New Plan"
                    : "Subscribe Now"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}