import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaEdit } from "react-icons/fa";

// Define interface for user 
interface UserDetails {
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  isSubscribed: boolean;
  subscriptionExpiresAt: string | null;
}

const API = import.meta.env.VITE_API;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 🔑 NEW STATE: To hold the password error message for inline display
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    currentPassword: "",
    phone: "",
    dob: "",
    gender: "",
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      toast.error("User not logged in.");
      setLoading(false);
      return;
    }
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem("clientToken");
      if (!token) throw new Error("No token found");

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
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

      {isEditing ? (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* ... (Other InputFields: Name, Email, Phone, DOB, Gender) ... */}

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
          <InputField label="Subscription Status" name="isSubscribed" value={userDetails.isSubscribed ? "Active" : "Inactive"} onChange={handleInputChange} readOnly />
          {userDetails.isSubscribed && (
            <InputField label="Subscription Expires" name="subscriptionExpiresAt" value={formatDate(userDetails.subscriptionExpiresAt)} onChange={handleInputChange} readOnly />
          )}
        </div>
      )}
    </div>
  );
}

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