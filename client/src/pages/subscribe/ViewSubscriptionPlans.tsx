import { useState, useEffect, type FormEvent } from "react";
import axios from "axios";
import { MdEdit, MdDelete, MdAdd, MdClose } from "react-icons/md";

interface SubscriptionPlan {
  _id: string;
  title: string;
  description?: string;
  price: number;
  durationInDays: number;
  createdAt: string;
  updatedAt: string;
}

export default function ViewSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [durationInDays, setDurationInDays] = useState<number>(30);

  const API_BASE_URL = import.meta.env.VITE_API;

  // ✅ Fetch all plans
  const fetchPlans = async () => {
    try {
      const response = await axios.get<SubscriptionPlan[]>(
        `${API_BASE_URL}api/subscription`
      );
      setPlans(response.data);
    } catch (err) {
      setError("Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // ✅ Handle Delete
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_BASE_URL}api/subscription/admin/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPlans(plans.filter((plan) => plan._id !== id));
        alert("Plan deleted successfully!");
      } catch (err) {
        alert("Failed to delete plan.");
      }
    }
  };

  // ✅ Open Add Form
  const openAddForm = () => {
    setShowForm(true);
    setIsEditing(false);
    setTitle("");
    setDescription("");
    setPrice(0);
    setDurationInDays(30);
    setCurrentId(null);
  };

  // ✅ Open Edit Form
  const openEditForm = (plan: SubscriptionPlan) => {
    setShowForm(true);
    setIsEditing(true);
    setTitle(plan.title);
    setDescription(plan.description || "");
    setPrice(plan.price);
    setDurationInDays(plan.durationInDays);
    setCurrentId(plan._id);
  };

  // ✅ Handle Submit (Add / Edit)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentId) {
        await axios.put(`${API_BASE_URL}api/subscription/admin/${currentId}`, {
          title,
          description,
          price,
          durationInDays,
        },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
      );
        alert("Plan updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}api/subscription/admin`, {
          title,
          description,
          price,
          durationInDays,
        });
        alert("Plan created successfully!");
      }
      setShowForm(false);
      fetchPlans();
    } catch (err) {
      alert("Failed to save plan.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">
          Loading subscription plans...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center">
          <strong className="font-bold">Error!</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Subscription Plans
          </h2>
          <button
            onClick={openAddForm}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <MdAdd className="text-xl" /> Add New Plan
          </button>
        </div>

        {/* ✅ Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Duration
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.map((plan) => (
                <tr key={plan._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {plan.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {plan.description || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    ₹{plan.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {plan.durationInDays} days
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium">
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => openEditForm(plan)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <MdEdit className="text-lg" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <MdDelete className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Modal Form */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowForm(false)}
            >
              <MdClose size={24} />
            </button>
            <h3 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Plan" : "Create Plan"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Price (₹)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  value={durationInDays}
                  onChange={(e) => setDurationInDays(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
              >
                {isEditing ? "Update Plan" : "Create Plan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
