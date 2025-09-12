import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(true); // start true until we check token
  const navigate = useNavigate();
  const location = useLocation();

  // const logoHeightClass =  "h-20" : "h-36";

  // Ensure no trailing slash in base URL
  const API_BASE = (import.meta.env.VITE_API || "").replace(/\/$/, "");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get("token");
    const uidFromUrl = params.get("uid"); // <-- Get uid from URL
    const errorFromUrl = params.get("error");

    if (errorFromUrl) {
      console.error("Google login error:", errorFromUrl);
      // Fall through and allow manual login
    }

    if (tokenFromUrl && uidFromUrl) {
      // <-- Check for both token and uid
      localStorage.setItem("clientToken", tokenFromUrl);
      localStorage.setItem("userId", uidFromUrl); // <-- Store userId from Google login
      // Clear query params & go home
      navigate("/home", { replace: true });
      return;
    } else if (tokenFromUrl && !uidFromUrl) {
      // Handle cases where token is present but uid is not (shouldn't happen with current backend)
      console.warn("Token received from Google login, but userId (uid) is missing.");
      localStorage.setItem("clientToken", tokenFromUrl); // Still store the token
      // You might want to navigate to a generic logged-in state or show an error
      navigate("/home", { replace: true }); // Or adjust as needed
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
          // If token is valid, ensure userId is also present (especially for older sessions or if not set initially)
          if (res.data.user && res.data.user._id) {
            localStorage.setItem("userId", res.data.user._id); // Ensure userId is set on re-validation
          }
          navigate("/home", { replace: true });
        } else {
          localStorage.removeItem("clientToken");
          localStorage.removeItem("userId"); // Also remove userId on invalid token
          setVerifying(false);
        }
      } catch (err: any) {
        console.error(
          "Token verification failed:",
          err?.response?.data?.message || err
        );
        localStorage.removeItem("clientToken");
        localStorage.removeItem("userId"); // Also remove userId on verification failure
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
      localStorage.setItem("clientToken", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      navigate("/home");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Login failed");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  // NEW: Handler for back to home
  const handleBackToHome = () => {
    navigate("/home");
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
  <div className={` bg-transparent`}>
    <Link to="/">
      <img
        src={"/logo1.png"}
        alt="logo"
        className={"h-20"}
      />
    </Link>
  </div>
       <div className=" p-6 rounded-xl shadow-xl w-full max-w-md">
       <h2 className="text-2xl font-bold text-center mb-6">Login</h2> 

        {/* NEW: Back to Home Button/Link */}
        <div className="flex justify-start mb-4">
          <button
            onClick={handleBackToHome}
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            &larr; Back to Home
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
          className="flex items-center justify-center gap-2 w-full  border border-gray-300 py-2 rounded hover:shadow-md transition"
        >
          <FcGoogle size={24} />
          <span className="text-gray-700 font-medium">Sign in with Google</span>
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