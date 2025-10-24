
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaEdit } from "react-icons/fa";
// 🔑 NEW IMPORT
import { MdTimer } from "react-icons/md";

// Define interface for user 
interface UserDetails {
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  subscriptionExpiresAt: string | null;
}

// 🔑 NEW INTERFACES (Copied from usersubscriptionplan.tsx for local use)
interface SubscriptionPlan {
  _id: string;
  title: string;
  durationInDays: number;
  // Removed price, description, timestamps as they aren't used in the profile display
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
// --------------------------------------------------

const API = import.meta.env.VITE_API;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 🔑 NEW STATE: To hold subscription data
  const [userSubData, setUserSubData] = useState<UserSubscriptionStatus | null>(
    null
  );
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  // ------------------------------------

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    currentPassword: "",
    phone: "",
    dob: "",
    gender: "",
  });

  // 🔑 NEW FUNCTION: Fetch Subscription Status
  const fetchSubscriptionStatus = async (token: string) => {
    try {
      const res = await axios.get<UserSubscriptionStatus>(
        `${API}api/subscription/user-status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data: UserSubscriptionStatus = res.data;
      setUserSubData(data);

      if (data.overallEndDate) {
        const endDate = new Date(data.overallEndDate);
        const now = new Date();
        const diff = endDate.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        setRemainingDays(daysLeft);
      }
    } catch (err) {
      console.error("Error fetching subscription status for profile:", err);
      // Fail silently for profile page if subscription status can't be fetched
    }
  };

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem("clientToken");
      if (!token) throw new Error("No token found");

      // 1. Fetch User Details
      const res = await axios.get<{ success: boolean; data: UserDetails }>(
        `${API}api/client-users/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data.data;
      setUserDetails(data);
      setFormData({
        name: data.name || "",
        email: data.email || "",
        password: "",
        currentPassword: "",
        phone: data.phone || "",
        dob: data.dob ? data.dob.slice(0, 10) : "",
        gender: data.gender || "",
      });

      // 2. Fetch Subscription Status
      await fetchSubscriptionStatus(token);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      toast.error("User not logged in.");
      setLoading(false);
      return;
    }
    fetchUserDetails();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Clear password error when user starts typing
    if (name === "currentPassword" || name === "password") {
      setPasswordError(null);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError(null); // Clear previous error before submission

    try {
      const token = localStorage.getItem("clientToken");
      if (!token) throw new Error("No token found");

      const payload: Record<string, string> = {};
      if (formData.name !== userDetails?.name) payload.name = formData.name;
      if (formData.email !== userDetails?.email) payload.email = formData.email;
      if (formData.phone !== userDetails?.phone) payload.phone = formData.phone;
      if (formData.dob !== userDetails?.dob?.slice(0, 10)) payload.dob = formData.dob;
      if (formData.gender.toLowerCase() !== userDetails?.gender?.toLowerCase())
        payload.gender = formData.gender.toLowerCase();
      // --- New Password Logic ---
      if (formData.password.trim()) {
        // Client-side check 1
        if (!formData.currentPassword.trim()) {
          toast.error("Please enter your current password to set a new one.");
          setLoading(false);
          return;
        }

        payload.password = formData.password;
        payload.currentPassword = formData.currentPassword;
      } else if (formData.currentPassword.trim()) {
        // Client-side check 2
        toast.error("New password cannot be empty.");
        setLoading(false);
        return;
      }
      // --- End New Password Logic ---

      if (Object.keys(payload).length === 0) {
        toast.info("No changes made.");
        setIsEditing(false);
        setLoading(false);
        return;
      }

      const res = await axios.put<{ success: boolean; data: UserDetails }>(
        `${API}api/client-users/profile`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserDetails(res.data.data);
      toast.success("Profile updated!");
      setIsEditing(false);
      // Reset passwords in state after successful update
      setFormData(prev => ({ ...prev, password: "", currentPassword: "" }));
    } catch (err: any) {
      console.error(err);

      const message = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : "Update failed. Please check your inputs.";

      // 🔑 KEY FIX: If the message indicates a wrong current password, set the inline error state
      if (message === "Current password is incorrect") {
        setPasswordError(message);
        toast.error("Password update failed. Please check the current password.");
      } else {
        toast.error(message);
      }

    } finally {
      setLoading(false);
    }
  };


  if (loading) return <p className="text-center mt-8">Loading profile...</p>;

  if (!userDetails)
    return (
      <p className="text-center mt-8 text-red-500">
        Could not load profile. Try again later.
      </p>
    );

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-background-to dark:bg-gray-800 shadow-lg rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            <FaEdit className="text-2xl" />
          </button>
        )}
      </div>

      {/* 🔑 NEW SECTION: Active Subscription Details */}
      <SubscriptionStatusCard
        userSubData={userSubData}
        remainingDays={remainingDays}
      />
      {/* ------------------------------------------- */}

      {isEditing ? (
        <form onSubmit={handleUpdateProfile} className="space-y-4">

          <InputField label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
          <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required readOnly={true} />
          <InputField label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} readOnly={true} />
          <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleInputChange} />
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
            <select
              name="gender"
              id="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* New Field: Current Password (WITH INLINE ERROR) */}
          <InputField
            label="Current Password"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleInputChange}
            placeholder="Required to set a new password"
            // Pass the error down to the InputField component
            error={passwordError}
          />

          {/* Password */}
          <InputField
            label="New Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Leave blank to keep current"
          />

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setPasswordError(null); // Clear error on cancel
                setFormData({
                  name: userDetails.name,
                  email: userDetails.email,
                  currentPassword: "",
                  password: "",
                  phone: userDetails.phone || "",
                  dob: userDetails.dob?.slice(0, 10) || "",
                  gender: userDetails.gender || "",
                });
              }}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-highlight-1 text-white rounded-md hover:bg-green-700"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <InputField label="Name" name="name" value={userDetails.name} onChange={handleInputChange} readOnly />
          <InputField label="Email" name="email" type="email" value={userDetails.email} onChange={handleInputChange} readOnly />
          <InputField label="Phone" name="phone" value={userDetails.phone || "N/A"} onChange={handleInputChange} readOnly />
          <InputField label="Date of Birth" name="dob" type="date" value={userDetails.dob ? userDetails.dob.slice(0, 10) : ""} onChange={handleInputChange} readOnly />
          <InputField label="Gender" name="gender" value={userDetails.gender || "N/A"} onChange={handleInputChange} readOnly />

        </div>
      )}
    </div>
  );
}

