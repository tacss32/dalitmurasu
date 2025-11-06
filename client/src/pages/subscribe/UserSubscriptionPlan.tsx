import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  MdCheckCircle,
  MdStar,
  MdAccessTime,
  MdTimer,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

// Interface for a single Subscription Plan
interface SubscriptionPlan {
  _id: string;
  title: string;
  description?: string;
  price: number;
  durationInDays: number;
}

// Interface for the client's single active subscription (the one that expires latest)
interface ActiveSubscription {
  planName: string;
  expiresAt: string;
}

// Interface for the server's response to the subscription status check
interface ActiveSubscriptionResponse {
  success: boolean;
  isActive: boolean;
  count: number;
  message: string;
  subscription?: ActiveSubscription;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function UserSubscriptionPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSubscription, setActiveSubscription] =
    useState<ActiveSubscription | null>(null);
  const [activeSubscriptionCount, setActiveSubscriptionCount] =
    useState<number>(0);
  const [isCheckingSubscription, setIsCheckingSubscription] =
    useState<boolean>(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalAction, setModalAction] = useState<(() => void) | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API;

  const fetchPlans = useCallback(async () => {
    try {
      const res = await axios.get<SubscriptionPlan[]>(
        `${API_BASE_URL}api/subscription/`
      );
      setPlans(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load plans. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const fetchActiveSubscription = useCallback(async () => {
    const token = localStorage.getItem("clientToken");
    if (!token) {
      setIsCheckingSubscription(false);
      setActiveSubscriptionCount(0);
      return;
    }

    try {
      const res = await axios.get<ActiveSubscriptionResponse>(
        `${API_BASE_URL}api/subscription/subscription-status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setActiveSubscriptionCount(res.data.count);
        if (res.data.isActive && res.data.subscription) {
          setActiveSubscription(res.data.subscription);
        } else {
          setActiveSubscription(null);
        }
      } else {
        setActiveSubscription(null);
        setActiveSubscriptionCount(0);
      }
    } catch (err) {
      console.error("Error fetching active subscription:", err);
      setActiveSubscription(null);
      setActiveSubscriptionCount(0);
    } finally {
      setIsCheckingSubscription(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchPlans();
    fetchActiveSubscription();
  }, [fetchPlans, fetchActiveSubscription]);

  const showModal = (message: string, action: (() => void) | null) => {
    setModalMessage(message);
    setModalAction(action ? () => action() : null);
    setIsModalOpen(true);
  };

  const handleModalConfirm = () => {
    if (modalAction) modalAction();
    setIsModalOpen(false);
    setModalAction(null);
  };
  const handleModalCancel = () => {
    setIsModalOpen(false);
    setModalAction(null);
  };

  // ✅ Updated handleSubscribe with phone number check
  const handleSubscribe = async (plan: SubscriptionPlan) => {
    const token = localStorage.getItem("clientToken");
    if (!token) {
      showModal(
        "You need to login to subscribe. Click OK to go to Login page.",
        () => {
          window.location.href = "/login";
        }
      );
      return;
    }

    try {
      // ✅ Step 1: Check user's profile for phone number
      const profileRes = await axios.get(`${API_BASE_URL}api/client-users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = profileRes.data?.data;

      if (!profile?.phone || profile.phone.trim() === "") {
        showModal(
          "Please update your profile with a valid phone number before subscribing.",
          null
        );
        return;
      }

      // ✅ Step 2: Check subscription limit
      if (activeSubscriptionCount >= 2) {
        showModal(
          "You already have 2 active subscriptions. You cannot purchase another one at this time.",
          null
        );
        return;
      }

      // ✅ Step 3: Create order
      const createOrderRes = await axios.post(
        `${API_BASE_URL}api/subscription/create-order`,
        { planId: plan._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, amount, currency, key, name, prefill } =
        createOrderRes.data;

      if (!orderId || !amount || !key || !currency) {
        showModal("Payment details missing. Please try again.", null);
        return;
      }

      // ✅ Step 4: Open Razorpay
      const razorpay = new window.Razorpay({
        key,
        amount,
        currency,
        name,
        description: `Subscription: ${plan.title}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await axios.post(
              `${API_BASE_URL}api/subscription/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              showModal(
                "Subscription successful! Your new plan has been stacked onto your current one.",
                null
              );
              fetchActiveSubscription();
            } else {
              showModal(
                verifyRes.data.message || "Payment verification failed.",
                null
              );
            }
          } catch (error) {
            console.error("Verification Error:", error);
            showModal(
              "Error verifying payment. Please check your network.",
              null
            );
          }
        },
        prefill: {
          name: prefill?.name || profile?.name || "User",
          email: prefill?.email || profile?.email || "",
          contact: profile?.phone || "",
        },
        theme: { color: "#c39553" },
      });

      razorpay.open();
    } catch (error: any) {
      console.error("Payment Error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to initiate payment.";

      if (error.response?.status === 400 && error.response?.data?.limitReached) {
        showModal(error.response.data.message, null);
      } else {
        showModal(errorMessage, null);
      }
    }
  };

  const Modal = ({
    message,
    onConfirm,
    onCancel,
    showCancel,
  }: {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    showCancel: boolean;
  }) => {
    const isProfileUpdate = message
      .toLowerCase()
      .includes("update your profile");

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border-t-4 border-[#cb1e19] relative">
          {/* ✅ Close Button (New Addition) */}
          <button
            onClick={onCancel} // Use onCancel to close the modal
            className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-900 transition rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          {/* End of Close Button */}
          <p className="text-lg text-gray-800 mb-6 text-center font-medium">
            {message}
          </p>
          <div className="flex justify-center space-x-4">
            {isProfileUpdate ? (
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  navigate("/profile");
                }}
                className="px-6 py-2 rounded-lg text-white font-semibold transition bg-[#cb1e19] hover:opacity-90"
              >
                Go to Profile
              </button>
            ) : (
              <button
                onClick={onConfirm}
                className="px-6 py-2 rounded-lg text-white font-semibold transition bg-[#cb1e19] hover:opacity-90"
              >
                {showCancel ? "OK" : "Close"}
              </button>
            )}
            {showCancel && !isProfileUpdate && (
              <button
                onClick={onCancel}
                className="px-6 py-2 rounded-lg text-gray-700 font-semibold border border-gray-300 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getRemainingDays = (expiresAt: string) => {
    const expDate = new Date(expiresAt);
    const diff = expDate.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isPurchaseBlocked = activeSubscriptionCount >= 2;

  if (loading || isCheckingSubscription) {
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
      {/* Active Subscription Section */}
      {activeSubscription ? (
        <div className="mb-8 w-full max-w-3xl bg-white/50 p-5 rounded-xl shadow flex flex-col sm:flex-row justify-around items-center space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-2xl font-bold text-center text-[#cb1e19]">
              Your Active Subscription
              {activeSubscriptionCount > 1
                ? `s (${activeSubscriptionCount})`
                : ""}
            </h3>
            <div className="flex justify-center items-center space-x-2 text-gray-800 font-semibold mt-2">
              <MdTimer className="text-red-600 text-xl" />
              <span>
                Overall expiry in{" "}
                <span className="font-bold text-red-700">
                  {getRemainingDays(activeSubscription.expiresAt)}
                </span>{" "}
                day
                {getRemainingDays(activeSubscription.expiresAt) !== 1
                  ? "s"
                  : ""}
                .
              </span>
            </div>
          </div>
          <div className="border border-gray-300 rounded-lg p-4 bg-white">
            <h4 className="text-lg font-semibold text-[#cb1e19]">
              {activeSubscription.planName} (Latest)
            </h4>
            <p className="text-gray-600 text-sm">
              Expires on:{" "}
              {new Date(activeSubscription.expiresAt).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
      ) : (
        <h2 className="text-4xl font-extrabold mb-5 text-center text-[#cb1e19]">
          Choose Your Subscription Plan
        </h2>
      )}

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`relative bg-white/50 rounded-xl shadow-lg p-6 border border-gray-200 transition duration-300 ${isPurchaseBlocked ? "opacity-70" : "hover:shadow-2xl"
              }`}
          >
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
                <MdCheckCircle className="text-green-500 mr-2 text-xl" /> Access
                to Premium Content
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

            {/* Button */}
            <button
              onClick={() => handleSubscribe(plan)}
              disabled={isPurchaseBlocked}
              className={`w-full py-3 rounded-lg text-white font-semibold transition ${isPurchaseBlocked
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#cb1e19] hover:opacity-90"
                }`}
            >
              {isPurchaseBlocked
                ? "Limit Reached"
                : activeSubscriptionCount > 0
                  ? "Stack & Extend"
                  : "Subscribe Now"}
            </button>

            {activeSubscriptionCount === 1 && (
              <div className="mt-2 text-center text-sm font-medium text-highlight-1">
                Already active: Buying this plan will extend your expiry date!
              </div>
            )}
            {isPurchaseBlocked && (
              <div className="mt-2 text-center text-sm text-red-600 font-medium">
                You have {activeSubscriptionCount} active plans. Cannot purchase
                more.
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <Modal
          message={modalMessage}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          showCancel={!!modalAction}
        />
      )}

      {/* Support Message */}
      <div className="mt-12 text-center">
        <p className="text-lg font-semibold text-gray-800 bg-white/70 p-4 rounded-xl inline-block shadow-md">
          Support the voice for equality –{" "}
          <span className="text-[#cb1e19] font-bold">
            Contact 9444452877
          </span>{" "}
          to donate.
        </p>
      </div>
    </div>
  );
}
