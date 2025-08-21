import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaLock, FaEnvelope, FaCode } from "react-icons/fa"; // Using FaCode for the reset code input

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Send code, 2: Verify OTP, 3: Reset password
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_BASE = (import.meta.env.VITE_API || "").replace(/\/$/, "");

  // Handler for sending the reset code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE}/api/forgot-password/send-code`, { email });
      setMessage(res.data.message);
      setStep(2); // Move to the OTP verification step
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for verifying the OTP code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Assuming a new API endpoint for code verification
      const res = await axios.post(`${API_BASE}/api/forgot-password/verify-code`, {
        email,
        code,
      });
      setMessage(res.data.message);
      setStep(3); // Move to the password reset step
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "OTP verification failed. Please check the code.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for setting the new password after OTP is verified
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // CORRECTED: Changed the endpoint to match the backend router
      const res = await axios.post(`${API_BASE}/api/forgot-password/reset-password`, {
        email,
        newPassword,
      });
      setMessage(res.data.message);
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Forgot Password
        </h2>

        {message && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded" role="alert">
            <p>{message}</p>
          </div>
        )}

        {/* Step 1: Send Reset Code */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaEnvelope />
              </span>
              <input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-highlight-1 text-white py-2 rounded hover:bg-black transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
            <div className="text-sm text-center text-gray-500 mt-4">
              Remember your password?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Login here
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaEnvelope />
              </span>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled // Prevent editing after the first step
              />
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaCode />
              </span>
              <input
                type="text"
                placeholder="6-digit reset code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-highlight-1 text-white py-2 rounded hover:bg-black transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <div className="text-sm text-center text-gray-500 mt-4">
              Remember your password?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Login here
              </Link>
            </div>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {step === 3 && (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaEnvelope />
              </span>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled // Prevent editing
              />
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaLock />
              </span>
              <input
                type="password"
                placeholder="New Password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaLock />
              </span>
              <input
                type="password"
                placeholder="Confirm New Password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-highlight-1 text-white py-2 rounded hover:bg-black transition disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Set New Password"}
            </button>
            <div className="text-sm text-center text-gray-500 mt-4">
              Remember your password?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Login here
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}