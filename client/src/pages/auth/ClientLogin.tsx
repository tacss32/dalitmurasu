
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

// Define a unique event name for global listener
const LOGIN_SUCCESS_EVENT = "clientLoginSuccess";

// Helper function to dispatch the event
const dispatchLoginSuccess = () => {
    window.dispatchEvent(new Event(LOGIN_SUCCESS_EVENT));
};


export default function ClientLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [verifying, setVerifying] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Ensure no trailing slash in base URL
    const API_BASE = (import.meta.env.VITE_API || "").replace(/\/$/, "");

    // -----------------------------------------------------------------
    // ✅ NEW HELPER: Force a subscription status check on the backend
    // -----------------------------------------------------------------
    const checkAndFixSubscriptionStatus = async (token: string) => {
        try {
            console.log("Checking subscription status for potential expiry fix...");
            await axios.get(
                `${API_BASE}/api/subscription/user-status`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // The backend's getUserSubscriptionStatus route will automatically
            // update the DB if the subscription is expired.
            console.log("Subscription status check complete.");
        } catch (error) {
            console.warn("Failed to check subscription status (may not be critical):", error);
            // Continue execution even if this check fails
        }
    };
    // -----------------------------------------------------------------


    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tokenFromUrl = params.get("token");
        const uidFromUrl = params.get("uid");
        const errorFromUrl = params.get("error");

        if (errorFromUrl) {
            console.error("Google login error:", errorFromUrl);
            // Fall through and allow manual login
        }

        if (tokenFromUrl && uidFromUrl) {
            localStorage.setItem("clientToken", tokenFromUrl);
            localStorage.setItem("userId", uidFromUrl);

            // Force expiry check before navigating
            checkAndFixSubscriptionStatus(tokenFromUrl);

            // ✅ NEW: Dispatch event after successful Google login
            dispatchLoginSuccess();

            // Clear query params & go home
            navigate("/", { replace: true });
            return;
        } else if (tokenFromUrl && !uidFromUrl) {
            console.warn("Token received from Google login, but userId (uid) is missing.");
            localStorage.setItem("clientToken", tokenFromUrl);

            // Force expiry check before navigating
            checkAndFixSubscriptionStatus(tokenFromUrl);

            // ✅ NEW: Dispatch event even if uid is missing (to update token status)
            dispatchLoginSuccess();

            navigate("/", { replace: true });
            return;
        }

        const existingToken = localStorage.getItem("clientToken");
        if (!existingToken) {
            setVerifying(false);
            return;
        }

        // Verify existing token
        const verifyToken = async () => {
            try {
                const res = await axios.post(
                    `${API_BASE}/api/auth/client/verify-token`,
                    {},
                    { headers: { Authorization: `Bearer ${existingToken}` } }
                );
                if (res.data.isValid) {
                    if (res.data.user && res.data.user._id) {
                        localStorage.setItem("userId", res.data.user._id);
                    }

                    // Force expiry check before navigating
                    checkAndFixSubscriptionStatus(existingToken);

                    // ✅ NEW: Dispatch event on successful session verification
                    dispatchLoginSuccess();

                    navigate("/", { replace: true });
                } else {
                    localStorage.removeItem("clientToken");
                    localStorage.removeItem("userId");
                    setVerifying(false);
                }
            } catch (err: any) {
                console.error(
                    "Token verification failed:",
                    err?.response?.data?.message || err
                );
                localStorage.removeItem("clientToken");
                localStorage.removeItem("userId");
                setVerifying(false);
            }
        };
        verifyToken();
    }, [location, navigate, API_BASE]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_BASE}/api/auth/client/login`, {
                email,
                password,
            });
            const newToken = res.data.token;
            localStorage.setItem("clientToken", newToken);
            localStorage.setItem("userId", res.data.userId);

            // Force expiry check immediately after successful login
            checkAndFixSubscriptionStatus(newToken);

            // ✅ NEW: Dispatch event after successful standard login
            dispatchLoginSuccess();

            navigate("/");
        } catch (err: any) {
            alert(err?.response?.data?.message || "Login failed");
        }
    };

    // ... rest of the component remains the same
    const handleGoogleLogin = () => {
        // This redirects the user, the result will be handled by useEffect
        window.location.href = `${API_BASE}/api/auth/google`;
    };

    const handleBackToHome = () => {
        navigate("/");
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span>Checking session…</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
            {/* ... (rest of the component is unchanged) ... */}

            <div className=" p-6 rounded-xl shadow-xl w-full max-w-md flex justify-center flex-col items-center border">
                <Link to="/">
                    <img
                        src={"/logo1.webp"}
                        alt="logo"
                        className={"h-25"}
                    />
                </Link>
               

                {/* NEW: Back to Home Button/Link */}
                <div className="flex  mb-4 items-center justify-between w-full">
                     <h2 className="text-2xl font-bold text-highlight-1 ">Login</h2>
                    <button
                        onClick={handleBackToHome}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                        &larr;  Home
                    </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end text-sm">
                        <Link to="/forgot-password" className="text-blue-600 hover:underline">
                            Forgot Password?
                        </Link>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-highlight-1 text-white py-2 rounded hover:bg-black transition"
                    >
                        Login
                    </button>
                </form>

                <div className="my-4 text-center text-sm text-gray-500">or</div>

                <button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="flex items-center justify-center gap-2 w-full  shadow-highlight-1 py-2 rounded shadow-md hover:shadow-lg transition"
                >
                    <FcGoogle size={24} />
                    <span className="text-gray-700 font-medium  ">Sign in with Google</span>
                </button>

                <p className="mt-6 text-sm text-center">
                    Don’t have an account?{" "}
                    <Link to="/signup" className="text-blue-600 hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}