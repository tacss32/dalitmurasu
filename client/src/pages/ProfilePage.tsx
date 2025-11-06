import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaEdit } from "react-icons/fa";
import { MdTimer } from "react-icons/md";

// Define interface for user
interface UserDetails {
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
}

interface ActiveSubscription {
  planName: string;
  expiresAt: string;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
}

const API = import.meta.env.VITE_API;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSubscription, setActiveSubscription] =
    useState<ActiveSubscription | null>(null);
  const [isCheckingSubscription, setIsCheckingSubscription] =
    useState<boolean>(true);

  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
  });

  // Fetch profile details
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

  // Fetch active subscription
  const fetchActiveSubscription = async () => {
    const token = localStorage.getItem("clientToken");
    if (!token) {
      setIsCheckingSubscription(false);
      return;
    }

    try {
      const res = await axios.get(`${API}api/subscription/subscription-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && res.data.isActive) {
        setActiveSubscription(res.data.subscription);
      } else {
        setActiveSubscription(null);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setActiveSubscription(null);
    } finally {
      setIsCheckingSubscription(false);
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
    fetchActiveSubscription();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("clientToken");
      if (!token) throw new Error("No token found");

      const payload: Record<string, string> = {};
      if (formData.name !== userDetails?.name) payload.name = formData.name;
      if (formData.phone !== userDetails?.phone) payload.phone = formData.phone;
      if (formData.dob !== userDetails?.dob?.slice(0, 10))
        payload.dob = formData.dob;
      if (formData.gender.toLowerCase() !== userDetails?.gender?.toLowerCase())
        payload.gender = formData.gender.toLowerCase();

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
    } catch (err: any) {
      console.error(err);
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Update failed. Please check your inputs.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getRemainingDays = (expiresAt: string) => {
    const expDate = new Date(expiresAt);
    const diff = expDate.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading)
    return <p className="text-center mt-8">Loading profile...</p>;

  if (!userDetails)
    return (
      <p className="text-center mt-8 text-red-500">
        Could not load profile. Try again later.
      </p>
    );

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-background-to dark:bg-gray-800 shadow-lg rounded-xl">
      {/* Profile Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Profile
        </h2>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            <FaEdit className="text-2xl" />
          </button>
        )}
      </div>
      {/* 🔥 Active Subscription Section */}
      <div className="mt-10">
        {isCheckingSubscription ? (
          <p className="text-center text-gray-600">Checking subscription...</p>
        ) : activeSubscription ? (
          <div className="bg-white/60 dark:bg-gray-700 p-5 rounded-lg shadow border border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-center text-highlight-1 mb-3">
              Active Subscription
            </h3>
            <div className="text-center text-gray-800 dark:text-gray-200">
              <p className="font-bold text-lg">
                {activeSubscription.planName}
              </p>
              <p className="text-sm mt-1">
                Expires on:{" "}
                  {new Date(activeSubscription.expiresAt).toLocaleDateString('en-GB')}
              </p>
              <div className="flex justify-center items-center gap-2 mt-2">
                <MdTimer className="text-highlight-1" />
                <span>
                  {getRemainingDays(activeSubscription.expiresAt)} day
                  {getRemainingDays(activeSubscription.expiresAt) !== 1
                    ? "s"
                    : ""}{" "}
                  remaining
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-700 p-5 rounded-lg text-center text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
            No active subscription found.
          </div>
        )}
      </div>

      {/* Profile Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <InputField
          label="Name"
          name="name"
          value={isEditing ? formData.name : userDetails.name}
          onChange={handleInputChange}
          required
          readOnly={!isEditing}
        />

        <InputField
          label="Email"
          name="email"
          type="email"
          value={userDetails.email}
          onChange={handleInputChange}
          required
          readOnly={true}
        />

        <InputField
          label="Phone"
          name="phone"
          value={isEditing ? formData.phone : userDetails.phone || "N/A"}
          onChange={handleInputChange}
          readOnly={!isEditing}
        />

        <InputField
          label="Date of Birth"
          name="dob"
          type={isEditing ? "date" : "text"}
          value={
            isEditing
              ? formData.dob
              : userDetails.dob
                ? new Date(userDetails.dob).toLocaleDateString('en-GB')
                : "N/A"
          }
          onChange={handleInputChange}
          readOnly={!isEditing}
        />

        {/* Gender */}
        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Gender
          </label>
          {isEditing ? (
            <select
              name="gender"
              id="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full mt-1 px-3 py-2 border rounded-md  dark:border-gray-600 dark:text-white"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          ) : (
            <input
              id="gender"
              name="gender"
              type="text"
              value={userDetails.gender || "N/A"}
              readOnly={true}
              className="w-full mt-1 px-3 py-2 border rounded-md  dark:border-gray-600 dark:text-white "
            />
          )}
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: userDetails.name,
                  email: userDetails.email,
                  phone: userDetails.phone || "",
                  dob: userDetails.dob?.slice(0, 10) || "",
                  gender: userDetails.gender || "",
                });
              }}
              className="px-4 py-2  text-gray-800 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
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
        )}
      </form>

     
    </div>
  );
}

// Reusable InputField Component
const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  readOnly = false,
  error = null,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  error?: string | null;
}) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
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
      className={`w-full mt-1 px-3 py-2 border rounded-md  dark:border-gray-600 dark:text-white ${readOnly ? "read-only:bg-background-to dark:read-only:bg-background-to" : ""
        } ${error
          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
          : ""
        }`}
    />
    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
  </div>
);
