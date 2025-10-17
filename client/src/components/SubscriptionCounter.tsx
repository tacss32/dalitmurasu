import { useEffect, useState } from "react";
import axios from "axios";
import { MdTimer } from "react-icons/md";

interface SubscriptionPlan {
    _id: string;
    title: string;
}

interface UserSubscription {
    _id: string;
    planId: SubscriptionPlan;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

interface Props {
    onStatusFetched: (data: {
        userSubscription: UserSubscription | null;
        stackedCount: number;
    }) => void;
}

const API_BASE_URL = import.meta.env.VITE_API;

export default function UserSubscriptionStatus({ onStatusFetched }: Props) {
    const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
    const [remainingDays, setRemainingDays] = useState<number | null>(null);
    const [stackedCount, setStackedCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchUserStatus = async () => {
            try {
                const token = localStorage.getItem("clientToken");
                if (!token) {
                    setLoading(false);
                    return;
                }

                const userSubResponse = await axios.get(`${API_BASE_URL}api/subscription/user-status`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const subscription = userSubResponse.data.subscription || null;
                setUserSubscription(subscription);
                setStackedCount(userSubResponse.data.stackedCount || 0);

                // Calculate remaining days
                if (subscription?.endDate) {
                    const endDate = new Date(subscription.endDate);
                    const now = new Date();
                    const diff = endDate.getTime() - now.getTime();
                    const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                    setRemainingDays(daysLeft);
                } else {
                    setRemainingDays(null);
                }

                onStatusFetched({ userSubscription: subscription, stackedCount: userSubResponse.data.stackedCount || 0 });
            } catch (error) {
                console.error("Error fetching user subscription status:", error);
                onStatusFetched({ userSubscription: null, stackedCount: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchUserStatus();
    }, [onStatusFetched]);

    if (loading) return null;

    return (
        <div className="w-full flex flex-col items-center mb-8">
            {userSubscription && remainingDays !== null && (
                <div className="mb-4 text-center bg-white/40 px-6 py-3 rounded-lg shadow-md">
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

            {stackedCount >= 2 && (
                <div className="text-center bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-md">
                    <p className="font-semibold">
                        You have reached the maximum limit of 2 stacked subscriptions.
                    </p>
                    <p className="text-sm">You can subscribe to a new plan after your current one expires.</p>
                </div>
            )}
        </div>
    );
}
