import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { MdPerson, MdCreditCard, MdEvent, MdAddCircleOutline, MdCheckCircle } from "react-icons/md"; // Added MdCheckCircle

// ... (Interface definitions remain the same)
interface IUser {
    _id: string;
    name: string;
    email: string;
    phone: string;
}

interface IPlan {
    _id: string;
    title: string;
    durationInDays: number;
    price: number;
}


// --- Modal Component ---
// This simple component renders the popup when `isSuccessModalOpen` is true
const SuccessModal: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full text-center">
                <MdCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3 text-gray-800">Success!</h3>
                <p className="mb-6 text-gray-600">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-colors"
                >
                    OK
                </button>
            </div>
        </div>
    );
};
// -----------------------


const ManualAddSubscriptionPage: React.FC = () => {
    const API_BASE_URL = import.meta.env.VITE_API;
    const [users, setUsers] = useState<IUser[]>([]);
    const [plans, setPlans] = useState<IPlan[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>("");
    const [selectedPlan, setSelectedPlan] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);

    // 💡 NEW STATE for the success modal
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>("");


    // Fetch Users (with search + pagination)
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_BASE_URL}api/subscription/users`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search, page, limit: 10 },
            });
            if (res.data.success) {
                setUsers(res.data.users);
            }
        } catch (err) {
            console.error("Error fetching users:", err);
            toast.error("Failed to fetch users");
        }
    };

    // Fetch Plans
    const fetchPlans = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}api/subscription`);
            setPlans(res.data);
        } catch (err) {
            console.error("Error fetching plans:", err);
            toast.error("Failed to fetch plans");
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [search, page]);

    // Submit manual subscription activation
    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUser || !selectedPlan) {
            toast.error("Please select both a user and a plan.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `${API_BASE_URL}api/subscription/subscribe-user`,
                { userId: selectedUser, planId: selectedPlan, startDate, endDate },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                // 💡 UPDATED SUCCESS LOGIC:
                setSuccessMessage(res.data.message || "Successfully subscription activated.");
                setIsSuccessModalOpen(true); // Open the modal

                // Reset form fields
                setSelectedUser("");
                setSelectedPlan("");
                setStartDate("");
                setEndDate("");
            } else {
                toast.error(res.data.message || "Activation failed.");
            }
        } catch (err) {
            console.error("Manual activation failed:", err);
            toast.error("Failed to activate subscription manually.");
        }
    };

    // 💡 HANDLER to close the modal
    const handleModalClose = () => {
        setIsSuccessModalOpen(false);
    };


    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <MdAddCircleOutline className="text-yellow-500" /> Manual Subscription Activation
            </h1>

            {/* Form */}
            <form
                onSubmit={handleActivate}
                className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto space-y-4"
            >

                {/* Search Input */}
                <div className="mb-5  ">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search user by name or email..."
                        className="w-[650px] max-w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 "
                    />
                </div>
                {/* User Dropdown */}
                <div>
                    <label className=" mb-2 font-semibold text-gray-700 flex items-center gap-2">
                        <MdPerson className="text-yellow-500" /> Select User
                    </label>
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    >
                        <option value="">-- Choose a user --</option>
                        {users.map((u) => (
                            <option key={u._id} value={u._id}>
                                {u.name} ({u.email})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Plan Dropdown */}
                <div>
                    <label className=" mb-2 font-semibold text-gray-700 flex items-center gap-2">
                        <MdCreditCard className="text-yellow-500" /> Select Plan
                    </label>
                    <select
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    >
                        <option value="">-- Choose a plan --</option>
                        {plans.map((p) => (
                            <option key={p._id} value={p._id}>
                                {p.title} — {p.durationInDays} days (₹{p.price})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Optional Dates */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className=" mb-2 font-semibold text-gray-700 flex items-center gap-2">
                            <MdEvent className="text-yellow-500" /> Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>

                    <div className="flex-1">
                        <label className=" mb-2 font-semibold text-gray-700 flex items-center gap-2">
                            <MdEvent className="text-yellow-500" /> End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <MdAddCircleOutline className="text-xl" /> Activate Subscription
                </button>
            </form>

            {/* 💡 RENDER THE MODAL CONDITONALLY */}
            {isSuccessModalOpen && (
                <SuccessModal
                    message={successMessage}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};

export default ManualAddSubscriptionPage;