// 🔑 NEW COMPONENT: SubscriptionStatusCard
const SubscriptionStatusCard = ({
  userSubData,
  remainingDays,
}: {
  userSubData: UserSubscriptionStatus | null;
  remainingDays: number | null;
}) => {
  if (!userSubData || !userSubData.isActive) {
    return (
      <div className="p-4 bg-highlight-1/30 dark:bg-gray-700 rounded-lg text-center text-gray-600 dark:text-gray-400 mb-6">
        You do not have any active subscriptions.
      </div>
    );
  }

  return (
    <div className="mb-6 w-full  dark:bg-gray-700 p-4 rounded-xl shadow-inner border border-red-300 dark:border-red-800">
      <h3 className="text-xl font-bold text-center mb-3  dark:text-red-400">
        Active Subscription Details
      </h3>

      {userSubData.subscriptions.map((sub, index) => (
        <div key={index} className="border-b border-gray-300 dark:border-gray-600 last:border-b-0 py-2">
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Plan: {sub.plan.title}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Ends: <span className="font-medium">
              {new Date(sub.endDate).toLocaleDateString()}
            </span>
          </p>
        </div>
      ))}

      <div className="flex justify-center items-center space-x-2 mt-4 text-gray-800 dark:text-gray-200 font-semibold">
        <MdTimer className="text-red-600 text-xl" />
        {remainingDays !== null && (
          <span>
            Overall expiry in{" "}
            <span className="font-bold text-red-700 dark:text-red-400">{remainingDays}</span>{" "}
            day{remainingDays !== 1 ? "s" : ""}.
          </span>
        )}
      </div>
      <div className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
        Stacked subscriptions: <span className="font-medium">{userSubData.stackedCount} / 2</span>
      </div>
    </div>
  );
};

// 🔑 InputField Component Updated to display error message
const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  readOnly = false,
  error = null, // New prop for error message
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  error?: string | null; // New prop interface
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
      placeholder={placeholder}
      required={required}
      readOnly={readOnly}
      className={`w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
        // Apply red border if an error exists
        error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        }`}
    />
    {/* Conditional Error Message */}
    {error && (
      <p className="text-sm text-red-500 mt-1">{error}</p>
    )}
  </div>
);