import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Full Page Loader Component
const FullPageLoader = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-opacity-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500"></div>
  </div>
);

export default function CreateSubscriptionPlan() {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    durationInDays: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); // Start loader
    setError(null);
    setSuccessMessage(null);

    if (!formData.title || !formData.price || !formData.durationInDays) {
      setError('Title, Price, and Duration are required fields.');
      setLoading(false); // Stop loader on validation error
      return;
    }

    const parsedPrice = parseFloat(formData.price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Price must be a positive number.');
      setLoading(false);
      return;
    }

    const parsedDuration = parseInt(formData.durationInDays, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      setError('Duration in days must be a positive integer.');
      setLoading(false);
      return;
    }
    
    try {
  
      const response = await axios.post(
        `${API_BASE_URL}api/subscription/admin`,
        {
          title: formData.title,
          description: formData.description,
          price: parsedPrice,
          durationInDays: parsedDuration,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.status === 201) {
        setSuccessMessage('Subscription plan created successfully!');
        setFormData({
          title: '',
          description: '',
          price: '',
          durationInDays: '',
        });
        setTimeout(() => {
          navigate('/admin/subscription-plans');
        }, 1500);
      }
    } catch (err) {
      console.error('Error creating subscription plan:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to create plan. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false); // Stop loader after API call completes
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Conditionally render the loader */}
      {loading && <FullPageLoader />}
      
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-6 sm:p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Create New Subscription Plan</h2>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative mb-4" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline ml-2">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-gray-700 text-sm font-semibold mb-2">
              Plan Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
              placeholder="e.g., Monthly Premium, Annual Access"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-700 text-sm font-semibold mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200 resize-y"
              placeholder="Brief description of the plan benefits"
            ></textarea>
          </div>

          <div>
            <label htmlFor="price" className="block text-gray-700 text-sm font-semibold mb-2">
              Price (Rs) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
              placeholder="e.g., 9.99"
              required
            />
          </div>

          <div>
            <label htmlFor="durationInDays" className="block text-gray-700 text-sm font-semibold mb-2">
              Duration in Days <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="durationInDays"
              name="durationInDays"
              value={formData.durationInDays}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
              placeholder="e.g., 30 for monthly, 365 for yearly"
              required
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-lg text-white font-semibold transition duration-300 ease-in-out
              ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2'}`}
            disabled={loading}
          >
            {loading ? 'Creating Plan...' : 'Create Plan'}
          </button>
        </form>
      </div>
    </div>
  );
}