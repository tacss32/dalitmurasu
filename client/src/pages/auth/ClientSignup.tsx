import React, { useEffect, useState } from "react";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { Link, useLocation, useNavigate } from "react-router-dom";
 
export default function ClientSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState(""); // <-- NEW: Date of Birth
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
 
  const API_BASE = (import.meta.env.VITE_API || "").replace(/\/$/, "");
 
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get("token");
    const errorFromUrl = params.get("error");
 
    if (errorFromUrl) {
      console.error("Google signup error:", errorFromUrl);
    }
 
    if (tokenFromUrl) {
      localStorage.setItem("clientToken", tokenFromUrl);
      navigate("/home", { replace: true });
      return;
    }
 
    const existingToken = localStorage.getItem("clientToken");
    if (!existingToken) {
      setVerifying(false);
      return;
    }
 
    const verifyToken = async () => {
      try {
        const res = await axios.post(
          `${API_BASE}/api/auth/client/verify-token`,
          {},
          { headers: { Authorization: `Bearer ${existingToken}` } }
        );
        if (res.data.isValid) {
          navigate("/home", { replace: true });
        } else {
          localStorage.removeItem("clientToken");
          setVerifying(false);
        }
      } catch (err: any) {
        console.error("Token verification failed in signup:", err?.response?.data?.message || err);
        localStorage.removeItem("clientToken");
        setVerifying(false);
      }
    };
 
    verifyToken();
  }, [location, navigate, API_BASE]);
 
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/auth/client/register`, {
        name,
        email,
        phone,
        gender,
        password,
        dob, // <-- send DOB to backend
      });
 
      if (res.data.token) {
        localStorage.setItem("clientToken", res.data.token);
        navigate("/home");
      } else {
        alert("Signup successful! Please log in.");
        navigate("/login");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Signup failed");
    }
  };
 
  const handleGoogleSignup = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

 
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Checking session…</span>
      </div>
    );
  }
 
  const handleBackToHome = () => {
  navigate("/home");
  };
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
      <div className=" p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center"> Signup</h2>
         <div className="flex justify-start mb-4">
          <button
            onClick={handleBackToHome}
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            &larr; Back to Home
          </button>
        </div>
 
        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="text"
            placeholder="Phone Number"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            required
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
 
          {/* NEW: Date of Birth input */}
          <input
            type="date"
            placeholder="Date of Birth"
            required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
 
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
          >
            Sign Up
          </button>
        </form>
 
        <div className="my-4 text-center text-sm">or</div>
 
        <button
          onClick={handleGoogleSignup}
          type="button"
          className="flex items-center justify-center gap-2 w-full  border border-gray-300 py-2 rounded hover:shadow-md transition"
        >
          <FcGoogle size={24} />
          <span className="text-gray-700 font-medium">Sign up with Google</span>
        </button>
 
        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
 
 